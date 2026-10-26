import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import type { Store } from "./app.ts";

const table = "kv_store_6593f319";
export function createStore(client: SupabaseClient): Store {
  return {
    async get(key) {
      const { data, error } = await client.from(table).select("value").eq("key", key).maybeSingle();
      if (error) throw error;
      return data?.value;
    },
    async set(key, value) {
      const { error } = await client.from(table).upsert({ key, value });
      if (error) throw error;
    },
    async insert(key, value) {
      const { error } = await client.from(table).insert({ key, value });
      if (error?.code === "23505") return false;
      if (error) throw error;
      return true;
    },
    async advance(key, expected, value) {
      const { data, error } = await client.from(table).update({ value }).eq("key", key).eq("value->>completed", String(expected)).select("key");
      if (error) throw error;
      return !!data?.length;
    },
    async getByPrefix(prefix) {
      const values: unknown[] = [];
      const pageSize = 500;
      for (let offset = 0; ; offset += pageSize) {
        const { data, error } = await client.from(table).select("value").like("key", `${prefix}%`).order("key").range(offset, offset + pageSize - 1);
        if (error) throw error;
        values.push(...data.map(item => item.value));
        if (data.length < pageSize) return values;
      }
    },
  };
}
