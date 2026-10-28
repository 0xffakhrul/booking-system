import request from "supertest";
import type { Express } from "express";

/** Registers a business and returns an agent that's logged in as its owner */
export async function loggedInOwner(app: Express, slug = "kedai-ali") {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/register").send({
    businessName: `Shop ${slug}`,
    slug,
    email: `owner@${slug}.example.com`,
    password: "correct-horse-battery",
  });
  if (res.status !== 201) throw new Error(`register failed: ${res.text}`);
  return agent;
}
