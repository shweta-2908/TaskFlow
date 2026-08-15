const request = require("supertest");
const app = require("../../server");
const db = require("../database");

describe("TaskFlow API Tests", () => {
  beforeAll((done) => {
    const checkDbReady = () => {
      db.get("SELECT COUNT(*) as count FROM columns", (err, row) => {
        if (!err && row && row.count > 0) {
          done();
        } else {
          setTimeout(checkDbReady, 50);
        }
      });
    };
    checkDbReady();
  });

  test("1. Creating a task with an empty title fails", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "", priority: "High", column_id: 1 });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("error");
  });

  test("2. Moving a task updates its column correctly", async () => {
    const createRes = await request(app)
      .post("/api/tasks")
      .send({ title: "Task To Be Moved", priority: "Medium", column_id: 1 });

    expect(createRes.statusCode).toEqual(201);
    const taskId = createRes.body.id;

    const moveRes = await request(app)
      .patch(`/api/tasks/${taskId}/move`)
      .send({ column_id: 2 });

    expect(moveRes.statusCode).toEqual(200);

    const boardRes = await request(app).get("/api/board");
    expect(boardRes.statusCode).toEqual(200);

    const inProgressCol = boardRes.body.find((c) => c.id === 2);
    expect(inProgressCol).toBeDefined();

    const movedTask = inProgressCol.tasks.find((t) => t.id === taskId);
    expect(movedTask).toBeDefined();
  });

  test("3. DB query returns task counts per column", async () => {
    const res = await request(app).get("/api/analytics/tasks-per-column");
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body[0]).toHaveProperty("task_count");
  });
});
