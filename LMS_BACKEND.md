# SkillVerse backend

## Current architecture

- Supabase Auth handles passwords, email confirmation, sessions, refresh, sign-out, and recovery.
- The `make-server-6593f319` Edge Function verifies each user's access token with Auth.
- Server-owned profiles allow only `student` and `instructor`. Signup allows either role; an existing account cannot change roles through profile updates or editable Auth metadata.
- Instructors manage only their own courses, lesson content, assessments, announcements, and grading.
- Students enroll in published courses; progress, submissions, attempts, and announcement read status belong to their accounts.
- Course publication requires content or a video for every lesson. Quiz answer keys remain on the server.
- The versioned `skillverse:v2:` records are separate from the previous browser-scoped demo data. No fake learners or sample grades are migrated into real accounts.

This is an LMS implementation on the existing Make KV table, not a production compliance guarantee. Do not use a Make prototype for sensitive student records without a separate security, privacy, scalability, and operational review.

## Deploy

### Actual target and credentials

- Backend target: Supabase project `gisavxdkolkzulcxgmul`, Edge Function `make-server-6593f319`.
- Live API base: `https://gisavxdkolkzulcxgmul.supabase.co/functions/v1/make-server-6593f319`.
- The Vite frontend is published separately by Figma Make. `.figma/make/deploy` publishes `dist`; it does not contain a Supabase function deployment command.
- No published frontend URL is recorded in the checked repository configuration. A localhost preview URL is not a live deployment URL.

The existing `SUPABASE_ACCESS_TOKEN` must be securely injected into the **process environment of the deployment runner**, not into the Vite bundle or the function's application settings. Never print it, put it on a command line, source a populated secrets file, or use a `VITE_` name.

The Make card reported that the secret was saved, but the agent terminal does not receive it. A read-only `supabase functions list` also failed with “Access token not provided”, so there is no working CLI login fallback in this terminal. This establishes an environment-scope/injection problem, not that the saved token is invalid. The available Make tools do not expose a supported secret-to-terminal bridge, and the underlying reason for that platform behavior is not observable here.

For an existing Make secret, review **Make settings → Secrets**; do not create another card for the same name. If Make does not support injecting it into a deployment worker, use an authorized external runner's native encrypted/masked secrets mechanism. For example, in a GitHub Actions job with the repository checked out and Node/pnpm installed:

```yaml
- name: Deploy and verify SkillVerse API
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
  run: pnpm backend:deploy
```

This is an example of supported CI environment injection, **not** a workflow that has been installed or run. Configure the secret in that runner's protected secret store; the Make secret is not automatically copied there. Do not send a token in chat. The CLI reports `edge_functions_write` as the required scoped deployment permission; reading deployment version metadata additionally requires `edge_functions_read`. These deployment permissions do not approve database changes.

### Exact supported command

The command/flags were checked against Supabase CLI **2.122.0**:

```sh
pnpm dlx supabase@2.122.0 functions deploy make-server-6593f319 --project-ref gisavxdkolkzulcxgmul --use-api --no-verify-jwt
```

Prefer this guarded repository entry point:

```sh
pnpm backend:deploy
```

It checks that `main.ts` serves the completed LMS application rather than a health-only scaffold, refuses deployment when the token is absent, inherits the runner environment without copying the secret, deploys only this function, and runs read-only live checks afterward. A CLI exit code alone is not treated as successful live authentication. The script never executes SQL or `db push`, and does not use `--prune`.

1. Obtain explicit approval for the permission-changing SQL described below before applying it. Do **not** run it automatically as part of deployment.
2. `supabase/config.toml` sets the entrypoint to `supabase/functions/server/main.ts`. The API bundler includes its imported `app.ts` and `store.ts`; do not upload the health-only template or deploy a different folder/slug.
3. Confirm the standard Edge Function secrets exist: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_ANON_KEY`. Service credentials must never be exposed to the frontend.
4. In Supabase Authentication → URL Configuration, set the published SkillVerse URL as Site URL and allow these callbacks for each actual preview or production origin:
   - `<origin>/login` for email confirmation.
   - `<origin>/reset-password` for recovery.
5. Leave email confirmation enabled. Configure custom SMTP for reliable delivery outside a small test environment.

`GET /functions/v1/make-server-6593f319/health` must return:

```json
{ "status": "ok", "version": "2.1.0", "authentication": true }
```

An unversioned `{ "status": "ok" }` is the health-only scaffold, and `2.0.0` is a stale build missing the instructor, sample-course and assessment routes. `/auth/me` should return `401` without a valid user token, not `404`.

The function gateway uses the public key. Requests send the user's token in `X-Access-Token`; the application verifies it using `auth.getUser`. `verify_jwt = false` does **not** remove application authentication.

### SQL review — not applied, approval required

File: `supabase/migrations/20261001000000_skillverse_records_access.sql`.

- Creates `public.kv_store_6593f319` only if absent, with a text primary key and non-null JSONB value. It does not validate or rewrite an already existing schema.
- Enables row-level security on that table.
- Revokes **all table privileges** from `PUBLIC`, `anon`, and `authenticated`.
- Grants all table privileges to `service_role`, used only by the authenticated server.
- Contains no `DROP`, `TRUNCATE`, `DELETE`, or record rewrite.

Although it does not delete data, the access changes affect the **entire KV table**, including old demo records and any other consumers, not just `skillverse:v2:` rows. Direct browser queries using public or user credentials may stop working, and existing policies cannot grant table privileges back. An owner/service-role server remains the intended access path.

Before approving, check existing consumers, grants, policies, and backup/rollback arrangements. These inspection queries are read-only:

```sql
select relrowsecurity
from pg_class
where oid = to_regclass('public.kv_store_6593f319');

select grantee, privilege_type
from information_schema.table_privileges
where table_schema = 'public' and table_name = 'kv_store_6593f319';

select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'kv_store_6593f319';
```

Applying this file remains pending explicit confirmation. No database changes were made during the deployment investigation.

### Live investigation findings

The frontend's URL construction, Supabase function slug, Hono prefix `/make-server-6593f319`, and CLI entrypoint configuration agree. Do not add the slug twice or redirect API calls to the frontend.

At the latest investigation:

- `GET /health` with the public key returned HTTP 200 with the old unversioned `{ "status": "ok" }`.
- `GET /auth/me` returned HTTP 404 with either the public key alone or an invalid user token.
- Without an authorization header, the gateway returned HTTP 401 rather than the expected application error shape. The currently effective gateway configuration therefore does not match the prepared `verify_jwt = false` deployment.
- CORS preflight returned HTTP 204, but allowed `Content-Type,Authorization,X-Workspace`, **not** the required `X-Access-Token`.
- Make regenerates `index.tsx` as a health-only template, so the real entrypoint is `main.ts` (referenced by `supabase/config.toml`). Do not deploy `index.tsx`.
- Managed deployment version/timestamp could not be listed because the CLI has no deployment credential. The responses prove the live function does not expose the expected authenticated API; they do not identify a particular deployment version.

Expected after deployment: versioned health, application JSON `401` for absent/invalid user sessions, `200` with the account profile for a valid session, and CORS allowing `X-Access-Token`. The public/invalid-session smoke check cannot establish successful login or any signed-in LMS workflow.

## Verification

```sh
pnpm backend:check
pnpm backend:deployment-test
pnpm exec tsc --noEmit
pnpm build
pnpm dlx deno test --no-config --node-modules-dir=auto supabase/functions/server/app.test.ts
pnpm dlx deno check --no-config --node-modules-dir=auto supabase/functions/server/main.ts
pnpm backend:verify-live
```

The original nine backend tests are preserved and use an in-memory store to exercise authorization, ownership, sequential progress, submissions, grading, per-user announcements, and server scoring. The additional deployment tests detect entrypoint regression, accidental frontend-token fallbacks, and unsafe deployment arguments. They are not substitutes for checking the deployed Auth, database, and email provider. A nonzero `backend:verify-live` exit is a failed live check, even if all local tests pass.

### Live acceptance flow

1. Create an Instructor and two Student accounts with email addresses you control; confirm them.
2. As Instructor, create a course, fill every lesson, add an assignment and quiz, and publish it.
3. As Student, enroll, open the lessons, complete one, submit work, and take the quiz.
4. Reload or sign in from a second browser and confirm progress, submissions, and attempts persist.
5. Grade the work and send an announcement as Instructor. Confirm the Student receives the grade, feedback, and announcement.
6. Confirm the second Student cannot see the first Student's work, grades, or progress, and cannot access instructor routes or mutations.
7. Confirm another Instructor cannot modify the first Instructor's courses or grade their students.
8. Test password recovery and sign-out. Unauthenticated visits to protected pages should return to login.

## Sample courses

- `POST /seed/sample-courses` (instructor only) writes three published courses (JavaScript Fundamentals, SQL and Database Essentials, Data Structures and Algorithms with JavaScript) with 3 modules, 6 lessons, one quiz and one assignment each. Content lives in `supabase/functions/server/sample-content.ts`.
- IDs are fixed (`sample-<slug>`), inserts never overwrite, so repeating the call cannot reset enrollments or progress. The calling instructor owns the courses and can edit, unpublish or delete-by-unpublishing them.
- Instructors trigger it with **Load sample courses** on the Instructor dashboard. It needs the redeployed function (`pnpm backend:deploy`). No SQL or schema change is required: records are rows in the existing `kv_store_6593f319` table.
- Added routes: `GET /courses/:id/assessments`, `PUT /assignments/:id`, `PUT /quizzes/:id`; `PUT /courses/:id` now also edits title, description, category, difficulty, duration and thumbnail.
