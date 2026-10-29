import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { loggedInOwner } from "./helpers.js";

const app = createApp();

describe("staff API", () => {
  let ali: Awaited<ReturnType<typeof loggedInOwner>>;

  beforeEach(async () => {
    ali = await loggedInOwner(app, "kedai-ali");
  });

  it("requires login", async () => {
    const res = await request(app).get("/api/staff");
    expect(res.status).toBe(401);
  });

  it("creates and lists staff, oldest first", async () => {
    await ali.post("/api/staff").send({ name: "Ali" });
    const farid = await ali.post("/api/staff").send({ name: "Farid" });
    expect(farid.status).toBe(201);
    expect(farid.body.staff).toEqual({
      id: expect.any(String),
      name: "Farid",
      active: true,
    });

    const list = await ali.get("/api/staff");
    expect(list.body.staff.map((s: { name: string }) => s.name)).toEqual([
      "Ali",
      "Farid",
    ]);
  });

  it("rejects a blank name", async () => {
    const res = await ali.post("/api/staff").send({ name: "   " });
    expect(res.status).toBe(400);
    expect(res.body.error.fields).toHaveProperty("name");
  });

  it("renames a staff member", async () => {
    const { body } = await ali.post("/api/staff").send({ name: "Ali" });
    const res = await ali
      .patch(`/api/staff/${body.staff.id}`)
      .send({ name: "Ali Bin Abu" });
    expect(res.status).toBe(200);
    expect(res.body.staff.name).toBe("Ali Bin Abu");
  });

  it("soft-deletes but keeps their working hours", async () => {
    const { body } = await ali.post("/api/staff").send({ name: "Ali" });
    const id = body.staff.id;
    const hours = [{ weekday: 3, start: "10:00", end: "13:00" }];
    await ali.put(`/api/staff/${id}/hours`).send({ hours });

    const del = await ali.delete(`/api/staff/${id}`);
    expect(del.status).toBe(204);

    expect((await ali.get("/api/staff")).body.staff).toEqual([]);
    const all = await ali.get("/api/staff?includeInactive=true");
    expect(all.body.staff).toEqual([
      expect.objectContaining({ id, active: false }),
    ]);

    // still there, ready if they're re-activated later
    const after = await ali.get(`/api/staff/${id}/hours`);
    expect(after.body.hours).toEqual(hours);
  });

  it("keeps businesses apart: another owner can't see or change this staff", async () => {
    const { body } = await ali.post("/api/staff").send({ name: "Ali" });
    const id = body.staff.id;
    const siti = await loggedInOwner(app, "salon-siti");

    expect(
      (await siti.get("/api/staff?includeInactive=true")).body.staff,
    ).toEqual([]);
    expect(
      (await siti.patch(`/api/staff/${id}`).send({ name: "Hacked" })).status,
    ).toBe(404);
    expect((await siti.delete(`/api/staff/${id}`)).status).toBe(404);

    const mine = await ali.get("/api/staff");
    expect(mine.body.staff[0]).toMatchObject({ name: "Ali", active: true });
  });
});
