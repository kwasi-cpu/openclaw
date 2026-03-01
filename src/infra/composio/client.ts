import { formatErrorMessage } from "../errors.js";
import { resolveFetch } from "../fetch.js";
import type {
  ComposioConnectedAccount,
  ComposioExecuteToolInput,
  ComposioExecuteToolResult,
  ComposioToolDefinition,
  ComposioToolSummary,
} from "./types.js";
import { ComposioHttpError } from "./types.js";

const DEFAULT_BASE_URL = "https://backend.composio.dev/api/v3";
const DEFAULT_TIMEOUT_MS = 15_000;

type ComposioClientOptions = {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
};

type JsonObject = Record<string, unknown>;

type ComposioListResponse<T> = {
  items?: T[];
};

type RawComposioTool = {
  slug?: unknown;
  name?: unknown;
  description?: unknown;
  toolkit?: unknown;
  input_parameters?: unknown;
  output_parameters?: unknown;
};

type RawConnectedAccount = {
  id?: unknown;
  status?: unknown;
  provider?: unknown;
  toolkit?: unknown;
};

type RawExecuteResponse = {
  successful?: unknown;
  data?: unknown;
  error?: unknown;
};

export class ComposioClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchFn: typeof fetch;

  constructor(options: ComposioClientOptions) {
    const apiKey = options.apiKey.trim();
    if (!apiKey) {
      throw new Error("Composio API key is required");
    }
    const fetchFn = resolveFetch(options.fetchFn);
    if (!fetchFn) {
      throw new Error("Fetch is not available in this runtime");
    }
    this.apiKey = apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchFn = fetchFn;
  }

  async listTools(
    params: { toolkitSlug?: string; limit?: number } = {},
  ): Promise<ComposioToolSummary[]> {
    const query = new URLSearchParams();
    if (params.toolkitSlug?.trim()) {
      query.set("toolkit_slug", params.toolkitSlug.trim());
    }
    if (typeof params.limit === "number" && Number.isFinite(params.limit)) {
      query.set("limit", String(Math.max(1, Math.trunc(params.limit))));
    }
    const suffix = query.size > 0 ? `?${query.toString()}` : "";
    const payload = await this.requestJson<ComposioListResponse<RawComposioTool>>(
      `tools${suffix}`,
    );
    return (payload.items ?? []).map((item) => toToolSummary(item));
  }

  async getTool(toolSlug: string): Promise<ComposioToolDefinition> {
    const slug = toolSlug.trim();
    if (!slug) {
      throw new Error("Composio tool slug is required");
    }
    const payload = await this.requestJson<RawComposioTool>(`tools/${encodeURIComponent(slug)}`);
    const tool = toToolSummary(payload);
    return {
      ...tool,
      inputParameters: payload.input_parameters,
      outputParameters: payload.output_parameters,
      raw: payload,
    };
  }

  async listConnectedAccounts(
    params: { toolkitSlug?: string } = {},
  ): Promise<ComposioConnectedAccount[]> {
    const query = new URLSearchParams();
    if (params.toolkitSlug?.trim()) {
      query.set("toolkit_slug", params.toolkitSlug.trim());
    }
    const suffix = query.size > 0 ? `?${query.toString()}` : "";
    const payload = await this.requestJson<ComposioListResponse<RawConnectedAccount>>(
      `connected_accounts${suffix}`,
    );
    return (payload.items ?? []).map((item) => toConnectedAccount(item));
  }

  async executeTool(params: ComposioExecuteToolInput): Promise<ComposioExecuteToolResult> {
    const toolSlug = params.toolSlug.trim();
    const connectedAccountId = params.connectedAccountId.trim();
    if (!toolSlug) {
      throw new Error("Composio tool slug is required");
    }
    if (!connectedAccountId) {
      throw new Error("Composio connected account id is required");
    }
    const payload = await this.requestJson<RawExecuteResponse>(
      `tools/execute/${encodeURIComponent(toolSlug)}`,
      {
        method: "POST",
        body: JSON.stringify({
          connected_account_id: connectedAccountId,
          arguments: params.arguments,
        }),
      },
    );
    return {
      successful: payload.successful !== false,
      data: payload.data,
      error: payload.error,
      raw: payload,
    };
  }

  private async requestJson<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await this.request(path, init);
    return (await parseResponseBody(response)) as T;
  }

  private async request(path: string, init?: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchFn(new URL(path, `${this.baseUrl}/`), {
        ...init,
        headers: {
          "X-API-KEY": this.apiKey,
          Accept: "application/json",
          ...(init?.body != null ? { "Content-Type": "application/json" } : {}),
          ...init?.headers,
        },
        signal: controller.signal,
      });
      if (response.ok) {
        return response;
      }
      const body = await parseResponseBody(response);
      throw new ComposioHttpError(
        response.status,
        buildHttpErrorMessage(response.status, body),
        body,
      );
    } catch (error) {
      if (error instanceof ComposioHttpError) {
        throw error;
      }
      throw new Error(`Composio request failed: ${formatErrorMessage(error)}`, { cause: error });
    } finally {
      clearTimeout(timeout);
    }
  }
}

function toToolSummary(raw: RawComposioTool): ComposioToolSummary {
  const slug = typeof raw.slug === "string" ? raw.slug.trim() : "";
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (!slug || !name) {
    throw new Error("Composio tool payload is missing slug or name");
  }
  return {
    slug,
    name,
    description: typeof raw.description === "string" ? raw.description : undefined,
    toolkit: toToolkitRef(raw.toolkit),
  };
}

function toConnectedAccount(raw: RawConnectedAccount): ComposioConnectedAccount {
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  if (!id) {
    throw new Error("Composio connected account payload is missing id");
  }
  return {
    id,
    status: typeof raw.status === "string" ? raw.status : undefined,
    provider: typeof raw.provider === "string" ? raw.provider : undefined,
    toolkit: toToolkitRef(raw.toolkit),
    raw,
  };
}

function toToolkitRef(raw: unknown): { slug?: string | null; name?: string | null } | undefined {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }
  const toolkit = raw as JsonObject;
  const slug = typeof toolkit.slug === "string" ? toolkit.slug : undefined;
  const name = typeof toolkit.name === "string" ? toolkit.name : undefined;
  if (!slug && !name) {
    return undefined;
  }
  return { slug, name };
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  const text = await response.text();
  return text.length > 0 ? text : null;
}

function buildHttpErrorMessage(status: number, body: unknown): string {
  const detail = extractMessage(body);
  return detail ? `Composio HTTP ${status}: ${detail}` : `Composio HTTP ${status}`;
}

function extractMessage(body: unknown): string | undefined {
  if (!body || typeof body !== "object") {
    return typeof body === "string" && body.trim() ? body.trim() : undefined;
  }
  const value = (body as JsonObject).message;
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
