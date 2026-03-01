import { describe, expect, it, vi } from "vitest";
import {
  todoistCloseTaskCommand,
  todoistCreateTaskCommand,
  todoistListProjectsCommand,
  todoistListTasksCommand,
} from "./todoist.js";

function createRuntime() {
  return {
    log: vi.fn(),
    error: vi.fn(),
    exit: vi.fn(),
  };
}

describe("todoist commands", () => {
  it("resolves API token from skill env for task creation", async () => {
    const runtime = createRuntime();
    const createTask = vi.fn(async () => ({
      task: { id: "1", content: "Test", raw: {} },
      raw: {},
    }));

    await todoistCreateTaskCommand(
      { skill: "todoist-operator", content: "Test task" },
      runtime,
      {
        loadConfig: async () =>
          ({
            skills: {
              entries: {
                "todoist-operator": {
                  env: {
                    TODOIST_API_TOKEN: "td_test",
                  },
                },
              },
            },
          }) as never,
        createClient: () =>
          ({
            listProjects: vi.fn(),
            listTasks: vi.fn(),
            createTask,
            closeTask: vi.fn(),
          }) as never,
      },
    );

    expect(createTask).toHaveBeenCalledWith({
      content: "Test task",
      description: undefined,
      projectId: undefined,
      sectionId: undefined,
      parentId: undefined,
      labels: undefined,
      priority: undefined,
      dueString: undefined,
      dueDate: undefined,
    });
  });

  it("prints projects in plain text", async () => {
    const runtime = createRuntime();
    await todoistListProjectsCommand({ skill: "todoist-operator" }, runtime, {
      loadConfig: async () =>
        ({
          skills: { entries: { "todoist-operator": { env: { TODOIST_API_TOKEN: "td_test" } } } },
        }) as never,
      createClient: () =>
        ({
          listProjects: async () => [{ id: "p1", name: "Inbox", raw: {} }],
          listTasks: vi.fn(),
          createTask: vi.fn(),
          closeTask: vi.fn(),
        }) as never,
    });

    expect(runtime.log).toHaveBeenCalledWith("p1\tInbox");
  });

  it("prints tasks in plain text", async () => {
    const runtime = createRuntime();
    await todoistListTasksCommand({ skill: "todoist-operator" }, runtime, {
      loadConfig: async () =>
        ({
          skills: { entries: { "todoist-operator": { env: { TODOIST_API_TOKEN: "td_test" } } } },
        }) as never,
      createClient: () =>
        ({
          listProjects: vi.fn(),
          listTasks: async () => [{ id: "t1", content: "Ship it", projectId: "p1", raw: {} }],
          createTask: vi.fn(),
          closeTask: vi.fn(),
        }) as never,
    });

    expect(runtime.log).toHaveBeenCalledWith("t1\tShip it\tp1\t-");
  });

  it("prints closed task confirmation", async () => {
    const runtime = createRuntime();
    await todoistCloseTaskCommand("t1", { skill: "todoist-operator" }, runtime, {
      loadConfig: async () =>
        ({
          skills: { entries: { "todoist-operator": { env: { TODOIST_API_TOKEN: "td_test" } } } },
        }) as never,
      createClient: () =>
        ({
          listProjects: vi.fn(),
          listTasks: vi.fn(),
          createTask: vi.fn(),
          closeTask: async () => ({ success: true }),
        }) as never,
    });

    expect(runtime.log).toHaveBeenCalledWith("closed\tt1");
  });
});
