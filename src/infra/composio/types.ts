export type ComposioToolkitRef = {
  slug?: string | null;
  name?: string | null;
};

export type ComposioToolSummary = {
  slug: string;
  name: string;
  description?: string | null;
  toolkit?: ComposioToolkitRef | null;
};

export type ComposioToolDefinition = ComposioToolSummary & {
  inputParameters?: unknown;
  outputParameters?: unknown;
  raw: unknown;
};

export type ComposioConnectedAccount = {
  id: string;
  status?: string | null;
  provider?: string | null;
  toolkit?: ComposioToolkitRef | null;
  raw: unknown;
};

export type ComposioExecuteToolInput = {
  toolSlug: string;
  connectedAccountId: string;
  arguments: Record<string, unknown>;
};

export type ComposioExecuteToolResult = {
  successful: boolean;
  data: unknown;
  error: unknown;
  raw: unknown;
};

export class ComposioHttpError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = "ComposioHttpError";
    this.status = status;
    this.body = body;
  }
}
