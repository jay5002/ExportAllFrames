import { Hono, type Context } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { bodyLimit } from "npm:hono/body-limit";
import * as kv from "./kv_store.tsx";
import { HTTPException } from "npm:hono/http-exception";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-Workspace"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-6593f319/health", (c) => {
  return c.json({ status: "ok" });
});

const prefix = '/make-server-6593f319';
app.use(`${prefix}/*`, bodyLimit({ maxSize: 16384 }));
const courseSeeds = [
  { id: 'react', name: 'Advanced React Patterns', students: 42, status: 'Published', completion: 84, lessons: 18 },
  { id: 'typescript', name: 'TypeScript Deep Dive', students: 31, status: 'Published', completion: 71, lessons: 16 },
  { id: 'design', name: 'Frontend System Design', students: 28, status: 'Draft', completion: 0, lessons: 12 },
  { id: 'testing', name: 'Modern Testing Workflows', students: 25, status: 'Published', completion: 68, lessons: 14 },
];
const submissionSeeds = [
  { id: 1, student: 'Aarav Kumar', initials: 'AK', assignment: 'React Architecture', course: 'Advanced React Patterns', submitted: '12 min ago', status: 'Pending' },
  { id: 2, student: 'Sara Mehta', initials: 'SM', assignment: 'Generics Challenge', course: 'TypeScript Deep Dive', submitted: '36 min ago', status: 'Pending' },
  { id: 3, student: 'Rohan Lal', initials: 'RL', assignment: 'State Management Lab', course: 'Advanced React Patterns', submitted: '2 hours ago', status: 'Pending' },
  { id: 4, student: 'Maya Singh', initials: 'MS', assignment: 'Integration Test Suite', course: 'Modern Testing Workflows', submitted: 'Yesterday', status: 'Graded', score: 92 },
];
const students = [
  { name: 'Aarav Kumar', initials: 'AK', course: 'Advanced React Patterns', progress: 86, lastActive: '12 min ago' },
  { name: 'Sara Mehta', initials: 'SM', course: 'TypeScript Deep Dive', progress: 74, lastActive: '48 min ago' },
  { name: 'Rohan Lal', initials: 'RL', course: 'Advanced React Patterns', progress: 62, lastActive: '2 hours ago' },
  { name: 'Maya Singh', initials: 'MS', course: 'Modern Testing Workflows', progress: 91, lastActive: 'Yesterday' },
  { name: 'Neel Shah', initials: 'NS', course: 'Frontend System Design', progress: 35, lastActive: 'Yesterday' },
];
function workspace(context: Context) {
  const token = context.req.header('X-Workspace') || '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)) throw new HTTPException(400, { message: 'Invalid demo workspace' });
  return `skillverse:${token}:`;
}
function text(value: unknown, max: number, required = true) {
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) throw new HTTPException(400, { message: 'Invalid or missing text field' });
  return value.trim();
}
async function coursesFor(key: string) {
  const saved = await kv.getByPrefix(`${key}course:`);
  return [...courseSeeds.filter(seed => !saved.some(course => course.id === seed.id)), ...saved];
}
app.onError((error, context) => {
  if (error instanceof HTTPException) return context.json({ error: error.message }, error.status);
  if (error instanceof SyntaxError) return context.json({ error: 'Invalid JSON request body' }, 400);
  console.error(error);
  return context.json({ error: 'Unable to save or load workspace data. Please retry.' }, 500);
});
app.get(`${prefix}/workspace`, async context => {
  const key = workspace(context);
  const [courses, saved] = await Promise.all([coursesFor(key), kv.getByPrefix(`${key}submission:`)]);
  const submissions = submissionSeeds.map(seed => saved.find(item => item.id === seed.id) || seed);
  return context.json({ courses, submissions, students });
});
app.post(`${prefix}/courses`, async context => {
  const key = workspace(context);
  const body = await context.req.json();
  const name = text(body.name, 160);
  if (!Number.isInteger(body.lessons) || body.lessons < 1 || body.lessons > 500) throw new HTTPException(400, { message: 'Lessons must be between 1 and 500' });
  const courses = await coursesFor(key);
  if (courses.some(course => course.name.toLowerCase() === name.toLowerCase())) throw new HTTPException(409, { message: 'A course with this title already exists' });
  if (courses.length >= 100) throw new HTTPException(400, { message: 'Demo course limit reached' });
  const course = { id: crypto.randomUUID(), name, description: text(body.description ?? '', 4000, false), lessons: body.lessons, students: 0, completion: 0, status: 'Draft' };
  await kv.set(`${key}course:${course.id}`, course);
  return context.json(course, 201);
});
app.put(`${prefix}/courses/:id`, async context => {
  const key = workspace(context);
  const course = (await coursesFor(key)).find(item => item.id === context.req.param('id'));
  if (!course) throw new HTTPException(404, { message: 'Course not found' });
  const body = await context.req.json();
  if (!['Draft', 'Published'].includes(body.status)) throw new HTTPException(400, { message: 'Invalid course status' });
  const updated = { ...course, status: body.status };
  await kv.set(`${key}course:${course.id}`, updated);
  return context.json(updated);
});
app.put(`${prefix}/submissions/:id`, async context => {
  const key = workspace(context);
  const seed = submissionSeeds.find(item => String(item.id) === context.req.param('id'));
  if (!seed) throw new HTTPException(404, { message: 'Submission not found' });
  const body = await context.req.json();
  if (typeof body.score !== 'number' || !Number.isFinite(body.score) || body.score < 0 || body.score > 100) throw new HTTPException(400, { message: 'Score must be between 0 and 100' });
  const submission = { ...seed, score: body.score, feedback: text(body.feedback ?? '', 4000, false), status: 'Graded' };
  await kv.set(`${key}submission:${seed.id}`, submission);
  return context.json(submission);
});
app.post(`${prefix}/messages`, async context => {
  const key = workspace(context);
  const body = await context.req.json();
  const audience = text(body.audience, 160);
  if (audience !== 'all' && !(await coursesFor(key)).some(course => course.name === audience && course.status === 'Published')) throw new HTTPException(400, { message: 'Select a published course or all students' });
  if ((await kv.getByPrefix(`${key}message:`)).length >= 200) throw new HTTPException(400, { message: 'Demo message limit reached' });
  const message = { id: crypto.randomUUID(), audience, body: text(body.body, 4000), createdAt: new Date().toISOString(), read: false };
  await kv.set(`${key}message:${message.id}`, message);
  return context.json(message, 201);
});
app.get(`${prefix}/messages`, async context => {
  const messages = await kv.getByPrefix(`${workspace(context)}message:`);
  return context.json(messages.sort((first, second) => second.createdAt.localeCompare(first.createdAt)));
});
app.put(`${prefix}/messages/:id`, async context => {
  const key = `${workspace(context)}message:${context.req.param('id')}`;
  const message = await kv.get(key);
  if (!message) throw new HTTPException(404, { message: 'Message not found' });
  const updated = { ...message, read: true };
  await kv.set(key, updated);
  return context.json(updated);
});
app.get(`${prefix}/enrollments`, async context => context.json(await kv.getByPrefix(`${workspace(context)}enrollment:`)));
app.put(`${prefix}/enrollments/:id`, async context => {
  const key = workspace(context);
  const course = (await coursesFor(key)).find(item => item.id === context.req.param('id') && item.status === 'Published');
  if (!course) throw new HTTPException(404, { message: 'Published course not found' });
  const body = await context.req.json();
  if (!Number.isInteger(body.completed) || body.completed < 0 || body.completed > course.lessons) throw new HTTPException(400, { message: 'Invalid lesson completion count' });
  const enrollment = { courseId: course.id, completed: body.completed, updatedAt: new Date().toISOString() };
  await kv.set(`${key}enrollment:${course.id}`, enrollment);
  return context.json(enrollment);
});

Deno.serve(app.fetch);
