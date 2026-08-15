INSERT OR IGNORE INTO boards (id, name) VALUES (1, 'Main Project Board');

INSERT OR IGNORE INTO columns (id, board_id, name) VALUES 
(1, 1, 'To Do'),
(2, 1, 'In Progress'),
(3, 1, 'Done');

INSERT OR IGNORE INTO tasks (id, column_id, title, description, priority) VALUES 
(1, 1, 'Setup Database Schema', 'Design SQL schema for boards, columns, and tasks.', 'High'),
(2, 1, 'Build API Routes', 'Create REST endpoints for CRUD operations.', 'Medium'),
(3, 2, 'Develop React UI', 'Build Kanban column components.', 'High'),
(4, 3, 'Write Backend Tests', 'Add unit tests for validation and DB queries.', 'Low');