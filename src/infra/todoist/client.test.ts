import { describe, expect, it, vi } from "vitest";
import { TodoistClient } from "./client.js";

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("TodoistClient", () => {
  it("unwraps paginated project responses", async () => {
    const fetchFn = vi.fn(async () =>
      createJsonResponse({
        results: [{ id: "p1", name: "Inbox", is_inbox_project: true }],
        next_cursor: null,
      }),
    );
    const client = new TodoistClient({ apiToken: "td_test", fetchFn: fetchFn as typeof fetch });

    await expect(client.listProjects()).resolves.toEqual([
      {
        id: "p1",
        isInboxProject: true,
        name: "Inbox",
        raw: { id: "p1", is_inbox_project: true, name: "Inbox" },
      },
    ]);
  });

  it("unwraps paginated task responses", async () => {
    const fetchFn = vi.fn(async () =>
      createJsonResponse({
        results: [{ id: "t1", content: "Ship it", project_id: "p1", url: "https://todoist.com" }],
        next_cursor: null,
      }),
    );
    const client = new TodoistClient({ apiToken: "td_test", fetchFn: fetchFn as typeof fetch });

    await expect(client.listTasks()).resolves.toEqual([
      {
        content: "Ship it",
        id: "t1",
        isCompleted: undefined,
        projectId: "p1",
        raw: { content: "Ship it", id: "t1", project_id: "p1", url: "https://todoist.com" },
        url: "https://todoist.com",
      },
    ]);
  });
});
