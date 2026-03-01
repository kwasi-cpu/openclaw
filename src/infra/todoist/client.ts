import { randomUUID } from "node:crypto";
import { formatErrorMessage } from "../errors.js";
import { resolveFetch } from "../fetch.js";
import type {
  TodoistCreateTaskInput,
  TodoistCreateTaskResult,
  TodoistProject,
  TodoistTask,
} from "./types.js";
import { TodoistHttpError } from "./types.js";

const DEFAULT_BASE_URL = "https://api.todoist.com/api/v1";
const DEFAULT_TIMEOUT_MS = 15_000;

type TodoistClientOptions = {
  apiToken: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
};

type JsonObject = Record<string, unknown>;

type RawTodoistProject = {
  id?: unknown;
  name?: unknown;
  is_inbox_project?: unknown;
};

type RawTodoistListResponse<T> =
  | T[]
  | {
      results?: T[];
      next_cursor?: unknown;
    };

type RawTodoistTask = {
  id?: unknown;
  content?: unknown;
  description?: unknown;
  project_id?: unknown;
  url?: unknown;
  is_completed?: unknown;
};

export class TodoistClient {
  private readonly apiToken: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchFn: typeof fetch;

  constructor(options: TodoistClientOptions) {
    const apiToken = options.apiToken.trim();
    if (!apiToken) {
      throw new Error("Todoist API token is required");
    }
    const fetchFn = resolveFetch(options.fetchFn);
    if (!fetchFn) {
      throw new Error("Fetch is not available in this runtime");
    }
    this.apiToken = apiToken;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchFn = fetchFn;
  }

  async listProjects(): Promise<TodoistProject[]> {
    const payload = await this.requestJson<RawTodoistListResponse<RawTodoistProject>>("projects");
    return unwrapListPayload(payload, "projects").map((item) => toProject(item));
  }

  async listTasks(params: { filter?: string; lang?: string } = {}): Promise<TodoistTask[]> {
    const query = new URLSearchParams();
    if (params.filter?.trim()) {
      query.set("filter", params.filter.trim());
    }
    if (params.lang?.trim()) {
      query.set("lang", params.lang.trim());
    }
    const suffix = query.size > 0 ? `?${query.toString()}` : "";
    const payload = await this.requestJson<RawTodoistListResponse<RawTodoistTask>>(`tasks${suffix}`);
    return unwrapListPayload(payload, "tasks").map((item) => toTask(item));
  }

  async createTask(input: TodoistCreateTaskInput): Promise<TodoistCreateTaskResult> {
    const content = input.content.trim();
    if (!content) {
      throw new Error("Todoist task content is required");
    }
    const payload = await this.requestJson<RawTodoistTask>("tasks", {
      method: "POST",
      headers: {
        "X-Request-Id": randomUUID(),
      },
      body: JSON.stringify({
        content,
        ...(input.description?.trim() ? { description: input.description.trim() } : {}),
        ...(input.projectId?.trim() ? { project_id: input.projectId.trim() } : {}),
        ...(input.sectionId?.trim() ? { section_id: input.sectionId.trim() } : {}),
        ...(input.parentId?.trim() ? { parent_id: input.parentId.trim() } : {}),
        ...(input.labels && input.labels.length > 0 ? { labels: input.labels } : {}),
        ...(typeof input.priority === "number" ? { priority: input.priority } : {}),
        ...(input.dueString?.trim() ? { due_string: input.dueString.trim() } : {}),
        ...(input.dueDate?.trim() ? { due_date: input.dueDate.trim() } : {}),
      }),
    });
    return { task: toTask(payload), raw: payload };
  }

  async closeTask(taskId: string): Promise<{ success: true }> {
    const id = taskId.trim();
    if (!id) {
      throw new Error("Todoist task id is required");
    }
    await this.request(`tasks/${encodeURIComponent(id)}/close`, {
      method: "POST",
      headers: {
        "X-Request-Id": randomUUID(),
      },
    });
    return { success: true };
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
          Authorization: `Bearer ${this.apiToken}`,
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
      throw new TodoistHttpError(response.status, buildHttpErrorMessage(response.status, body), body);
    } catch (error) {
      if (error instanceof TodoistHttpError) {
        throw error;
      }
      throw new Error(`Todoist request failed: ${formatErrorMessage(error)}`, { cause: error });
    } finally {
      clearTimeout(timeout);
    }
  }
}

function toProject(raw: RawTodoistProject): TodoistProject {
  const id = coerceStringId(raw.id);
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (!id || !name) {
    throw new Error("Todoist project payload is missing id or name");
  }
  return {
    id,
    name,
    isInboxProject: typeof raw.is_inbox_project === "boolean" ? raw.is_inbox_project : undefined,
    raw,
  };
}

function toTask(raw: RawTodoistTask): TodoistTask {
  const id = coerceStringId(raw.id);
  const content = typeof raw.content === "string" ? raw.content.trim() : "";
  if (!id || !content) {
    throw new Error("Todoist task payload is missing id or content");
  }
  return {
    id,
    content,
    description: typeof raw.description === "string" ? raw.description : undefined,
    projectId: coerceOptionalString(raw.project_id),
    url: coerceOptionalString(raw.url),
    isCompleted: typeof raw.is_completed === "boolean" ? raw.is_completed : undefined,
    raw,
  };
}

function coerceStringId(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return "";
}

function coerceOptionalString(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

function unwrapListPayload<T>(payload: RawTodoistListResponse<T>, resourceName: string): T[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && typeof payload === "object" && Array.isArray(payload.results)) {
    return payload.results;
  }
  throw new Error(`Todoist ${resourceName} payload did not include an array of results`);
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
  return detail ? `Todoist HTTP ${status}: ${detail}` : `Todoist HTTP ${status}`;
}

function extractMessage(body: unknown): string | undefined {
  if (!body || typeof body !== "object") {
    return typeof body === "string" && body.trim() ? body.trim() : undefined;
  }
  const value = (body as JsonObject).message;
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
