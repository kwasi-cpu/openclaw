import { describe, expect, it, vi } from "vitest";
import {
  composioExecuteToolCommand,
  composioListAccountsCommand,
  composioListToolsCommand,
} from "./composio.js";

function createRuntime() {
  return {
    log: vi.fn(),
    error: vi.fn(),
    exit: vi.fn(),
  };
}

describe("composio commands", () => {
  it("resolves api key and account id from skill env for execution", async () => {
    const runtime = createRuntime();
    const executeTool = vi.fn(async () => ({
      successful: true,
      data: { ok: true },
      error: undefined,
      raw: {},
    }));

    await composioExecuteToolCommand(
      "NOTION_CREATE_PAGE",
      {
        skill: "notion-operator",
        accountEnv: "COMPOSIO_CONNECTED_ACCOUNT_ID_NOTION",
        args: '{"title":"Test"}',
      },
      runtime,
      {
        loadConfig: async () =>
          ({
            skills: {
              entries: {
                "notion-operator": {
                  env: {
                    COMPOSIO_API_KEY: "ak_test",
                    COMPOSIO_CONNECTED_ACCOUNT_ID_NOTION: "ca_123",
                  },
                },
              },
            },
          }) as never,
        createClient: () =>
          ({
            listTools: vi.fn(),
            getTool: vi.fn(),
            listConnectedAccounts: vi.fn(),
            executeTool,
          }) as never,
      },
    );

    expect(executeTool).toHaveBeenCalledWith({
      toolSlug: "NOTION_CREATE_PAGE",
      connectedAccountId: "ca_123",
      arguments: { title: "Test" },
    });
  });

  it("prints tool list in plain text", async () => {
    const runtime = createRuntime();
    await composioListToolsCommand(
      { skill: "notion-operator", toolkit: "notion", limit: 5 },
      runtime,
      {
        loadConfig: async () =>
          ({
            skills: { entries: { "notion-operator": { env: { COMPOSIO_API_KEY: "ak_test" } } } },
          }) as never,
        createClient: () =>
          ({
            listTools: async () => [{ slug: "NOTION_CREATE_PAGE", name: "Create page" }],
            getTool: vi.fn(),
            listConnectedAccounts: vi.fn(),
            executeTool: vi.fn(),
          }) as never,
      },
    );

    expect(runtime.log).toHaveBeenCalledWith("NOTION_CREATE_PAGE\tCreate page");
  });

  it("lists connected accounts", async () => {
    const runtime = createRuntime();
    await composioListAccountsCommand({ skill: "notion-operator", toolkit: "notion" }, runtime, {
      loadConfig: async () =>
        ({
          skills: { entries: { "notion-operator": { env: { COMPOSIO_API_KEY: "ak_test" } } } },
        }) as never,
      createClient: () =>
        ({
          listTools: vi.fn(),
          getTool: vi.fn(),
          listConnectedAccounts: async () => [
            { id: "ca_123", status: "ACTIVE", toolkit: { slug: "notion" }, raw: {} },
          ],
          executeTool: vi.fn(),
        }) as never,
    });

    expect(runtime.log).toHaveBeenCalledWith("ca_123\tnotion\tACTIVE");
  });
});
