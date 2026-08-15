import React, { useState, useEffect } from "react";
import "./App.css";

export default function TaskBoard() {
  const [tasks, setTasks] = useState([]);
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTask, setCurrentTask] = useState({
    id: null,
    title: "",
    description: "",
    priority: "Medium",
    due_date: "",
    status: "todo",
  });

  useEffect(() => {
    fetchTasks();
  }, [priorityFilter, searchQuery]);

  const fetchTasks = async () => {
    try {
      const query = new URLSearchParams({
        priority: priorityFilter,
        search: searchQuery,
      });
      const res = await fetch(`http://localhost:5000/api/tasks?${query}`);
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  const handleOpenCreateModal = (columnStatus) => {
    setIsEditing(false);
    setCurrentTask({
      id: null,
      title: "",
      description: "",
      priority: "Medium",
      due_date: "",
      status: columnStatus,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setIsEditing(true);
    setCurrentTask({
      id: task.id,
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      due_date: task.due_date || "",
      status: task.status,
    });
    setIsModalOpen(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!currentTask.title.trim()) return alert("Please enter a task title");

    try {
      const url = isEditing
        ? `http://localhost:5000/api/tasks/${currentTask.id}`
        : "http://localhost:5000/api/tasks";
      const method = isEditing ? "PUT" : "POST";

      const { id, ...taskPayload } = currentTask;
      const bodyPayload = isEditing ? currentTask : taskPayload;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchTasks();
      } else {
        const errorData = await res.json();
        alert(`Failed to save task: ${errorData.error || res.statusText}`);
      }
    } catch (err) {
      console.error("Error saving task:", err);
      alert(
        "Could not connect to the server. Check if backend is running on port 5000.",
      );
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  const columns = [
    { key: "todo", title: "To Do" },
    { key: "in_progress", title: "In Progress" },
    { key: "done", title: "Done" },
  ];

  return (
    <div className="board-container">
      <header className="board-header">
        <div>
          <h1>TaskFlow — Small Team Board</h1>
          <p className="subtext">Due 18 August 2026</p>
        </div>
        <div className="filter-controls">
          <label>Filter by Priority:</label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="All">[All]</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="kanban-grid">
        {columns.map((col) => (
          <div key={col.key} className="kanban-column">
            <h2>{col.title}</h2>
            <div className="task-list">
              {tasks
                .filter((t) => t.status === col.key)
                .map((task) => (
                  <div key={task.id} className="task-card">
                    <div className="card-header">
                      <h3>{task.title}</h3>
                      <div className="card-actions">
                        <button
                          className="icon-btn"
                          title="Edit Task"
                          onClick={() => handleOpenEditModal(task)}
                        >
                          ✎
                        </button>
                        <button
                          className="icon-btn"
                          title="Delete Task"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                    {task.description && (
                      <p className="card-desc">{task.description}</p>
                    )}
                    <div className="card-footer">
                      <span
                        className={`badge badge-${task.priority.toLowerCase()}`}
                      >
                        {task.priority}
                      </span>
                      {task.due_date && (
                        <span className="due-date">{task.due_date}</span>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            {col.key !== "done" && (
              <button
                className="add-task-btn"
                onClick={() => handleOpenCreateModal(col.key)}
              >
                Add New Task +
              </button>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>
              {isEditing
                ? "Edit Task"
                : `Add Task to ${currentTask.status === "todo" ? "To Do" : "In Progress"}`}
            </h2>
            <form onSubmit={handleSaveTask}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  required
                  value={currentTask.title}
                  onChange={(e) =>
                    setCurrentTask({ ...currentTask, title: e.target.value })
                  }
                  placeholder="e.g. Design Database Schema"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={currentTask.description}
                  onChange={(e) =>
                    setCurrentTask({
                      ...currentTask,
                      description: e.target.value,
                    })
                  }
                  placeholder="Task description or notes..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={currentTask.status}
                    onChange={(e) =>
                      setCurrentTask({ ...currentTask, status: e.target.value })
                    }
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={currentTask.priority}
                    onChange={(e) =>
                      setCurrentTask({
                        ...currentTask,
                        priority: e.target.value,
                      })
                    }
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="text"
                  placeholder="e.g. Aug 15"
                  value={currentTask.due_date}
                  onChange={(e) =>
                    setCurrentTask({ ...currentTask, due_date: e.target.value })
                  }
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {isEditing ? "Save Changes" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
