import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface QueueMessage<T = unknown> {
  id: string;
  queue: string;
  payload: T;
  created_at: string;
  attempts: number;
}

export interface QueueClient {
  send<T>(queue: string, payload: T): Promise<string>;
  poll<T>(queue: string): Promise<QueueMessage<T> | null>;
  ack(messageId: string): Promise<void>;
  fail(messageId: string, error: string): Promise<void>;
  subscribe(queue: string, handler: (message: QueueMessage) => Promise<void>): () => void;
}

export function createQueueClient(
  supabaseUrl: string,
  serviceRoleKey: string
): QueueClient {
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  return {
    async send<T>(queue: string, payload: T): Promise<string> {
      const { data, error } = await supabase
        .from("event_log")
        .insert({
          event_type: queue,
          payload,
          entity_type: "queue_message",
          entity_id: crypto.randomUUID(),
        })
        .select("id")
        .single();

      if (error) throw new Error(`Queue send failed: ${error.message}`);
      return data.id;
    },

    async poll<T>(queue: string): Promise<QueueMessage<T> | null> {
      const { data, error } = await supabase
        .from("event_log")
        .select("*")
        .eq("event_type", queue)
        .eq("processed", false)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        queue,
        payload: data.payload as T,
        created_at: data.created_at,
        attempts: data.attempts || 0,
      };
    },

    async ack(messageId: string): Promise<void> {
      const { error } = await supabase
        .from("event_log")
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq("id", messageId);

      if (error) throw new Error(`Queue ack failed: ${error.message}`);
    },

    async fail(messageId: string, errorMsg: string): Promise<void> {
      const { error } = await supabase.rpc("increment_event_attempts", {
        event_id: messageId,
        error_message: errorMsg,
      });

      if (error) throw new Error(`Queue fail failed: ${error.message}`);
    },

    subscribe(
      queue: string,
      handler: (message: QueueMessage) => Promise<void>
    ): () => void {
      const channel = supabase
        .channel(`queue:${queue}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "event_log",
            filter: `event_type=eq.${queue}`,
          },
          async (payload) => {
            const msg: QueueMessage = {
              id: payload.new.id,
              queue,
              payload: payload.new.payload,
              created_at: payload.new.created_at,
              attempts: 0,
            };
            await handler(msg);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
  };
}

export function createPollingWorker(
  client: QueueClient,
  queue: string,
  handler: (message: QueueMessage) => Promise<void>,
  options: { pollIntervalMs?: number; maxRetries?: number } = {}
) {
  const { pollIntervalMs = 1000, maxRetries = 3 } = options;
  let running = true;

  async function loop() {
    while (running) {
      try {
        const message = await client.poll(queue);

        if (!message) {
          await new Promise((r) => setTimeout(r, pollIntervalMs));
          continue;
        }

        if (message.attempts >= maxRetries) {
          await client.fail(message.id, "Max retries exceeded — sent to DLQ");
          continue;
        }

        try {
          await handler(message);
          await client.ack(message.id);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          await client.fail(message.id, errorMsg);
        }
      } catch (err) {
        console.error("Worker loop error:", err);
        await new Promise((r) => setTimeout(r, pollIntervalMs * 2));
      }
    }
  }

  loop();

  return {
    stop: () => {
      running = false;
    },
  };
}
