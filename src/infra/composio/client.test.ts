import { describe, expect, it, vi } from "vitest";
import { ComposioClient } from "./client.js";
import { ComposioHttpError } from "./types.js";

describe("ComposioClient", () => {
  it("lists tools with toolkit filtering and auth header", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      expect(headers.get("X-API-KEY")).toBe("ak_test");
      return new Response(
        JSON.stringify({
          items: [{ slug: "NOTION_CREATE_PAGE", name: "Create page", toolkit: { slug: "notion" } }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });
    const client = new ComposioClient({
      apiKey: "ak_test",
      baseUrl: "https://example.invalid/api/v3",
      fetchFn: fetchMock as unknown as typeof fetch,
    });

    const tools = await client.listTools({ toolkitSlug: "notion", limit: 10 });

    expect(fetchMock).toHaveBeenCalledOnce();
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain("/tools?");
    expect(url).toContain("toolkit_slug=notion");
    expect(url).toContain("limit=10");
    expect(tools).toEqual([
      {
        slug: "NOTION_CREATE_PAGE",
        name: "Create page",
        description: undefined,
        toolkit: { slug: "notion", name: undefined },
      },
    ]);
  });

  it("executes a tool with connected account id and arguments", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(body).toEqual({
        connected_account_id: "ca_123",
        arguments: { title: "Test page" },
      });
      return new Response(JSON.stringify({ successful: true, data: { id: "page_1" } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
    const client = new ComposioClient({
      apiKey: "ak_test",
      baseUrl: "https://example.invalid/api/v3",
      fetchFn: fetchMock as unknown as typeof fetch,
    });

    const result = await client.executeTool({
      toolSlug: "NOTION_CREATE_PAGE",
      connectedAccountId: "ca_123",
      arguments: { title: "Test page" },
    });

    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain("/tools/execute/NOTION_CREATE_PAGE");
    expect(result).toEqual({
      successful: true,
      data: { id: "page_1" },
      error: undefined,
      raw: { successful: true, data: { id: "page_1" } },
    });
  });

  it("throws a typed HTTP error when Composio returns a non-OK response", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ message: "Unauthorized" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
    );
    const client = new ComposioClient({
      apiKey: "ak_test",
      baseUrl: "https://example.invalid/api/v3",
      fetchFn: fetchMock as unknown as typeof fetch,
    });

    await expect(client.listConnectedAccounts()).rejects.toEqual(
      expect.objectContaining<Partial<ComposioHttpError>>({
        name: "ComposioHttpError",
        status: 401,
        message: "Composio HTTP 401: Unauthorized",
      }),
    );
  });
});
