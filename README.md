# TaskFlow — Full-Stack Kanban Task Management Board

TaskFlow is a full-stack, lightweight task board application designed to create, organize, and manage tasks across customizable columns. Built with Node.js, Express, SQLite, and React, it features real-time UI state updates, input validation, custom relational queries, and automated Jest API tests.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), JavaScript (ES6+), CSS3 / Modern Styling
- **Backend**: Node.js, Express.js, Supertest[cite: 1, 2, 7, 8]
- **Database**: SQLite3 with foreign key enforcement enabled (`taskflow.db`)[cite: 1, 3]
- **Testing**: Jest unit testing framework

---

## 🚀 Quick Start & Installation

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** (v8 or higher)[cite: 1, 2]

---

### 1. Backend Setup

1. Open your terminal and navigate to the backend directory:

2. Install dependencies:
 
 ```bash
   cd backend
 ```
   

4. Run automated tests to verify database and API integrity:
 ```bash

   npm install

 ```

5. Start the backend API server:
 ```bash

   npm start

 ```
   The server runs on http://localhost:5000 by default

  

### 2. Frontend Setup

1. Open a new terminal window and navigate to the frontend directory:

   ```bash

   cd frontend

   ```

2. Install dependencies:
   ```bash
   
   npm install
   
   ```

4. Start the React development server:
 ```bash

   npm run dev

   ```
   The client app runs on http://localhost:5173

   

### 3. Database Architecture & Queries

The system utilizes an SQLite database enforcing relational constraints.

Schema Definition (backend/db/schema.sql)  
CREATE TABLE IF NOT EXISTS boards (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS columns (
id INTEGER PRIMARY KEY AUTOINCREMENT,
board_id INTEGER NOT NULL,
name TEXT NOT NULL,
FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tasks (
id INTEGER PRIMARY KEY AUTOINCREMENT,
column_id INTEGER NOT NULL,
title TEXT NOT NULL,
description TEXT,
priority TEXT CHECK(priority IN ('Low', 'Medium', 'High')) DEFAULT 'Medium',
created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE
);

### 4. Essential Custom SQL Queries

- Board Aggregation with Tasks (GET /api/board):
  SELECT c.id as column_id, c.name as column_name,
  t.id as task_id, t.title, t.description, t.priority, t.created_date
  FROM columns c
  LEFT JOIN tasks t ON c.id = t.column_id
  ORDER BY c.id ASC, t.id DESC;

- Task Count Per Column Analytics (GET /api/analytics/tasks-per-column):
  SELECT c.id AS column_id, c.name AS column_name, COUNT(t.id) AS task_count
  FROM columns c
  LEFT JOIN tasks t ON c.id = t.column_id
  GROUP BY c.id;

- Priority Ordering Search (GET /api/tasks):
  SELECT \* FROM tasks WHERE 1=1
  ORDER BY CASE priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 3 ELSE 4 END ASC, id DESC;

### 5. Automated Testing

- Backend unit and integration tests are powered by Jest and Supertest [cite: 1, 2, 7].

To run the test suite:

cd backend
npm test

- Covered Test Cases
  1.  Validation Check: Rejects task creation attempts when the title field is empty or missing (400 Bad Request).
  2.  Column State Update: Successfully updates a task's column_id when moved and reflects state across board queries (200 OK).
  3.  Database Layer Check: Queries task distribution analytics and validates expected aggregate keys

### 6. Submission Notes & Trade-offs

- Design Trade-offs: Used explicit column selection for moving tasks to guarantee cross-device stability and keyboard accessibility without adding third-party drag-and-drop bundle overhead[cite: 1, 2].

- Time Spent: ~3.5 hours (Database design, REST API routes, React UI, state sync, input validation, and Jest tests)[cite: 1, 2, 7, 8].

- Future Improvements: Drag-and-drop column positioning, WebSockets for multi-user collaboration, and user authentication[cite: 1, 2].
