import type { OpenClawConfig } from "../config/config.js";
import { loadConfig } from "../config/config.js";
import { ComposioClient } from "../infra/composio/client.js";
import type {
  ComposioConnectedAccount,
  ComposioExecuteToolResult,
  ComposioToolDefinition,
  ComposioToolSummary,
} from "../infra/composio/types.js";
import { formatErrorMessage } from "../infra/errors.js";

type RuntimeLike = {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  exit: (code: number) => void;
};

type SharedOptions = {
  skill?: string;
  json?: boolean;
};

type ListToolsOptions = SharedOptions & {
  toolkit?: string;
  limit?: string | number;
};

type GetToolOptions = SharedOptions;

type ListAccountsOptions = SharedOptions & {
  toolkit?: string;
};

type ExecuteToolOptions = SharedOptions & {
  account?: string;
  accountEnv?: string;
  userId?: string;
  userEnv?: string;
  args?: string;
};

type ComposioClientLike = Pick<
  ComposioClient,
  "listTools" | "getTool" | "listConnectedAccounts" | "executeTool"
>;

type ResolveContext = {
  config: OpenClawConfig | undefined;
  skillKey?: string;
};

type CreateClientParams = ResolveContext & {
  apiKey: string;
};

export async function composioListToolsCommand(
  opts: ListToolsOptions,
  runtime: RuntimeLike,
  deps: {
    createClient?: (params: CreateClientParams) => ComposioClientLike;
    loadConfig?: typeof loadConfig;
  } = {},
): Promise<void> {
  const config = await (deps.loadConfig ?? loadConfig)();
  const client = createClient(
    {
      config,
      skillKey: opts.skill,
      apiKey: resolveComposioApiKey({ config, skillKey: opts.skill }),
    },
    deps,
  );
  const limit = normalizeLimit(opts.limit);
  const tools = await client.listTools({ toolkitSlug: opts.toolkit, limit });
  printTools(tools, Boolean(opts.json), runtime);
}

export async function composioGetToolCommand(
  toolSlug: string,
  opts: GetToolOptions,
  runtime: RuntimeLike,
  deps: {
    createClient?: (params: CreateClientParams) => ComposioClientLike;
    loadConfig?: typeof loadConfig;
  } = {},
): Promise<void> {
  const config = await (deps.loadConfig ?? loadConfig)();
  const client = createClient(
    {
      config,
      skillKey: opts.skill,
      apiKey: resolveComposioApiKey({ config, skillKey: opts.skill }),
    },
    deps,
  );
  const tool = await client.getTool(toolSlug);
  printTool(tool, Boolean(opts.json), runtime);
}

export async function composioListAccountsCommand(
  opts: ListAccountsOptions,
  runtime: RuntimeLike,
  deps: {
    createClient?: (params: CreateClientParams) => ComposioClientLike;
    loadConfig?: typeof loadConfig;
  } = {},
): Promise<void> {
  const config = await (deps.loadConfig ?? loadConfig)();
  const client = createClient(
    {
      config,
      skillKey: opts.skill,
      apiKey: resolveComposioApiKey({ config, skillKey: opts.skill }),
    },
    deps,
  );
  const accounts = await client.listConnectedAccounts({ toolkitSlug: opts.toolkit });
  printAccounts(accounts, Boolean(opts.json), runtime);
}

export async function composioExecuteToolCommand(
  toolSlug: string,
  opts: ExecuteToolOptions,
  runtime: RuntimeLike,
  deps: {
    createClient?: (params: CreateClientParams) => ComposioClientLike;
    loadConfig?: typeof loadConfig;
  } = {},
): Promise<void> {
  const config = await (deps.loadConfig ?? loadConfig)();
  const skillKey = opts.skill;
  const apiKey = resolveComposioApiKey({ config, skillKey });
  const connectedAccountId = resolveConnectedAccountId({
    config,
    skillKey,
    explicitAccount: opts.account,
    accountEnvName: opts.accountEnv,
  });
  const userId = resolveUserId({
    config,
    skillKey,
    explicitUserId: opts.userId,
    userEnvName: opts.userEnv,
    accountEnvName: opts.accountEnv,
  });
  const args = parseJsonArgs(opts.args);
  const client = createClient({ config, skillKey, apiKey }, deps);
  const result = await client.executeTool({
    toolSlug,
    connectedAccountId,
    userId,
    arguments: args,
  });
  printExecutionResult(result, Boolean(opts.json), runtime);
}

function createClient(
  params: CreateClientParams,
  deps: { createClient?: (params: CreateClientParams) => ComposioClientLike },
): ComposioClientLike {
  return deps.createClient?.(params) ?? new ComposioClient({ apiKey: params.apiKey });
}

function resolveComposioApiKey(params: ResolveContext): string {
  const envValue = process.env.COMPOSIO_API_KEY?.trim();
  if (envValue) {
    return envValue;
  }
  const skill = resolveSkillEntry(params.config, params.skillKey);
  const fromEnv = skill?.env?.COMPOSIO_API_KEY?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  const fromApiKey = skill?.apiKey?.trim();
  if (fromApiKey) {
    return fromApiKey;
  }
  throw new Error(
    "Composio API key not found. Set COMPOSIO_API_KEY or configure skills.entries.<skill>.env.COMPOSIO_API_KEY.",
  );
}

function resolveConnectedAccountId(params: {
  config: OpenClawConfig | undefined;
  skillKey?: string;
  explicitAccount?: string;
  accountEnvName?: string;
}): string {
  const explicit = params.explicitAccount?.trim();
  if (explicit) {
    return explicit;
  }
  const envName = params.accountEnvName?.trim();
  if (!envName) {
    throw new Error("Connected account id is required. Pass --account or --account-env.");
  }
  const envValue = process.env[envName]?.trim();
  if (envValue) {
    return envValue;
  }
  const skill = resolveSkillEntry(params.config, params.skillKey);
  const skillValue = skill?.env?.[envName]?.trim();
  if (skillValue) {
    return skillValue;
  }
  throw new Error(
    `Connected account id not found for ${envName}. Set it in the environment or skills.entries.<skill>.env.${envName}.`,
  );
}

function resolveUserId(params: {
  config: OpenClawConfig | undefined;
  skillKey?: string;
  explicitUserId?: string;
  userEnvName?: string;
  accountEnvName?: string;
}): string | undefined {
  const explicit = params.explicitUserId?.trim();
  if (explicit) {
    return explicit;
  }
  const envNames = [
    params.userEnvName?.trim(),
    deriveUserEnvName(params.accountEnvName),
    "COMPOSIO_USER_ID",
  ].filter((value): value is string => Boolean(value));
  for (const envName of envNames) {
    const envValue = process.env[envName]?.trim();
    if (envValue) {
      return envValue;
    }
  }
  const skill = resolveSkillEntry(params.config, params.skillKey);
  for (const envName of envNames) {
    const skillValue = skill?.env?.[envName]?.trim();
    if (skillValue) {
      return skillValue;
    }
  }
  return undefined;
}

function deriveUserEnvName(accountEnvName: string | undefined): string | undefined {
  const value = accountEnvName?.trim();
  if (!value) {
    return undefined;
  }
  if (value.includes("CONNECTED_ACCOUNT_ID")) {
    return value.replace("CONNECTED_ACCOUNT_ID", "USER_ID");
  }
  return undefined;
}

function resolveSkillEntry(config: OpenClawConfig | undefined, skillKey?: string) {
  const key = skillKey?.trim();
  if (!key) {
    return undefined;
  }
  return config?.skills?.entries?.[key];
}

function normalizeLimit(value: string | number | undefined): number | undefined {
  if (value == null) {
    return undefined;
  }
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function parseJsonArgs(value: string | undefined): Record<string, unknown> {
  if (!value?.trim()) {
    return {};
  }
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Tool arguments must be a JSON object.");
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    throw new Error(`Failed to parse --args JSON: ${formatErrorMessage(error)}`, { cause: error });
  }
}

function printTools(tools: ComposioToolSummary[], asJson: boolean, runtime: RuntimeLike) {
  if (asJson) {
    runtime.log(JSON.stringify(tools, null, 2));
    return;
  }
  if (tools.length === 0) {
    runtime.log("No tools found.");
    return;
  }
  for (const tool of tools) {
    runtime.log(`${tool.slug}\t${tool.name}`);
  }
}

function printTool(tool: ComposioToolDefinition, asJson: boolean, runtime: RuntimeLike) {
  if (asJson) {
    runtime.log(JSON.stringify(tool, null, 2));
    return;
  }
  runtime.log(`${tool.slug}\t${tool.name}`);
  if (tool.description) {
    runtime.log(tool.description);
  }
  runtime.log(JSON.stringify(tool.inputParameters ?? {}, null, 2));
}

function printAccounts(
  accounts: ComposioConnectedAccount[],
  asJson: boolean,
  runtime: RuntimeLike,
) {
  if (asJson) {
    runtime.log(JSON.stringify(accounts, null, 2));
    return;
  }
  if (accounts.length === 0) {
    runtime.log("No connected accounts found.");
    return;
  }
  for (const account of accounts) {
    const toolkit = account.toolkit?.slug ?? "-";
    const status = account.status ?? "-";
    const userId = account.userId ?? "-";
    runtime.log(`${account.id}\t${toolkit}\t${status}\t${userId}`);
  }
}

function printExecutionResult(
  result: ComposioExecuteToolResult,
  asJson: boolean,
  runtime: RuntimeLike,
) {
  if (asJson) {
    runtime.log(JSON.stringify(result, null, 2));
    return;
  }
  runtime.log(`successful=${String(result.successful)}`);
  if (result.data !== undefined) {
    runtime.log(JSON.stringify(result.data, null, 2));
  } else if (result.error !== undefined) {
    runtime.log(JSON.stringify(result.error, null, 2));
  } else {
    runtime.log(JSON.stringify(result.raw, null, 2));
  }
}
