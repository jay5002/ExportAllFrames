import { createApp, type Dependencies, type Store } from "./app.ts";

function equal(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
function setup() {
  const records = new Map<string, any>();
  const store: Store = {
    get: async key => structuredClone(records.get(key)),
    set: async (key, value) => { records.set(key, structuredClone(value)); },
    insert: async (key, value) => {
      if (records.has(key)) return false;
      records.set(key, structuredClone(value)); return true;
    },
    advance: async (key, expected, value) => {
      if (records.get(key)?.completed !== expected) return false;
      records.set(key, structuredClone(value)); return true;
    },
    getByPrefix: async prefix => [...records.entries()].filter(([key]) => key.startsWith(prefix)).map(([, value]) => structuredClone(value)),
  };
  const users = new Map<string, { id: string; user_metadata: Record<string, unknown> }>();
  for (const [id, role] of [["teacher", "instructor"], ["other-teacher", "instructor"], ["student", "student"], ["other-student", "student"]]) {
    users.set(id, { id, user_metadata: { name: id, role: "instructor" } });
    records.set(`skillverse:v2:profile:${id}`, { id, name: id, role });
  }
  users.set("forged-metadata", { id: "forged-metadata", user_metadata: { name: "Untrusted", role: "instructor" } });
  const dependencies: Dependencies = {
    store,
    authenticate: async token => users.get(token) || null,
    register: async input => ({ id: input.email, identities: [{}] }),
  };
  const app = createApp(dependencies);
  async function request(path: string, token = "teacher", method = "GET", body?: unknown) {
    const response = await app.request(`/make-server-6593f319${path}`, {
      method, headers: { "Content-Type": "application/json", ...(token ? { "X-Access-Token": token } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, data: await response.json() };
  }
  async function course() {
    const result = await request("/courses", "teacher", "POST", { name: "Permission testing", description: "Test curriculum", lessons: 2 });
    equal(result.status, 201);
    const id = result.data.id;
    equal((await request(`/courses/${id}/lessons`, "teacher", "PUT", {
      lessons: [{ title: "First lesson", content: "First content" }, { title: "Second lesson", content: "Second content" }],
    })).status, 200);
    equal((await request(`/courses/${id}`, "teacher", "PUT", { status: "Published" })).status, 200);
    return id as string;
  }
  return { records, store, request, course, dependencies };
}

Deno.test("health is public; protected APIs require a verified session", async () => {
  const { request } = setup();
  equal((await request("/health", "")).data.version, "2.1.0");
  for (const path of ["/auth/me", "/workspace", "/enrollments", "/assignments", "/quizzes", "/messages"]) {
    equal((await request(path, "")).status, 401);
    equal((await request(path, "invalid")).status, 401);
  }
});

Deno.test("roles are server-owned and registration never overwrites existing roles", async () => {
  const { request, records } = setup();
  equal((await request("/auth/me", "forged-metadata")).data.role, "student");
  equal((await request("/auth/me", "student", "PUT", { name: "Updated", role: "instructor" })).data.role, "student");
  for (const id of ["student", "forged-metadata"]) {
    equal((await request("/courses", id, "POST", { name: "Forbidden", lessons: 1 })).status, 403);
  }
  const input = { email: "test@example.invalid", password: "A-long-test-password", name: "New Instructor", role: "instructor", redirectTo: "https://example.invalid/login" };
  equal((await request("/auth/register", "", "POST", input)).status, 201);
  equal(records.get("skillverse:v2:profile:test@example.invalid").role, "instructor");
  equal((await request("/auth/register", "", "POST", { ...input, role: "student" })).status, 201);
  equal(records.get("skillverse:v2:profile:test@example.invalid").role, "instructor");
  equal((await request("/auth/register", "", "POST", { ...input, role: "admin" })).status, 400);
});

Deno.test("only the course owner can author and publish; incomplete lessons cannot publish", async () => {
  const { request } = setup();
  const created = await request("/courses", "teacher", "POST", { name: "Draft", lessons: 1 });
  const id = created.data.id;
  equal((await request(`/courses/${id}`, "teacher", "PUT", { status: "Published" })).status, 400);
  equal((await request(`/courses/${id}/lessons`, "other-teacher", "PUT", { lessons: [] })).status, 403);
  equal((await request(`/courses/${id}/lessons`, "teacher", "PUT", { lessons: [{ title: "Lesson", videoUrl: "javascript:alert(1)" }] })).status, 400);
  equal((await request("/workspace", "student")).data.courses.length, 0);
  equal((await request("/workspace", "other-teacher")).data.courses.length, 0);
  equal((await request(`/courses/${id}/lessons`, "student")).status, 403);
});

Deno.test("enrollments persist per account and lesson progress must be sequential", async () => {
  const { request, course } = setup();
  const id = await course();
  equal((await request(`/courses/${id}/lessons`, "student")).status, 403);
  equal((await request(`/enrollments/${id}`, "student", "PUT", { completed: 1 })).status, 400);
  equal((await request(`/enrollments/${id}`, "student", "PUT", { completed: 0 })).status, 200);
  equal((await request(`/courses/${id}/lessons`, "student")).data.length, 2);
  equal((await request(`/enrollments/${id}`, "student", "PUT", { completed: 2 })).status, 400);
  equal((await request(`/enrollments/${id}`, "student", "PUT", { completed: 1 })).status, 200);
  equal((await request(`/enrollments/${id}`, "student", "PUT", { completed: 0 })).status, 400);
  equal((await request("/enrollments", "student")).data[0].completed, 1);
  equal((await request("/enrollments", "other-student")).data.length, 0);
  equal((await request("/workspace", "teacher")).data.students[0].progress, 50);
  equal((await request("/workspace?view=learning", "other-teacher")).data.courses.length, 1);
});

Deno.test("assignments and grading are durable and visible only to the learner and course owner", async () => {
  const { request, course } = setup();
  const courseId = await course();
  const created = await request("/assignments", "teacher", "POST", { courseId, title: "Build it", description: "Submit your work", dueDate: "2030-01-01" });
  equal(created.status, 201);
  const id = created.data.id;
  equal((await request("/assignments", "other-student")).data.length, 0);
  equal((await request(`/assignments/${id}/submit`, "student", "POST", { content: "My work" })).status, 403);
  await request(`/enrollments/${courseId}`, "student", "PUT", { completed: 0 });
  const submitted = await request(`/assignments/${id}/submit`, "student", "POST", { content: "My work" });
  equal(submitted.status, 201);
  equal((await request(`/assignments/${id}/submit`, "student", "POST", { content: "Overwrite" })).status, 409);
  equal((await request(`/submissions/${submitted.data.id}`, "other-teacher", "PUT", { score: 100 })).status, 403);
  equal((await request(`/submissions/${submitted.data.id}`, "student", "PUT", { score: 100 })).status, 403);
  equal((await request(`/submissions/${submitted.data.id}`, "teacher", "PUT", { score: 101 })).status, 400);
  equal((await request(`/submissions/${submitted.data.id}`, "teacher", "PUT", { score: 92, feedback: "Well done" })).status, 200);
  const assignment = (await request("/assignments", "student")).data[0];
  equal(assignment.submission.content, "My work");
  equal(assignment.submission.score, 92);
  equal((await request("/workspace", "other-student")).data.submissions.length, 0);
  equal((await request("/workspace", "other-teacher")).data.submissions.length, 0);
});

Deno.test("quiz answers stay on the server and the server calculates saved scores", async () => {
  const { request, course } = setup();
  const courseId = await course();
  const created = await request("/quizzes", "teacher", "POST", { courseId, title: "Quiz", questions: [{ q: "Correct?", options: ["No", "Yes"], answer: 1 }] });
  equal(created.status, 201);
  const id = created.data.id;
  equal((await request("/quizzes", "student")).data.length, 0);
  await request(`/enrollments/${courseId}`, "student", "PUT", { completed: 0 });
  const quiz = (await request("/quizzes", "student")).data[0];
  equal("answer" in quiz.questions[0], false);
  equal((await request(`/quizzes/${id}/attempts`, "other-student", "POST", { answers: [1] })).status, 403);
  equal((await request(`/quizzes/${id}/attempts`, "student", "POST", { answers: [0], score: 100 })).data.score, 0);
  equal((await request(`/quizzes/${id}/attempts`, "student", "POST", { answers: [] })).status, 400);
  equal((await request(`/quizzes/${id}/attempts`, "student", "POST", { answers: [2] })).status, 400);
  equal((await request(`/quizzes/${id}/attempts`, "student", "POST", { answers: [1] })).data.score, 100);
  equal((await request("/quizzes", "student")).data[0].bestScore, 100);
  equal((await request("/quizzes", "student")).data[0].attempts, 2);
});

Deno.test("announcements are limited to the instructor's learners and read status is per user", async () => {
  const { request, course } = setup();
  const id = await course();
  const message = await request("/messages", "teacher", "POST", { audience: "all", body: "Class update" });
  equal(message.status, 201);
  equal((await request("/messages", "student")).data.length, 0);
  await request(`/enrollments/${id}`, "student", "PUT", { completed: 0 });
  await request(`/enrollments/${id}`, "other-student", "PUT", { completed: 0 });
  equal((await request("/messages", "student")).data[0].read, false);
  equal((await request(`/messages/${message.data.id}`, "student", "PUT", {})).status, 200);
  equal((await request("/messages", "student")).data[0].read, true);
  equal((await request("/messages", "other-student")).data[0].read, false);
  equal((await request(`/messages/${message.data.id}`, "other-teacher", "PUT", {})).status, 404);
  equal((await request("/messages", "student", "POST", { audience: "all", body: "Forbidden" })).status, 403);
});

Deno.test("invalid JSON object shapes return validation errors rather than server failures", async () => {
  const { request, course } = setup();
  const id = await course();
  equal((await request("/courses", "teacher", "POST", null)).status, 400);
  equal((await request(`/courses/${id}/lessons`, "teacher", "PUT", { lessons: [null, null] })).status, 400);
  equal((await request("/quizzes", "teacher", "POST", { courseId: id, title: "Bad shape", questions: [null] })).status, 400);
});

Deno.test("parallel submissions cannot overwrite each other; course announcements use record IDs", async () => {
  const { request, course } = setup();
  const courseId = await course();
  await request(`/enrollments/${courseId}`, "student", "PUT", { completed: 0 });
  const assignment = await request("/assignments", "teacher", "POST", { courseId, title: "One submission", description: "Submit once", dueDate: "2030-01-01" });
  const submissions = await Promise.all([
    request(`/assignments/${assignment.data.id}/submit`, "student", "POST", { content: "First" }),
    request(`/assignments/${assignment.data.id}/submit`, "student", "POST", { content: "Second" }),
  ]);
  equal(submissions.map(item => item.status).sort(), [201, 409]);
  equal((await request("/messages", "teacher", "POST", { audience: courseId, body: "Course-specific update" })).status, 201);
  equal((await request("/messages", "student")).data.length, 1);
  equal((await request("/messages", "other-student")).data.length, 0);
  equal((await request("/messages", "other-teacher", "POST", { audience: courseId, body: "Not my course" })).status, 400);
});

Deno.test("sample courses: instructor-only, complete, idempotent, and usable by students end to end", async () => {
  const { request, records } = setup();
  equal((await request("/seed/sample-courses", "student", "POST")).status, 403);
  equal((await request("/seed/sample-courses", "", "POST")).status, 401);

  const seeded = await request("/seed/sample-courses", "teacher", "POST");
  equal(seeded.status, 201);
  equal(seeded.data.courses.map((item: any) => item.created), [true, true, true]);
  equal(seeded.data.courses.map((item: any) => item.name), ["JavaScript Fundamentals", "SQL and Database Essentials", "Data Structures and Algorithms with JavaScript"]);

  // Idempotent and never takes over or resets existing records.
  const again = await request("/seed/sample-courses", "other-teacher", "POST");
  equal(again.data.courses.map((item: any) => [item.created, item.yours]), [[false, false], [false, false], [false, false]]);
  equal(records.get("skillverse:v2:course:sample-javascript-fundamentals").instructorId, "teacher");

  // Persisted records are complete.
  for (const course of seeded.data.courses) {
    const saved = records.get(`skillverse:v2:course:${course.id}`);
    const lessons = records.get(`skillverse:v2:lessons:${course.id}`);
    equal(saved.status, "Published");
    for (const field of ["description", "thumbnail", "category", "difficulty", "duration"]) if (!saved[field]) throw new Error(`${course.id} missing ${field}`);
    equal(lessons.length, saved.lessons);
    const modules = new Map<string, number>();
    for (const lesson of lessons) {
      if (!lesson.description || lesson.content.length < 400) throw new Error(`${course.id} lesson ${lesson.title} is too thin`);
      modules.set(lesson.module, (modules.get(lesson.module) || 0) + 1);
    }
    if (modules.size < 3 || [...modules.values()].some(count => count < 2)) throw new Error(`${course.id} needs 3+ modules with 2+ lessons`);
    if (records.get(`skillverse:v2:quiz:${course.id}-quiz`).questions.length < 5) throw new Error("quiz too short");
    if (!records.get(`skillverse:v2:assignment:${course.id}-assignment`).description) throw new Error("missing assignment");
  }

  // Student journey.
  const id = "sample-javascript-fundamentals";
  const catalog = await request("/workspace?view=learning", "student");
  equal(catalog.data.courses.length, 3);
  equal((await request(`/courses/${id}/lessons`, "student")).status, 403);
  equal((await request(`/enrollments/${id}`, "student", "PUT", { completed: 0 })).status, 200);
  equal((await request(`/courses/${id}/lessons`, "student")).data.length, 6);
  equal((await request(`/enrollments/${id}`, "student", "PUT", { completed: 1 })).data.completed, 1);
  equal((await request("/enrollments", "student")).data[0].completed, 1);

  const quizzes = (await request("/quizzes", "student")).data;
  equal(quizzes.length, 1);
  if (JSON.stringify(quizzes).includes('"answer"')) throw new Error("answer key leaked");
  const attempt = await request(`/quizzes/${id}-quiz/attempts`, "student", "POST", { answers: [2, 1, 2, 0, 1] });
  equal([attempt.status, attempt.data.score], [201, 100]);
  const assignments = (await request("/assignments", "student")).data;
  equal([assignments.length, assignments[0].submission], [1, null]);
  equal((await request(`/assignments/${id}-assignment/submit`, "student", "POST", { content: "My to-do list" })).status, 201);
  equal((await request("/assignments", "student")).data[0].submission.status, "Pending");
  equal((await request("/assignments", "other-student")).data.length, 0);
});

Deno.test("instructors edit course details and assessments; students and other instructors cannot", async () => {
  const { request } = setup();
  await request("/seed/sample-courses", "teacher", "POST");
  const id = "sample-sql-database-essentials";
  const edited = await request(`/courses/${id}`, "teacher", "PUT", { name: "SQL Mastery", difficulty: "Advanced", thumbnail: "https://example.com/a.jpg" });
  equal([edited.status, edited.data.name, edited.data.difficulty, edited.data.status], [200, "SQL Mastery", "Advanced", "Published"]);
  equal((await request(`/courses/${id}`, "teacher", "PUT", { thumbnail: "http://example.com/a.jpg" })).status, 400);
  equal((await request(`/courses/${id}`, "teacher", "PUT", { difficulty: "Expert" })).status, 400);
  equal((await request(`/courses/${id}`, "student", "PUT", { name: "Hacked" })).status, 403);
  equal((await request(`/courses/${id}`, "other-teacher", "PUT", { name: "Hacked" })).status, 403);
  equal((await request(`/courses/${id}`, "teacher", "PUT", { status: "Draft" })).data.status, "Draft");
  equal((await request("/workspace?view=learning", "student")).data.courses.length, 2);
  equal((await request(`/courses/${id}`, "teacher", "PUT", { status: "Published" })).data.status, "Published");

  const full = await request(`/courses/${id}/assessments`, "teacher");
  equal([full.data.quizzes.length, full.data.assignments.length], [1, 1]);
  equal((await request(`/courses/${id}/assessments`, "student")).status, 403);
  equal((await request(`/assignments/${id}-assignment`, "teacher", "PUT", { title: "New title", description: "New instructions", dueDate: "2027-01-01" })).data.title, "New title");
  equal((await request(`/assignments/${id}-assignment`, "student", "PUT", { title: "x", description: "x", dueDate: "2027-01-01" })).status, 403);
  const questions = [{ q: "Pick one", options: ["a", "b"], answer: 1 }];
  equal((await request(`/quizzes/${id}-quiz`, "teacher", "PUT", { title: "Short quiz", questions })).status, 200);
  equal((await request(`/quizzes/${id}-quiz`, "other-teacher", "PUT", { title: "x", questions })).status, 403);
  equal((await request(`/quizzes/${id}-quiz`, "teacher", "PUT", { title: "x", questions: [{ q: "q", options: ["a"], answer: 0 }] })).status, 400);
  equal((await request(`/courses/${id}/assessments`, "teacher")).data.quizzes[0].title, "Short quiz");
});
