const express = require("express");
const cors = require("cors");
const db = require("./db/database");

const app = express();

app.use(cors());
app.use(express.json());

const statusToColumnId = { todo: 1, in_progress: 2, done: 3 };
const columnIdToStatus = { 1: "todo", 2: "in_progress", 3: "done" };

// GET /api/board (Includes due_date)
app.get("/api/board", (req, res) => {
  const query = `
    SELECT c.id as column_id, c.name as column_name, 
           t.id as task_id, t.title, t.description, t.priority, t.due_date, t.created_date
    FROM columns c
    LEFT JOIN tasks t ON c.id = t.column_id
    ORDER BY c.id ASC, t.id DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const columnsMap = {};
    rows.forEach((row) => {
      if (!columnsMap[row.column_id]) {
        columnsMap[row.column_id] = {
          id: row.column_id,
          name: row.column_name,
          tasks: [],
        };
      }
      if (row.task_id) {
        columnsMap[row.column_id].tasks.push({
          id: row.task_id,
          title: row.title,
          description: row.description,
          priority: row.priority,
          due_date: row.due_date,
          created_date: row.created_date,
          column_id: row.column_id,
          status: columnIdToStatus[row.column_id],
        });
      }
    });
    res.status(200).json(Object.values(columnsMap));
  });
});

// GET /api/tasks
app.get("/api/tasks", (req, res) => {
  const { search, priority } = req.query;
  let query = "SELECT * FROM tasks WHERE 1=1";
  const params = [];

  if (priority && priority !== "All") {
    query += " AND priority = ?";
    params.push(priority);
  }

  if (search) {
    query += " AND (title LIKE ? OR description LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY 
    CASE priority 
      WHEN 'High' THEN 1 
      WHEN 'Medium' THEN 2 
      WHEN 'Low' THEN 3 
      ELSE 4 
    END ASC, id DESC`;

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const formatted = rows.map((t) => ({
      ...t,
      status: columnIdToStatus[t.column_id] || "todo",
    }));
    res.json(formatted);
  });
});

// POST /api/tasks (Inserts due_date)
app.post("/api/tasks", (req, res) => {
  const { title, description, priority, status, column_id, due_date } =
    req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Task title is required" });
  }

  const targetColumnId = column_id || statusToColumnId[status] || 1;

  const query = `
    INSERT INTO tasks (column_id, title, description, priority, due_date)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(
    query,
    [
      targetColumnId,
      title.trim(),
      description || "",
      priority || "Medium",
      due_date || null,
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({
        id: this.lastID,
        column_id: targetColumnId,
        title,
        description,
        priority,
        due_date: due_date || null,
        status: columnIdToStatus[targetColumnId],
      });
    },
  );
});

// UPDATE / MOVE Handler (Updates due_date)
const updateTaskHandler = (req, res) => {
  const { id } = req.params;
  const { title, description, priority, status, column_id, due_date } =
    req.body;

  const updates = [];
  const params = [];

  if (title !== undefined) {
    if (!title.trim())
      return res.status(400).json({ error: "Title cannot be empty" });
    updates.push("title = ?");
    params.push(title.trim());
  }

  if (description !== undefined) {
    updates.push("description = ?");
    params.push(description);
  }

  if (priority !== undefined) {
    updates.push("priority = ?");
    params.push(priority);
  }

  if (due_date !== undefined) {
    updates.push("due_date = ?");
    params.push(due_date);
  }

  if (column_id !== undefined) {
    updates.push("column_id = ?");
    params.push(Number(column_id));
  } else if (status !== undefined && statusToColumnId[status]) {
    updates.push("column_id = ?");
    params.push(statusToColumnId[status]);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: "No fields provided for update" });
  }

  const query = `UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`;
  params.push(id);

  db.run(query, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0)
      return res.status(404).json({ error: "Task not found" });
    res.status(200).json({ message: "Task updated successfully" });
  });
};

app.put("/api/tasks/:id", updateTaskHandler);
app.patch("/api/tasks/:id", updateTaskHandler);
app.put("/api/tasks/:id/move", updateTaskHandler);
app.patch("/api/tasks/:id/move", updateTaskHandler);

// DELETE /api/tasks/:id
app.delete("/api/tasks/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM tasks WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0)
      return res.status(404).json({ error: "Task not found" });
    res.status(200).json({ message: "Task deleted successfully" });
  });
});

// GET /api/analytics/tasks-per-column
app.get("/api/analytics/tasks-per-column", (req, res) => {
  const query = `
    SELECT 
      c.id AS column_id, 
      c.name AS column_name, 
      COUNT(t.id) AS task_count
    FROM columns c
    LEFT JOIN tasks t ON c.id = t.column_id
    GROUP BY c.id;
  `;

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(rows);
  });
});

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
