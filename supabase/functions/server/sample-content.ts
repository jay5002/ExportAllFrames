export type SampleLesson = { module: string; title: string; description: string; content: string };
export type SampleQuestion = { q: string; options: string[]; answer: number };
export type SampleCourse = {
  slug: string; name: string; description: string; category: string; difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration: string; thumbnail: string; lessons: SampleLesson[];
  quiz: { title: string; questions: SampleQuestion[] };
  assignment: { title: string; description: string; dueInDays: number };
};

const image = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=70`;

export const sampleCourses: SampleCourse[] = [
  {
    slug: "javascript-fundamentals",
    name: "JavaScript Fundamentals",
    description: "Learn the core of the language: variables, control flow, functions, data structures, the DOM and asynchronous code. Finish by building small interactive features.",
    category: "Programming", difficulty: "Beginner", duration: "6 hours",
    thumbnail: image("photo-1515879218367-8466d910aaa4"),
    lessons: [
      {
        module: "Module 1: Getting Started", title: "Variables and Data Types",
        description: "Store values with let and const and recognise JavaScript's primitive types.",
        content: `Variables give names to values. Use const by default and let when a value must change. Avoid var in new code.

const course = "JavaScript";
let lessonsDone = 0;
lessonsDone = lessonsDone + 1;

JavaScript has seven primitive types: string, number, boolean, null, undefined, bigint and symbol. Everything else is an object, including arrays and functions.

Use typeof to inspect a value: typeof 42 is "number" and typeof "hi" is "string". Note the historical quirk that typeof null is "object".

Strings can be joined with template literals using backticks: "Hello, " + name works, but a template literal is easier to read.

Type coercion happens when types are mixed: "5" + 1 is "51", but "5" * 1 is 5. Prefer the strict equality operator === because it never coerces.

Practice: declare a const for your name, a let for a counter, and print the typeof each.`,
      },
      {
        module: "Module 1: Getting Started", title: "Operators and Control Flow",
        description: "Make decisions and repeat work with conditionals and loops.",
        content: `Programs make decisions with if / else and repeat work with loops.

const score = 82;
if (score >= 90) { console.log("A"); }
else if (score >= 80) { console.log("B"); }
else { console.log("Keep going"); }

Comparison operators return booleans: ===, !==, <, >, <=, >=. Combine them with && (and), || (or) and ! (not).

Falsy values are false, 0, "", null, undefined and NaN. Everything else is truthy, which is why if (name) is a common check for a non-empty string.

Loops:
for (let i = 0; i < 3; i++) { console.log(i); }
let n = 3; while (n > 0) { n--; }

Use break to leave a loop early and continue to skip to the next iteration. The ternary operator condition ? a : b is a compact if / else for simple values.

Practice: write a loop that prints the numbers 1 to 20, replacing multiples of 3 with "Fizz".`,
      },
      {
        module: "Module 2: Functions and Data", title: "Functions and Scope",
        description: "Write reusable functions and understand where variables are visible.",
        content: `A function packages behaviour so it can be reused.

function add(a, b) { return a + b; }
const multiply = (a, b) => a * b;

Parameters are the names in the definition; arguments are the values you pass. Default values keep calls short: function greet(name = "friend") { return "Hi " + name; }

Scope decides where a name is visible. let and const are block scoped, so a variable declared inside { } is not visible outside it. Functions can read variables from the scope where they were defined; this is called a closure.

function counter() {
  let count = 0;
  return () => ++count;
}
const next = counter();
next(); // 1
next(); // 2

The returned function keeps access to count even after counter has finished. Closures power callbacks, event handlers and many patterns you will meet later.

Practice: write a function that accepts a list of prices and a tax rate and returns the total.`,
      },
      {
        module: "Module 2: Functions and Data", title: "Arrays and Objects",
        description: "Organise data with arrays and objects and transform it with built-in methods.",
        content: `Arrays hold ordered lists; objects hold named properties.

const scores = [72, 88, 95];
const student = { name: "Ada", scores };

Useful array methods return new values without changing the original:
scores.map(s => s + 5)        // add five to each
scores.filter(s => s >= 80)   // keep high scores
scores.reduce((sum, s) => sum + s, 0) // total

Use push and pop to add or remove at the end, and includes to test for a value.

Read object properties with dot notation (student.name) or brackets (student["name"]). Destructuring pulls values out concisely: const { name } = student; const [first] = scores;

The spread operator copies: const copy = { ...student, name: "Grace" }; creates a new object and leaves the original unchanged. Treating data as immutable avoids many hard-to-find bugs.

Practice: given an array of objects with name and score, produce a list of the names of students who scored at least 80.`,
      },
      {
        module: "Module 3: Working with the Web", title: "The DOM and Events",
        description: "Select page elements, change them, and respond to user actions.",
        content: `The Document Object Model (DOM) is the browser's live representation of a page. JavaScript can read and change it.

const button = document.querySelector("#save");
const message = document.querySelector(".message");
button.addEventListener("click", () => {
  message.textContent = "Saved!";
  message.classList.add("visible");
});

querySelector returns the first matching element and querySelectorAll returns all of them. Change text with textContent, attributes with setAttribute and styling with classList.

Prefer textContent over innerHTML when inserting user-provided text. Inserting untrusted HTML can expose your users to cross-site scripting attacks.

Events bubble up from the clicked element to its parents. Event delegation uses this: attach one listener to a list and check event.target to know which item was clicked. This works even for items added later.

Practice: build a to-do list where pressing Enter in an input adds an item and clicking an item toggles a done class.`,
      },
      {
        module: "Module 3: Working with the Web", title: "Asynchronous JavaScript",
        description: "Fetch data with promises and async / await and handle failures gracefully.",
        content: `Some work takes time, such as network requests. JavaScript does not block while waiting; it uses promises.

async function loadUser(id) {
  const response = await fetch("https://api.example.com/users/" + id);
  if (!response.ok) throw new Error("Request failed: " + response.status);
  return response.json();
}

An async function always returns a promise. await pauses that function until the promise settles, while the rest of the page stays responsive.

Always handle errors. fetch only rejects on network failure, so check response.ok yourself, and wrap calls in try / catch:

try { const user = await loadUser(7); }
catch (error) { console.error(error.message); }

Run independent requests together with Promise.all([a(), b()]) instead of awaiting them one by one. Show a loading state while waiting and an error message if something fails; users should never be left guessing.

Practice: fetch a list of items from a public API, render them to the page, and display a friendly message if the request fails.`,
      },
    ],
    quiz: {
      title: "JavaScript Fundamentals Checkpoint",
      questions: [
        { q: "Which keyword declares a variable that cannot be reassigned?", options: ["var", "let", "const", "static"], answer: 2 },
        { q: "What does the expression \"5\" + 1 evaluate to?", options: ["6", "\"51\"", "NaN", "An error"], answer: 1 },
        { q: "Which array method returns a new array containing only the items that pass a test?", options: ["map", "reduce", "filter", "push"], answer: 2 },
        { q: "What is a closure?", options: ["A function that keeps access to variables from where it was defined", "A loop that never ends", "A way to close the browser tab", "A type of object literal"], answer: 0 },
        { q: "Why check response.ok after calling fetch?", options: ["fetch always throws on HTTP errors", "fetch only rejects on network failure, not on HTTP error statuses", "It makes the request faster", "It converts the body to JSON"], answer: 1 },
      ],
    },
    assignment: {
      title: "Build an Interactive To-Do List",
      description: "Create a small web page with an input, an Add button and a list. Requirements:\n1. Pressing Enter or clicking Add appends a new item (ignore empty text).\n2. Clicking an item toggles a completed style.\n3. Show how many items are still open.\n4. Use const/let, at least one array method and event delegation.\n\nSubmit your JavaScript code and a short note describing one bug you fixed while building it.",
      dueInDays: 14,
    },
  },
  {
    slug: "sql-database-essentials",
    name: "SQL and Database Essentials",
    description: "Understand relational databases and write confident SQL: querying, joining tables, summarising data, changing records safely and designing efficient schemas.",
    category: "Data", difficulty: "Beginner", duration: "7 hours",
    thumbnail: image("photo-1782094673136-5198a372980c"),
    lessons: [
      {
        module: "Module 1: Relational Foundations", title: "Tables, Keys and Relationships",
        description: "See how relational databases organise data into related tables.",
        content: `A relational database stores data in tables. A table has columns (the attributes) and rows (the records).

A primary key uniquely identifies each row, for example students.id. A foreign key is a column that refers to another table's primary key, such as enrollments.student_id referring to students.id. Foreign keys keep data consistent: you cannot enrol a student who does not exist.

Relationships come in three common shapes:
- One to many: one instructor teaches many courses.
- Many to many: students enrol in many courses and courses have many students. This needs a linking table such as enrollments.
- One to one: a user and their private profile settings.

CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  instructor_id INTEGER REFERENCES instructors(id)
);

Choose clear singular or plural names consistently, give every table a primary key, and use NOT NULL when a value is required.

Practice: sketch tables for a library with books, members and loans, and mark the keys.`,
      },
      {
        module: "Module 1: Relational Foundations", title: "Querying with SELECT",
        description: "Retrieve, filter and sort rows using SELECT, WHERE and ORDER BY.",
        content: `SELECT retrieves data. The clauses are written in this order:

SELECT title, price
FROM courses
WHERE price < 50 AND category = 'Data'
ORDER BY price DESC
LIMIT 5;

SELECT * returns every column; list the columns you need instead, which is clearer and faster.

WHERE filters rows. Useful operators: =, <>, <, >, BETWEEN, IN ('a', 'b'), LIKE 'Intro%' for patterns, and IS NULL to find missing values. Never write = NULL; it never matches.

ORDER BY sorts (ASC by default) and LIMIT restricts how many rows come back. Use DISTINCT to remove duplicate results.

You can compute values and name them with AS: SELECT title, price * 1.2 AS price_with_tax FROM courses;

SQL keywords are not case sensitive, but writing them in capitals and putting each clause on its own line makes queries easier to read.

Practice: from a students table, list the five most recently registered students from a given country.`,
      },
      {
        module: "Module 2: Combining and Summarizing Data", title: "Joins",
        description: "Combine rows from related tables with INNER and LEFT joins.",
        content: `Joins combine tables using their relationships.

SELECT s.name, c.title
FROM enrollments e
JOIN students s ON s.id = e.student_id
JOIN courses c ON c.id = e.course_id;

INNER JOIN (or just JOIN) keeps only rows that match on both sides. LEFT JOIN keeps every row from the left table and fills missing matches with NULL, which is perfect for finding gaps:

SELECT s.name
FROM students s
LEFT JOIN enrollments e ON e.student_id = s.id
WHERE e.student_id IS NULL;

That query lists students who have not enrolled in anything.

Use short table aliases (s, c, e) and prefix columns with them so it is obvious where each value comes from. Always include the ON condition; forgetting it produces a cross join with every possible combination of rows.

Practice: list each course with the number of students enrolled, including courses that have none.`,
      },
      {
        module: "Module 2: Combining and Summarizing Data", title: "Grouping and Aggregates",
        description: "Summarise data with COUNT, SUM, AVG and GROUP BY.",
        content: `Aggregate functions turn many rows into one value: COUNT, SUM, AVG, MIN and MAX.

SELECT COUNT(*) AS total_students FROM students;

GROUP BY computes an aggregate for each group:

SELECT c.title, COUNT(e.student_id) AS learners, AVG(e.progress) AS avg_progress
FROM courses c
LEFT JOIN enrollments e ON e.course_id = c.id
GROUP BY c.title
HAVING COUNT(e.student_id) >= 10
ORDER BY learners DESC;

WHERE filters rows before grouping; HAVING filters groups after aggregation. Every column in SELECT must either be in GROUP BY or inside an aggregate function.

COUNT(*) counts rows while COUNT(column) ignores NULL values. AVG and SUM also ignore NULLs, so remember to account for missing data.

Practice: write a query that shows the average grade per course and only courses where the average is below 70.`,
      },
      {
        module: "Module 3: Designing and Changing Data", title: "Modifying Data and Transactions",
        description: "Insert, update and delete safely, and group changes into transactions.",
        content: `INSERT adds rows, UPDATE changes them and DELETE removes them.

INSERT INTO students (name, email) VALUES ('Ada', 'ada@example.com');
UPDATE students SET email = 'ada@school.edu' WHERE id = 1;
DELETE FROM students WHERE id = 1;

Always include a WHERE clause on UPDATE and DELETE. Without it, every row is changed. A safe habit is to run a SELECT with the same WHERE first and check the rows it returns.

A transaction groups statements so they succeed or fail together. Moving credit between two accounts must never apply half of the change:

BEGIN;
UPDATE accounts SET balance = balance - 50 WHERE id = 1;
UPDATE accounts SET balance = balance + 50 WHERE id = 2;
COMMIT;

If something goes wrong, ROLLBACK undoes everything since BEGIN. Transactions follow the ACID guarantees: atomicity, consistency, isolation and durability.

Practice: write a transaction that enrols a student and decrements the number of open seats in a course.`,
      },
      {
        module: "Module 3: Designing and Changing Data", title: "Indexes and Normalization",
        description: "Speed up queries with indexes and design tables that avoid duplicated data.",
        content: `An index is a data structure that lets the database find rows without scanning the whole table, like the index of a book.

CREATE INDEX idx_enrollments_student ON enrollments (student_id);

Index columns used often in WHERE, JOIN and ORDER BY clauses. Indexes are not free: they use storage and make writes slightly slower, so do not index everything. Primary keys are indexed automatically. Use EXPLAIN before a query to see whether an index is used.

Normalization organises tables to avoid duplicated data:
- First normal form: each column holds one value, no comma-separated lists.
- Second normal form: every non-key column depends on the whole key.
- Third normal form: non-key columns depend only on the key, not on other non-key columns.

For example, do not store the instructor's name and email in every course row. Store an instructor_id and keep those details once in an instructors table. Updates then happen in one place and cannot disagree.

Practice: take a single spreadsheet of orders with customer details repeated on every line and split it into customers, orders and order_items tables.`,
      },
    ],
    quiz: {
      title: "SQL Essentials Checkpoint",
      questions: [
        { q: "What does a foreign key do?", options: ["Encrypts a column", "Refers to a primary key in another table to keep data consistent", "Sorts the rows of a table", "Deletes duplicate rows"], answer: 1 },
        { q: "Which condition correctly finds rows with a missing value?", options: ["WHERE price = NULL", "WHERE price IS NULL", "WHERE price == 0", "WHERE price LIKE NULL"], answer: 1 },
        { q: "Which join keeps every row from the left table even when there is no match?", options: ["INNER JOIN", "LEFT JOIN", "CROSS JOIN", "SELF JOIN"], answer: 1 },
        { q: "What is the difference between WHERE and HAVING?", options: ["There is none", "WHERE filters rows before grouping; HAVING filters groups after aggregation", "HAVING is faster", "WHERE only works with numbers"], answer: 1 },
        { q: "Why wrap related UPDATE statements in a transaction?", options: ["So they run faster", "So they all succeed or all fail together", "So they ignore constraints", "So the table is indexed"], answer: 1 },
      ],
    },
    assignment: {
      title: "Design and Query a Course Database",
      description: "Design a small database for an online school with students, courses and enrollments.\n1. Write CREATE TABLE statements with primary and foreign keys.\n2. Insert at least 3 students, 3 courses and 6 enrollments.\n3. Write queries to: list each student's courses (JOIN), count learners per course (GROUP BY), and find students with no enrollments (LEFT JOIN).\n4. Add one index and explain why it helps.\n\nSubmit your SQL script and the results of your three queries.",
      dueInDays: 14,
    },
  },
  {
    slug: "data-structures-algorithms-javascript",
    name: "Data Structures and Algorithms with JavaScript",
    description: "Build the problem-solving toolkit used in technical interviews and real software: complexity analysis, core data structures, searching, sorting, trees and recursion, all in JavaScript.",
    category: "Computer Science", difficulty: "Intermediate", duration: "9 hours",
    thumbnail: image("photo-1532622785990-d2c36a76f5a6"),
    lessons: [
      {
        module: "Module 1: Complexity and Linear Structures", title: "Big-O and Measuring Efficiency",
        description: "Describe how an algorithm's cost grows as the input grows.",
        content: `Big-O notation describes how the time or memory an algorithm needs grows with the input size n. It ignores constants and focuses on the trend.

Common growth rates, from fastest to slowest:
- O(1) constant: reading array[3].
- O(log n) logarithmic: binary search.
- O(n) linear: scanning an array once.
- O(n log n): efficient sorting such as merge sort.
- O(n^2) quadratic: nested loops over the same data.

function hasDuplicate(items) {   // O(n^2)
  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++)
      if (items[i] === items[j]) return true;
  return false;
}

The same task using a Set is O(n): add each item and check has() first. Trading memory for speed is one of the most common optimisations.

Drop constants and lower-order terms: 3n + 10 is O(n). Always state whether you mean the best, average or worst case; usually it is the worst.

Practice: write both versions of hasDuplicate and time them with 10,000 items.`,
      },
      {
        module: "Module 1: Complexity and Linear Structures", title: "Arrays, Stacks and Queues",
        description: "Use arrays to build stacks (last in, first out) and queues (first in, first out).",
        content: `Arrays store items by index. Access by index is O(1); inserting or removing at the start is O(n) because items must shift.

A stack is last in, first out (LIFO), like a pile of plates. In JavaScript push and pop on an array give you a stack in O(1).

const stack = [];
stack.push("a"); stack.push("b");
stack.pop(); // "b"

Stacks power undo features, the call stack and checking matching brackets: push each opening bracket and pop when a closing one arrives.

A queue is first in, first out (FIFO), like a line at a shop. Using shift() on a large array is O(n), so for big queues keep a head index or use a linked list.

class Queue {
  constructor() { this.items = {}; this.head = 0; this.tail = 0; }
  enqueue(x) { this.items[this.tail++] = x; }
  dequeue() { const x = this.items[this.head]; delete this.items[this.head++]; return x; }
}

Queues are used for task scheduling and breadth-first search.

Practice: write a function that checks whether the brackets in a string like "{[()]}" are balanced.`,
      },
      {
        module: "Module 2: Linked Structures and Hashing", title: "Linked Lists",
        description: "Chain nodes together to get cheap insertions and removals.",
        content: `A linked list is a chain of nodes. Each node stores a value and a reference to the next node.

class Node { constructor(value) { this.value = value; this.next = null; } }
class LinkedList {
  constructor() { this.head = null; }
  prepend(value) { const node = new Node(value); node.next = this.head; this.head = node; }
  find(value) { let n = this.head; while (n && n.value !== value) n = n.next; return n; }
}

Prepending is O(1) because no items need to shift. Finding a value is O(n) because you must walk the chain; there is no index jump as with arrays.

A doubly linked list also keeps a previous reference, which makes removing a known node O(1) and allows traversal in both directions.

Choose arrays when you need fast access by position. Choose linked lists when you insert and remove at the ends or middle often and rarely read by position.

A classic interview exercise is reversing a list: walk the chain, pointing each node's next at the previous node.

Practice: implement remove(value) and reverse() for the LinkedList above.`,
      },
      {
        module: "Module 2: Linked Structures and Hashing", title: "Hash Maps and Sets",
        description: "Get near-constant-time lookups with hashing.",
        content: `A hash map stores key-value pairs. A hash function turns a key into an index so lookups, inserts and deletes are O(1) on average.

const counts = new Map();
for (const word of ["a", "b", "a"]) counts.set(word, (counts.get(word) || 0) + 1);
counts.get("a"); // 2

A Set stores unique values with fast has() checks. Prefer Map over plain objects when keys are not simple strings or when you need to iterate in insertion order.

Collisions occur when two keys hash to the same index. Implementations handle them by chaining (storing a small list in each bucket) or by probing for another free slot. With a good hash function and resizing, collisions stay rare, which is why the average case is O(1).

Classic uses: counting frequencies, removing duplicates, and the two-sum problem:

function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    if (seen.has(target - nums[i])) return [seen.get(target - nums[i]), i];
    seen.set(nums[i], i);
  }
}

This runs in O(n) rather than the O(n^2) of checking every pair.

Practice: find the first non-repeating character in a string using a Map.`,
      },
      {
        module: "Module 3: Searching, Sorting and Trees", title: "Searching and Sorting",
        description: "Compare linear and binary search and learn how merge sort works.",
        content: `Linear search checks each item in turn: O(n). Binary search needs sorted data and halves the search range each step: O(log n).

function binarySearch(sorted, target) {
  let low = 0, high = sorted.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (sorted[mid] === target) return mid;
    if (sorted[mid] < target) low = mid + 1; else high = mid - 1;
  }
  return -1;
}

Searching a million sorted items takes about 20 steps instead of up to a million.

Simple sorts such as bubble sort and insertion sort are O(n^2) and fine for small lists. Merge sort splits the list in half, sorts each half and merges them, giving O(n log n) in every case. Quick sort is also O(n log n) on average but O(n^2) in the worst case.

JavaScript's built-in sort converts items to strings by default. Always pass a comparison function for numbers: values.sort((a, b) => a - b).

Practice: implement merge sort and confirm it returns the same result as the built-in sort.`,
      },
      {
        module: "Module 3: Searching, Sorting and Trees", title: "Trees and Recursion",
        description: "Model hierarchies with trees and solve problems with recursive functions.",
        content: `Recursion is a function calling itself on a smaller version of the problem. Every recursive function needs a base case that stops it and a recursive case that moves toward it.

function factorial(n) {
  if (n <= 1) return 1;          // base case
  return n * factorial(n - 1);   // recursive case
}

A tree is a hierarchy of nodes. A binary tree node has at most two children. In a binary search tree (BST), everything in the left subtree is smaller than the node and everything in the right is larger, so searching a balanced tree is O(log n).

class TreeNode { constructor(value) { this.value = value; this.left = null; this.right = null; } }
function insert(node, value) {
  if (!node) return new TreeNode(value);
  if (value < node.value) node.left = insert(node.left, value);
  else node.right = insert(node.right, value);
  return node;
}
function inOrder(node, visit) { if (!node) return; inOrder(node.left, visit); visit(node.value); inOrder(node.right, visit); }

An in-order traversal of a BST visits values in sorted order. Breadth-first traversal uses a queue; depth-first traversal uses recursion or a stack.

Practice: write a function that returns the height of a binary tree.`,
      },
    ],
    quiz: {
      title: "Data Structures and Algorithms Checkpoint",
      questions: [
        { q: "What is the time complexity of binary search on a sorted array?", options: ["O(1)", "O(log n)", "O(n)", "O(n^2)"], answer: 1 },
        { q: "Which structure is last in, first out?", options: ["Queue", "Stack", "Set", "Linked list"], answer: 1 },
        { q: "What is the average time complexity of looking up a key in a hash map?", options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], answer: 0 },
        { q: "What must every recursive function have to avoid running forever?", options: ["A loop", "A base case", "A global variable", "An array"], answer: 1 },
        { q: "In a binary search tree, where are values smaller than a node stored?", options: ["In the right subtree", "In the left subtree", "At the root only", "In a separate array"], answer: 1 },
      ],
    },
    assignment: {
      title: "Implement and Analyse Core Data Structures",
      description: "In JavaScript, implement a Stack, a Queue and a binary search tree with insert and in-order traversal.\n1. Write each structure as a class with the methods discussed in the lessons.\n2. Add at least three test cases for each structure (for example with console.assert).\n3. Solve two-sum using a Map.\n4. For every method you wrote, state its time complexity in Big-O notation.\n\nSubmit your code and a short table of complexities.",
      dueInDays: 21,
    },
  },
];
