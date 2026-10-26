import { Hono, type Context } from "npm:hono";
import { cors } from "npm:hono/cors";
import { bodyLimit } from "npm:hono/body-limit";
import { HTTPException } from "npm:hono/http-exception";
import { sampleCourses } from "./sample-content.ts";

type User = { id: string; email?: string; user_metadata?: Record<string, unknown>; identities?: unknown[] };
type Profile = { id: string; name: string; role: "student" | "instructor" };
type RecordData = Record<string, any>;
export type Store = {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any) => Promise<void>;
  insert: (key: string, value: any) => Promise<boolean>;
  advance: (key: string, expected: number, value: any) => Promise<boolean>;
  getByPrefix: (prefix: string) => Promise<any[]>;
};
export type Dependencies = {
  store: Store;
  authenticate: (token: string) => Promise<User | null>;
  register: (input: { email: string; password: string; name: string; redirectTo: string }) => Promise<User | null>;
};
const prefix = "/make-server-6593f319";
const root = "skillverse:v2:";
function fail(status: 400 | 401 | 403 | 404 | 409, message: string): never {
  throw new HTTPException(status, { message });
}
function text(value: unknown, max: number, required = true): string {
  if (typeof value !== "string" || value.trim().length > max || (required && !value.trim())) fail(400, "Invalid or missing text field");
  return value.trim();
}
function integer(value: unknown, min: number, max: number) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) fail(400, `Expected a whole number between ${min} and ${max}`);
  return value;
}
function object(value: unknown): RecordData {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(400, "Expected a JSON object");
  return value as RecordData;
}
async function bodyFor(c: Context) {
  return object(await c.req.json());
}
function videoUrl(value: unknown) {
  const raw = text(value ?? "", 2000, false);
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") fail(400, "Video links must use HTTPS");
    return url.href;
  } catch { return fail(400, "Enter a valid HTTPS video link"); }
}
function httpsLink(value: unknown, message: string) {
  const raw = text(value ?? "", 2000, false);
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") fail(400, message);
    return url.href;
  } catch (error) { if (error instanceof HTTPException) throw error; return fail(400, message); }
}
const difficulties = ["Beginner", "Intermediate", "Advanced"];
function courseDetails(body: RecordData, current: RecordData = {}) {
  const pick = (key: string) => body[key] === undefined ? current[key] ?? "" : body[key];
  const difficulty = pick("difficulty");
  if (difficulty !== "" && !difficulties.includes(difficulty)) fail(400, "Choose Beginner, Intermediate, or Advanced");
  return {
    category: text(pick("category"), 60, false), difficulty, duration: text(pick("duration"), 40, false),
    thumbnail: httpsLink(pick("thumbnail"), "Thumbnail links must use HTTPS"),
  };
}
function parseQuestions(value: unknown) {
  if (!Array.isArray(value) || !value.length || value.length > 50) fail(400, "Add between 1 and 50 questions");
  return value.map((entry: unknown) => {
    const item = object(entry);
    if (!Array.isArray(item.options) || item.options.length < 2 || item.options.length > 6) fail(400, "Each question needs 2 to 6 options");
    return { q: text(item.q, 1000), options: item.options.map((option: unknown) => text(option, 500)), answer: integer(item.answer, 0, item.options.length - 1) };
  });
}
const initials = (name: string) => name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();

export function createApp({ store, authenticate, register }: Dependencies) {
  const app = new Hono<{ Variables: { profile: Profile } }>();
  const list = (kind: string) => store.getByPrefix(`${root}${kind}:`);
  const get = (kind: string, id: string) => store.get(`${root}${kind}:${id}`);
  const put = (kind: string, id: string, record: RecordData) => store.set(`${root}${kind}:${id}`, record);
  const profile = (c: Context) => c.get("profile") as Profile;
  const instructor = (c: Context) => {
    const user = profile(c);
    if (user.role !== "instructor") fail(403, "An instructor account is required");
    return user;
  };
  async function courseFor(id: string) {
    const course = await get("course", id);
    if (!course) fail(404, "Course not found");
    return course;
  }
  async function ownedCourse(c: Context, id: string) {
    const user = instructor(c);
    const course = await courseFor(id);
    if (course.instructorId !== user.id) fail(403, "You can only manage your own courses");
    return course;
  }
  async function enrollment(c: Context, courseId: string) {
    return get("enrollment", `${profile(c).id}:${courseId}`);
  }
  async function learnerCourse(c: Context, courseId: string) {
    const course = await courseFor(courseId);
    if (course.instructorId !== profile(c).id && (course.status !== "Published" || !await enrollment(c, courseId))) fail(403, "Enroll in this published course first");
    return course;
  }
  async function visibleMessages(c: Context) {
    const user = profile(c);
    const enrolled = await store.getByPrefix(`${root}enrollment:${user.id}:`);
    const courses = await list("course");
    const allowed = new Set(enrolled.map(item => item.courseId));
    const teachers = new Set(courses.filter(item => allowed.has(item.id)).map(item => item.instructorId));
    const messages = (await list("message")).filter(item =>
      item.instructorId === user.id || (item.courseId ? allowed.has(item.courseId) : teachers.has(item.instructorId)));
    return Promise.all(messages.map(async item => ({ ...item, read: !!await get("read", `${user.id}:${item.id}`) })));
  }

  app.use("*", cors({
    origin: "*", allowHeaders: ["Content-Type", "Authorization", "X-Access-Token"],
    allowMethods: ["GET", "POST", "PUT", "OPTIONS"], maxAge: 600,
  }));
  app.use("*", bodyLimit({ maxSize: 1024 * 1024 }));
  app.onError((error, c) => {
    if (error instanceof HTTPException) return c.json({ error: error.message }, error.status);
    if (error instanceof SyntaxError) return c.json({ error: "Invalid JSON request" }, 400);
    console.error("SkillVerse request failed:", error.name);
    return c.json({ error: "The server could not complete this request. Please retry." }, 500);
  });
  app.notFound(c => c.json({ error: "API endpoint not found. Check the deployed SkillVerse server version." }, 404));
  app.get(`${prefix}/health`, c => c.json({ status: "ok", version: "2.1.0", authentication: true }));

  app.post(`${prefix}/auth/register`, async c => {
    const body = await bodyFor(c);
    const email = text(body.email, 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, "Enter a valid email address");
    const password = typeof body.password === "string" ? body.password : "";
    if (password.length < 10 || password.length > 128) fail(400, "Use a password with 10 to 128 characters");
    const name = text(body.name, 100);
    if (!["student", "instructor"].includes(body.role)) fail(400, "Choose Student or Instructor");
    let redirectTo: string;
    try {
      const url = new URL(body.redirectTo);
      if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) fail(400, "Invalid account callback URL");
      redirectTo = `${url.origin}/login`;
    } catch { return fail(400, "Invalid account callback URL"); }
    let user: User | null;
    try { user = await register({ email, password, name, redirectTo }); }
    catch (error) { return c.json({ error: error instanceof Error ? error.message : "Unable to create account" }, 400); }
    // Supabase returns an obfuscated user for an existing confirmed email.
    // Never overwrite an existing profile or trust editable user metadata for roles.
    if (user && user.identities?.length) {
      await store.insert(`${root}profile:${user.id}`, { id: user.id, name, role: body.role });
    }
    return c.json({ message: "Check your email to confirm your account, then sign in." }, 201);
  });

  app.use(`${prefix}/*`, async (c, next) => {
    if (c.req.path === `${prefix}/health` || c.req.path === `${prefix}/auth/register`) return next();
    const token = c.req.header("X-Access-Token") || c.req.header("Authorization")?.replace(/^Bearer /, "");
    if (!token) fail(401, "Sign in to continue");
    const user = await authenticate(token);
    if (!user) fail(401, "Your session has expired. Please sign in again.");
    const saved = await get("profile", user.id) as Profile | undefined;
    const name = typeof user.user_metadata?.name === "string" ? user.user_metadata.name.slice(0, 100) : user.email?.split("@")[0] || "Learner";
    c.set("profile", saved || { id: user.id, name, role: "student" });
    await next();
  });
  app.get(`${prefix}/auth/me`, c => c.json(profile(c)));
  app.put(`${prefix}/auth/me`, async c => {
    const updated = { ...profile(c), name: text((await bodyFor(c)).name, 100) };
    await put("profile", updated.id, updated);
    return c.json(updated);
  });

  app.get(`${prefix}/workspace`, async c => {
    const user = profile(c);
    const teaching = user.role === "instructor" && c.req.query("view") !== "learning";
    const [allCourses, allEnrollments, allSubmissions] = await Promise.all([list("course"), list("enrollment"), list("submission")]);
    const courses = allCourses.filter(item => teaching ? item.instructorId === user.id : item.status === "Published");
    const owned = new Set(allCourses.filter(item => item.instructorId === user.id).map(item => item.id));
    const submissions = allSubmissions.filter(item => teaching ? owned.has(item.courseId) : item.studentId === user.id);
    const students = teaching ? allEnrollments.filter(item => owned.has(item.courseId)).map(item => ({
      id: `${item.studentId}:${item.courseId}`, studentId: item.studentId, courseId: item.courseId, name: item.student, initials: initials(item.student),
      course: allCourses.find(course => course.id === item.courseId)?.name,
      progress: Math.round(item.completed / (allCourses.find(course => course.id === item.courseId)?.lessons || 1) * 100),
      lastActive: new Date(item.updatedAt).toLocaleDateString(),
    })) : [];
    return c.json({
      courses: courses.map(course => {
        const enrolled = allEnrollments.filter(item => item.courseId === course.id);
        return { ...course, students: enrolled.length, completion: enrolled.length ? Math.round(enrolled.reduce((sum, item) => sum + item.completed / course.lessons * 100, 0) / enrolled.length) : 0 };
      }), submissions, students,
    });
  });
  app.post(`${prefix}/courses`, async c => {
    const user = instructor(c);
    const body = await bodyFor(c);
    const course = {
      id: crypto.randomUUID(), instructorId: user.id, instructor: user.name,
      name: text(body.name, 160), description: text(body.description ?? "", 4000, false), ...courseDetails(body),
      lessons: integer(body.lessons, 1, 100), status: "Draft", students: 0, completion: 0, createdAt: new Date().toISOString(),
    };
    await put("course", course.id, course);
    return c.json(course, 201);
  });
  app.put(`${prefix}/courses/:id`, async c => {
    const course = await ownedCourse(c, c.req.param("id"));
    const body = await bodyFor(c);
    const status = body.status ?? course.status;
    if (!["Draft", "Published"].includes(status)) fail(400, "Invalid course status");
    const lessons = await get("lessons", course.id) || [];
    if (body.status === "Published" && (lessons.length !== course.lessons || lessons.some((item: RecordData) => !item.content && !item.videoUrl))) fail(400, "Add content or a video link to every lesson before publishing");
    const updated = {
      ...course, status, ...courseDetails(body, course),
      name: body.name === undefined ? course.name : text(body.name, 160),
      description: body.description === undefined ? course.description : text(body.description, 4000, false),
    };
    await put("course", course.id, updated);
    return c.json(updated);
  });
  app.get(`${prefix}/courses/:id/lessons`, async c => {
    const course = await learnerCourse(c, c.req.param("id"));
    return c.json(await get("lessons", course.id) || []);
  });
  app.put(`${prefix}/courses/:id/lessons`, async c => {
    const course = await ownedCourse(c, c.req.param("id"));
    const body = await bodyFor(c);
    if (!Array.isArray(body.lessons) || body.lessons.length !== course.lessons) fail(400, `Provide exactly ${course.lessons} lessons`);
    const lessons = body.lessons.map((value: unknown, index: number) => {
      const item = object(value);
      return {
        id: String(index + 1), title: text(item.title, 160), content: text(item.content ?? "", 20000, false), videoUrl: videoUrl(item.videoUrl),
        module: text(item.module ?? "", 120, false), description: text(item.description ?? "", 500, false),
      };
    });
    if (course.status === "Published" && lessons.some((item: RecordData) => !item.content && !item.videoUrl)) fail(400, "Published lessons must contain content or a video");
    await put("lessons", course.id, lessons);
    return c.json(lessons);
  });
  app.get(`${prefix}/enrollments`, async c => c.json(await store.getByPrefix(`${root}enrollment:${profile(c).id}:`)));
  app.put(`${prefix}/enrollments/:id`, async c => {
    const user = profile(c);
    const course = await courseFor(c.req.param("id"));
    if (course.status !== "Published") fail(404, "Published course not found");
    const body = await bodyFor(c);
    const completed = integer(body.completed, 0, course.lessons);
    const current = await enrollment(c, course.id);
    if (!current && completed !== 0) fail(400, "Enroll before recording lesson progress");
    if (current && completed !== current.completed && completed !== current.completed + 1) fail(400, "Complete lessons in order");
    const record = { courseId: course.id, studentId: user.id, student: user.name, completed, updatedAt: new Date().toISOString() };
    const key = `${root}enrollment:${user.id}:${course.id}`;
    const saved = current ? await store.advance(key, current.completed, record) : await store.insert(key, record);
    if (!saved) fail(409, "Your progress changed in another session. Refresh and try again.");
    return c.json(record);
  });

  app.get(`${prefix}/assignments`, async c => {
    const user = profile(c);
    const enrolled = new Set((await store.getByPrefix(`${root}enrollment:${user.id}:`)).map(item => item.courseId));
    const published = new Set((await list("course")).filter(item => item.status === "Published").map(item => item.id));
    const submissions = await list("submission");
    return c.json((await list("assignment")).filter(item => item.instructorId === user.id || enrolled.has(item.courseId) && published.has(item.courseId)).map(item => ({
      ...item, submission: submissions.find(sub => sub.assignmentId === item.id && sub.studentId === user.id) || null,
    })));
  });
  app.post(`${prefix}/assignments`, async c => {
    const body = await bodyFor(c);
    const course = await ownedCourse(c, text(body.courseId, 100));
    const dueDate = text(body.dueDate, 40);
    if (!Number.isFinite(Date.parse(dueDate))) fail(400, "Enter a valid due date");
    const item = { id: crypto.randomUUID(), courseId: course.id, course: course.name, instructorId: profile(c).id, title: text(body.title, 160), description: text(body.description, 8000), dueDate };
    await put("assignment", item.id, item);
    return c.json(item, 201);
  });
  app.post(`${prefix}/assignments/:id/submit`, async c => {
    const user = profile(c);
    const assignment = await get("assignment", c.req.param("id"));
    if (!assignment) fail(404, "Assignment not found");
    await learnerCourse(c, assignment.courseId);
    if (!await enrollment(c, assignment.courseId)) fail(403, "Enroll before submitting work");
    const id = `${user.id}:${assignment.id}`;
    if (await get("submission", id)) fail(409, "You have already submitted this assignment");
    const submission = {
      id, studentId: user.id, student: user.name, initials: initials(user.name),
      assignmentId: assignment.id, assignment: assignment.title, courseId: assignment.courseId, course: assignment.course,
      content: text((await bodyFor(c)).content, 20000), submitted: new Date().toISOString(), status: "Pending",
    };
    if (!await store.insert(`${root}submission:${id}`, submission)) fail(409, "You have already submitted this assignment");
    return c.json(submission, 201);
  });
  app.put(`${prefix}/submissions/:id`, async c => {
    const submission = await get("submission", c.req.param("id"));
    if (!submission) fail(404, "Submission not found");
    await ownedCourse(c, submission.courseId);
    const body = await bodyFor(c);
    const updated = { ...submission, score: integer(body.score, 0, 100), feedback: text(body.feedback ?? "", 4000, false), status: "Graded" };
    await put("submission", submission.id, updated);
    return c.json(updated);
  });
  app.post(`${prefix}/quizzes`, async c => {
    const body = await bodyFor(c);
    const course = await ownedCourse(c, text(body.courseId, 100));
    const questions = parseQuestions(body.questions);
    const quiz = { id: crypto.randomUUID(), instructorId: profile(c).id, courseId: course.id, course: course.name, title: text(body.title, 160), questions };
    await put("quiz", quiz.id, quiz);
    return c.json({ id: quiz.id }, 201);
  });
  app.get(`${prefix}/quizzes`, async c => {
    const user = profile(c);
    const enrolled = new Set((await store.getByPrefix(`${root}enrollment:${user.id}:`)).map(item => item.courseId));
    const published = new Set((await list("course")).filter(item => item.status === "Published").map(item => item.id));
    const attempts = await store.getByPrefix(`${root}attempt:${user.id}:`);
    return c.json((await list("quiz")).filter(item => item.instructorId === user.id || enrolled.has(item.courseId) && published.has(item.courseId)).map(quiz => ({
      ...quiz, questions: quiz.questions.map(({ answer: _answer, ...question }: RecordData) => question),
      attempts: attempts.filter(item => item.quizId === quiz.id).length,
      bestScore: attempts.filter(item => item.quizId === quiz.id).reduce((best, item) => Math.max(best, item.score), 0),
    })));
  });
  app.post(`${prefix}/quizzes/:id/attempts`, async c => {
    const quiz = await get("quiz", c.req.param("id"));
    if (!quiz) fail(404, "Quiz not found");
    await learnerCourse(c, quiz.courseId);
    if (!await enrollment(c, quiz.courseId)) fail(403, "Enroll before taking this quiz");
    const body = await bodyFor(c);
    if (!Array.isArray(body.answers) || body.answers.length !== quiz.questions.length) fail(400, "Answer every question before submitting");
    const answers = body.answers.map((answer: unknown, index: number) => integer(answer, 0, quiz.questions[index].options.length - 1));
    const correct = quiz.questions.reduce((count: number, item: RecordData, index: number) => count + Number(item.answer === answers[index]), 0);
    const attempt = { id: crypto.randomUUID(), quizId: quiz.id, studentId: profile(c).id, answers, correct, total: answers.length, score: Math.round(correct / answers.length * 100), createdAt: new Date().toISOString() };
    await put("attempt", `${profile(c).id}:${quiz.id}:${attempt.id}`, attempt);
    return c.json(attempt, 201);
  });
  app.get(`${prefix}/courses/:id/assessments`, async c => {
    const course = await ownedCourse(c, c.req.param("id"));
    const [assignments, quizzes] = await Promise.all([list("assignment"), list("quiz")]);
    return c.json({ assignments: assignments.filter(item => item.courseId === course.id), quizzes: quizzes.filter(item => item.courseId === course.id) });
  });
  app.put(`${prefix}/assignments/:id`, async c => {
    const item = await get("assignment", c.req.param("id"));
    if (!item) fail(404, "Assignment not found");
    await ownedCourse(c, item.courseId);
    const body = await bodyFor(c);
    const dueDate = text(body.dueDate, 40);
    if (!Number.isFinite(Date.parse(dueDate))) fail(400, "Enter a valid due date");
    const updated = { ...item, title: text(body.title, 160), description: text(body.description, 8000), dueDate };
    await put("assignment", item.id, updated);
    return c.json(updated);
  });
  app.put(`${prefix}/quizzes/:id`, async c => {
    const item = await get("quiz", c.req.param("id"));
    if (!item) fail(404, "Quiz not found");
    await ownedCourse(c, item.courseId);
    const body = await bodyFor(c);
    const updated = { ...item, title: text(body.title, 160), questions: parseQuestions(body.questions) };
    await put("quiz", item.id, updated);
    return c.json({ id: item.id });
  });
  // Idempotent: existing records are never overwritten, so repeated calls cannot reset learner data.
  app.post(`${prefix}/seed/sample-courses`, async c => {
    const user = instructor(c);
    const result = [];
    for (const sample of sampleCourses) {
      const id = `sample-${sample.slug}`;
      const existing = await get("course", id);
      if (existing) { result.push({ id, name: existing.name, created: false, yours: existing.instructorId === user.id }); continue; }
      const lessons = sample.lessons.map((lesson, index) => ({ id: String(index + 1), videoUrl: "", ...lesson }));
      await store.insert(`${root}lessons:${id}`, lessons);
      await store.insert(`${root}quiz:${id}-quiz`, { id: `${id}-quiz`, instructorId: user.id, courseId: id, course: sample.name, ...sample.quiz });
      const dueDate = new Date(Date.now() + sample.assignment.dueInDays * 86400000).toISOString().slice(0, 10);
      await store.insert(`${root}assignment:${id}-assignment`, {
        id: `${id}-assignment`, courseId: id, course: sample.name, instructorId: user.id,
        title: sample.assignment.title, description: sample.assignment.description, dueDate,
      });
      const course = {
        id, instructorId: user.id, instructor: user.name, name: sample.name, description: sample.description, category: sample.category,
        difficulty: sample.difficulty, duration: sample.duration, thumbnail: sample.thumbnail, lessons: lessons.length,
        status: "Published", students: 0, completion: 0, createdAt: new Date().toISOString(),
      };
      const created = await store.insert(`${root}course:${id}`, course);
      result.push({ id, name: sample.name, created, yours: created });
    }
    return c.json({ courses: result }, 201);
  });
  app.get(`${prefix}/messages`, async c => c.json((await visibleMessages(c)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))));
  app.post(`${prefix}/messages`, async c => {
    const user = instructor(c);
    const body = await bodyFor(c);
    const audience = text(body.audience, 160);
    const course = audience === "all" ? null : (await list("course")).find(item => item.instructorId === user.id && item.id === audience && item.status === "Published");
    if (audience !== "all" && !course) fail(400, "Select one of your published courses");
    const message = { id: crypto.randomUUID(), instructorId: user.id, author: user.name, courseId: course?.id || null, audience: course?.name || "all", body: text(body.body, 4000), createdAt: new Date().toISOString(), read: false };
    await put("message", message.id, message);
    return c.json(message, 201);
  });
  app.put(`${prefix}/messages/:id`, async c => {
    const message = (await visibleMessages(c)).find(item => item.id === c.req.param("id"));
    if (!message) fail(404, "Announcement not found");
    await put("read", `${profile(c).id}:${message.id}`, { read: true });
    return c.json({ ...message, read: true });
  });
  return app;
}
