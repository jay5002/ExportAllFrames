import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { deploymentArguments, hasDeploymentToken, inspectEntrypoint } from "./lms-deployment.mjs";

test("the actual server entrypoint wires the LMS factory, store, and HTTP handler", async () => {
  inspectEntrypoint(await readFile(new URL("../supabase/functions/server/main.ts", import.meta.url), "utf8"));
});

test("a health-only scaffold cannot pass the deployment guard", () => {
  assert.throws(() => inspectEntrypoint('import { Hono } from "npm:hono"; const app = new Hono(); Deno.serve(app.fetch);'));
});

test("unused LMS imports cannot disguise a scaffold", () => {
  assert.throws(() => inspectEntrypoint(`
    import { createApp } from "./app.ts";
    import { createStore } from "./store.ts";
    const app = new Hono();
    Deno.serve(app.fetch);
  `));
});

test("deploy requires the exact server-only secret without a frontend or provider fallback", () => {
  assert.equal(hasDeploymentToken({}), false);
  assert.equal(hasDeploymentToken({ SUPABASE_ACCESS_TOKEN: "  " }), false);
  assert.equal(hasDeploymentToken({ VITE_SUPABASE_ACCESS_TOKEN: "test-placeholder" }), false);
  assert.equal(hasDeploymentToken({ SUPABASE_ACCESS_TOKEN: "test-placeholder" }), true);
});

test("the command deploys only the configured function using the supported API bundler", () => {
  const args = deploymentArguments("gisavxdkolkzulcxgmul");
  assert.deepEqual(args, ["dlx", "supabase@2.122.0", "functions", "deploy", "make-server-6593f319",
    "--project-ref", "gisavxdkolkzulcxgmul", "--use-api", "--no-verify-jwt"]);
  assert.ok(!args.includes("--prune"));
  assert.ok(!args.includes("db"));
});
