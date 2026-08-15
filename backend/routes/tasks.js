const express = require("express");
const router = express.Router();
const db = require("../db/database");

router.get("/board", (req, res) => {
  const query = `
        SELECT c.id as column_id, c.name as column_name, 
               t.id as task_id, t.title, t.description, t.priority, t.created_date
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
          created_date: row.created_date,
          column_id: row.column_id,
        });
      }
    });
    res.json(Object.values(columnsMap));
  });
});

router.post("/tasks", (req, res) => {
  const { title, description, priority, column_id } = req.body;

  if (!title || title.trim() === "") {
    return res
      .status(400)
      .json({ error: "Task title is required and cannot be empty." });
  }

  const sql = `INSERT INTO tasks (column_id, title, description, priority) VALUES (?, ?, ?, ?)`;
  db.run(
    sql,
    [column_id || 1, title.trim(), description || "", priority || "Medium"],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({
        id: this.lastID,
        title,
        description,
        priority,
        column_id: column_id || 1,
      });
    },
  );
});

router.put("/tasks/:id", (req, res) => {
  const { title, description, priority } = req.body;

  if (!title || title.trim() === "") {
    return res.status(400).json({ error: "Task title cannot be empty." });
  }

  const sql = `UPDATE tasks SET title = ?, description = ?, priority = ? WHERE id = ?`;
  db.run(
    sql,
    [title.trim(), description, priority, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Task updated successfully" });
    },
  );
});

router.patch("/tasks/:id/move", (req, res) => {
  const { column_id } = req.body;
  const sql = `UPDATE tasks SET column_id = ? WHERE id = ?`;
  db.run(sql, [column_id, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Task moved successfully" });
  });
});

router.delete("/tasks/:id", (req, res) => {
  db.run(`DELETE FROM tasks WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Task deleted successfully" });
  });
});

router.get("/analytics/tasks-per-column", (req, res) => {
  const sql = `
        SELECT c.id, c.name, COUNT(t.id) as task_count
        FROM columns c
        LEFT JOIN tasks t ON c.id = t.column_id
        GROUP BY c.id, c.name
    `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.get("/analytics/tasks-by-priority", (req, res) => {
  const priority = req.query.priority || "High";
  const sql = `
        SELECT * FROM tasks 
        WHERE priority = ? 
        ORDER BY created_date DESC
    `;
  db.all(sql, [priority], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;
