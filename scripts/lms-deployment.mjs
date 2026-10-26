import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = new URL("../", import.meta.url);
const slug = "make-server-6593f319";
const cliVersion = "2.122.0";

export function inspectEntrypoint(source) {
  const tree = ts.createSourceFile("main.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const imports = tree.statements.filter(ts.isImportDeclaration);
  function importsFunction(name, from) {
    return imports.some(statement => statement.moduleSpecifier.text === from &&
      statement.importClause?.namedBindings && ts.isNamedImports(statement.importClause.namedBindings) &&
      statement.importClause.namedBindings.elements.some(element => element.name.text === name && (element.propertyName?.text || element.name.text) === name));
  }
  assert.ok(importsFunction("createApp", "./app.ts"), "The entrypoint must import the completed LMS application.");
  assert.ok(importsFunction("createStore", "./store.ts"), "The entrypoint must import the persistent LMS store.");
  const declarations = tree.statements.filter(ts.isVariableStatement).flatMap(statement => [...statement.declarationList.declarations]);
  const application = declarations.find(declaration => ts.isIdentifier(declaration.name) && declaration.name.text === "app")?.initializer;
  assert.ok(application && ts.isCallExpression(application) && application.expression.getText(tree) === "createApp",
    "Refusing to deploy: app must be created by createApp, not a health-only scaffold.");
  const options = application.arguments[0];
  assert.ok(options && ts.isObjectLiteralExpression(options), "createApp must receive its runtime dependencies.");
  const store = options.properties.find(property => ts.isPropertyAssignment(property) && property.name.getText(tree) === "store");
  assert.ok(store && ts.isCallExpression(store.initializer) && store.initializer.expression.getText(tree) === "createStore",
    "The deployed app must use createStore.");
  const servesApplication = tree.statements.some(statement => ts.isExpressionStatement(statement) &&
    ts.isCallExpression(statement.expression) && statement.expression.expression.getText(tree) === "Deno.serve" &&
    statement.expression.arguments[0]?.getText(tree) === "app.fetch");
  assert.ok(servesApplication, "Deno.serve must serve the completed app.fetch.");
}

async function metadata() {
  const source = await readFile(new URL("utils/supabase/info.tsx", root), "utf8");
  const tree = ts.createSourceFile("info.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const values = {};
  for (const statement of tree.statements.filter(ts.isVariableStatement)) {
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.initializer && ts.isStringLiteral(declaration.initializer)) {
        values[declaration.name.text] = declaration.initializer.text;
      }
    }
  }
  assert.match(values.projectId || "", /^[a-z0-9]{20}$/, "Connected Supabase project metadata is missing.");
  assert.ok(values.publicAnonKey, "Connected public API key is missing.");
  return { projectRef: values.projectId, publicKey: values.publicAnonKey };
}

export function deploymentArguments(projectRef) {
  return ["dlx", `supabase@${cliVersion}`, "functions", "deploy", slug,
    "--project-ref", projectRef, "--use-api", "--no-verify-jwt"];
}

export function hasDeploymentToken(environment) {
  return typeof environment.SUPABASE_ACCESS_TOKEN === "string" && !!environment.SUPABASE_ACCESS_TOKEN.trim();
}

async function verifyLive({ projectRef, publicKey }) {
  const base = `https://${projectRef}.supabase.co/functions/v1/${slug}`;
  let failures = 0;
  async function check(label, path, options, expected) {
    try {
      const response = await fetch(`${base}${path}`, { ...options, signal: AbortSignal.timeout(15000) });
      const body = await response.json().catch(() => null);
      const passed = expected(response, body);
      console.log(`${passed ? "PASS" : "FAIL"} ${label}: HTTP ${response.status}`);
      if (!passed) failures++;
    } catch {
      console.error(`FAIL ${label}: network request failed`);
      failures++;
    }
  }
  console.log(`Live API: ${base}`);
  const headers = { Authorization: `Bearer ${publicKey}` };
  await check("LMS health reports API 2.1.0 (instructor, sample-course and assessment routes)", "/health", { headers }, (response, body) =>
    response.status === 200 && body?.version === "2.1.0" && body?.authentication === true);
  const unauthorized = (response, body) => response.status === 401 && typeof body?.error === "string";
  await check("missing credentials must be rejected by the application", "/auth/me", {}, unauthorized);
  await check("public key is not a signed-in user", "/auth/me", { headers }, unauthorized);
  await check("invalid user token must be rejected", "/auth/me",
    { headers: { ...headers, "X-Access-Token": "skillverse-invalid-session-probe" } }, unauthorized);
  await check("browser CORS permits the user-token header", "/auth/me", {
    method: "OPTIONS",
    headers: { Origin: "https://example.invalid", "Access-Control-Request-Method": "GET",
      "Access-Control-Request-Headers": "authorization,content-type,x-access-token" },
  }, response => response.ok && (response.headers.get("access-control-allow-headers") || "").toLowerCase().split(",").map(header => header.trim()).includes("x-access-token"));
  if (failures) throw new Error(`${failures} live checks failed. This does not confirm a working LMS deployment.`);
  console.log("Live routing, CORS, and unauthenticated access checks passed. Signed-in workflows still require test accounts.");
}

async function main() {
  const mode = process.argv[2];
  assert.ok(["check", "verify", "deploy"].includes(mode), "Use check, verify, or deploy.");
  if (mode === "check" || mode === "deploy") {
    inspectEntrypoint(await readFile(new URL("supabase/functions/server/main.ts", root), "utf8"));
    console.log("LMS entrypoint wiring passed.");
  }
  if (mode === "check") return;
  const target = await metadata();
  if (mode === "deploy") {
    if (!hasDeploymentToken(process.env)) {
      throw new Error("SUPABASE_ACCESS_TOKEN is not injected into this deployment process. Configure the existing secret in the deployment runner's masked environment; a saved Make application secret alone does not establish terminal access. No deployment or SQL was attempted.");
    }
    // Inherit the runner's environment. Never copy the token into arguments or files.
    const result = spawnSync("pnpm", deploymentArguments(target.projectRef), {
      cwd: fileURLToPath(root), stdio: "inherit",
    });
    assert.ok(!result.error && result.status === 0, "Supabase CLI deployment failed; live success is unconfirmed.");
    console.log("Supabase CLI completed. Checking the deployed endpoints next.");
  }
  await verifyLive(target);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
