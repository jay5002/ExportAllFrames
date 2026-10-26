import { createClient } from "npm:@supabase/supabase-js@2";
import { createApp } from "./app.ts";
import { createStore } from "./store.ts";

function requiredEnvironment(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required server environment variable: ${name}`);
  return value;
}

const url = requiredEnvironment("SUPABASE_URL");
const serviceKey = requiredEnvironment("SUPABASE_SERVICE_ROLE_KEY");
const publicKey = requiredEnvironment("SUPABASE_ANON_KEY");
const options = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
};
const server = createClient(url, serviceKey, options);

const app = createApp({
  store: createStore(server),
  async authenticate(token) {
    const { data, error } = await server.auth.getUser(token);
    return error ? null : data.user;
  },
  async register({ email, password, name, redirectTo }) {
    // Keep signup session state isolated from other requests and the service client.
    const client = createClient(url, publicKey, options);
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { name }, emailRedirectTo: redirectTo },
    });
    if (error) throw error;
    return data.user;
  },
});

Deno.serve(app.fetch);
