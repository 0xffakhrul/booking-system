import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { loggedInOwner } from "./helpers.js";

const app = createApp();
const haircut = { name: "Haircut", durationMin: 30, price: 2000 };

describe("services API", () => {
  let ali: Awaited<ReturnType<typeof loggedInOwner>>;

  beforeEach(async () => {
    ali = await loggedInOwner(app, "kedai-ali");
  });

  it("requires login", async () => {
    const res = await request(app).get("/api/services");
    expect(res.status).toBe(401);
  });

  it("creates and lists services", async () => {
    const created = await ali.post("/api/services").send(haircut);
    expect(created.status).toBe(201);
    expect(created.body.service).toEqual({
      id: expect.any(String),
      ...haircut,
      active: true,
    });

    const list = await ali.get("/api/services");
    expect(list.body.services).toHaveLength(1);
    expect(list.body.services[0].name).toBe("Haircut");
  });

  it("rejects invalid input", async () => {
    const res = await ali
      .post("/api/services")
      .send({ name: "", durationMin: 7, price: -1 });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.error.fields).sort()).toEqual([
      "durationMin",
      "name",
      "price",
    ]);
  });

  it("updates only the fields sent", async () => {
    const { body } = await ali.post("/api/services").send(haircut);
    const res = await ali
      .patch(`/api/services/${body.service.id}`)
      .send({ price: 2500 });

    expect(res.status).toBe(200);
    expect(res.body.service).toMatchObject({ ...haircut, price: 2500 });
  });

  it("rejects an empty update", async () => {
    const { body } = await ali.post("/api/services").send(haircut);
    const res = await ali.patch(`/api/services/${body.service.id}`).send({});
    expect(res.status).toBe(400);
  });

  it("soft-deletes: hidden from the list, still there with includeInactive", async () => {
    const { body } = await ali.post("/api/services").send(haircut);
    const del = await ali.delete(`/api/services/${body.service.id}`);
    expect(del.status).toBe(204);

    const active = await ali.get("/api/services");
    expect(active.body.services).toHaveLength(0);

    const all = await ali.get("/api/services?includeInactive=true");
    expect(all.body.services).toEqual([
      expect.objectContaining({ name: "Haircut", active: false }),
    ]);
  });

  it("returns 404 for ids that aren't valid or don't exist", async () => {
    for (const id of ["abc", "999999"]) {
      const res = await ali.patch(`/api/services/${id}`).send({ price: 1 });
      expect(res.status).toBe(404);
    }
  });

  it("keeps businesses apart: another owner can't see or change these services", async () => {
    const { body } = await ali.post("/api/services").send(haircut);
    const id = body.service.id;
    const siti = await loggedInOwner(app, "salon-siti");

    const list = await siti.get("/api/services?includeInactive=true");
    expect(list.body.services).toEqual([]);

    const patch = await siti.patch(`/api/services/${id}`).send({ price: 1 });
    expect(patch.status).toBe(404);

    const del = await siti.delete(`/api/services/${id}`);
    expect(del.status).toBe(404);

    // and Ali's service is untouched
    const mine = await ali.get("/api/services");
    expect(mine.body.services[0]).toMatchObject({ price: 2000, active: true });
  });
});
