import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

const app = createApp();

const ali = {
  businessName: "Kedai Gunting Ali",
  slug: "kedai-ali",
  email: "ali@example.com",
  password: "correct-horse-battery",
};

function register(body: object = ali) {
  return request(app).post("/api/auth/register").send(body);
}

describe("POST /api/auth/register", () => {
  it("creates the business and owner, and logs them in", async () => {
    const res = await register();

    expect(res.status).toBe(201);
    expect(res.body.tenant).toMatchObject({
      name: "Kedai Gunting Ali",
      slug: "kedai-ali",
      timezone: "Asia/Kuala_Lumpur",
    });
    expect(res.body.user).toMatchObject({
      email: "ali@example.com",
      role: "owner",
      tenantId: res.body.tenant.id,
    });
    expect(res.body.user).not.toHaveProperty("passwordHash");
    expect(res.headers["set-cookie"]?.[0]).toMatch(/^sid=.+HttpOnly/);
  });

  it("rejects a taken email and leaves no orphaned business behind", async () => {
    await register();

    const taken = await register({ ...ali, slug: "other-shop" });
    expect(taken.status).toBe(409);
    expect(taken.body.error.code).toBe("EMAIL_TAKEN");

    // if the transaction had leaked, "other-shop" would now be SLUG_TAKEN
    const retry = await register({
      ...ali,
      slug: "other-shop",
      email: "siti@example.com",
    });
    expect(retry.status).toBe(201);
  });

  it("rejects a taken slug", async () => {
    await register();
    const res = await register({ ...ali, email: "siti@example.com" });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("SLUG_TAKEN");
  });

  it("returns field errors for invalid input", async () => {
    const res = await register({
      businessName: "Kedai",
      slug: "bad slug!",
      email: "nope",
      password: "short",
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
    expect(Object.keys(res.body.error.fields).sort()).toEqual([
      "email",
      "password",
      "slug",
    ]);
  });
});

describe("POST /api/auth/login", () => {
  it("returns the user and their business", async () => {
    await register();
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "ALI@example.com", password: ali.password });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("ali@example.com");
    expect(res.body.tenant.slug).toBe("kedai-ali");
  });

  it("gives the same error for a wrong password and an unknown email", async () => {
    await register();
    const wrongPassword = await request(app)
      .post("/api/auth/login")
      .send({ email: ali.email, password: "not-the-password" });
    const unknownEmail = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: ali.password });

    for (const res of [wrongPassword, unknownEmail]) {
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    }
  });
});

describe("GET /api/auth/me and POST /api/auth/logout", () => {
  it("returns the account while logged in, and 401 after logout", async () => {
    const agent = request.agent(app); // keeps cookies between requests, like a browser
    await agent.post("/api/auth/register").send(ali);

    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.tenant.slug).toBe("kedai-ali");

    const logout = await agent.post("/api/auth/logout");
    expect(logout.status).toBe(204);

    const after = await agent.get("/api/auth/me");
    expect(after.status).toBe(401);
    expect(after.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("returns 401 without a session", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});
