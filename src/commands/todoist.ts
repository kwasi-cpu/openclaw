import type { OpenClawConfig } from "../config/config.js";
import { loadConfig } from "../config/config.js";
import { TodoistClient } from "../infra/todoist/client.js";
import type { TodoistProject, TodoistTask } from "../infra/todoist/types.js";

type RuntimeLike = {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  exit: (code: number) => void;
};

type SharedOptions = {
  skill?: string;
  json?: boolean;
};

type ListTasksOptions = SharedOptions & {
  filter?: string;
  lang?: string;
};

type CreateTaskOptions = SharedOptions & {
  content: string;
  description?: string;
  projectId?: string;
  sectionId?: string;
  parentId?: string;
  labels?: string;
  priority?: string | number;
  dueString?: string;
  dueDate?: string;
};

type ClientParams = {
  config: OpenClawConfig | undefined;
  skillKey?: string;
  apiToken: string;
};

type TodoistClientLike = Pick<TodoistClient, "listProjects" | "listTasks" | "createTask" | "closeTask">;

export async function todoistListProjectsCommand(
  opts: SharedOptions,
  runtime: RuntimeLike,
  deps: {
    createClient?: (params: ClientParams) => TodoistClientLike;
    loadConfig?: typeof loadConfig;
  } = {},
): Promise<void> {
  const config = await (deps.loadConfig ?? loadConfig)();
  const skillKey = opts.skill;
  const client = createClient(
    { config, skillKey, apiToken: resolveTodoistApiToken({ config, skillKey }) },
    deps,
  );
  const projects = await client.listProjects();
  printProjects(projects, Boolean(opts.json), runtime);
}

export async function todoistListTasksCommand(
  opts: ListTasksOptions,
  runtime: RuntimeLike,
  deps: {
    createClient?: (params: ClientParams) => TodoistClientLike;
    loadConfig?: typeof loadConfig;
  } = {},
): Promise<void> {
  const config = await (deps.loadConfig ?? loadConfig)();
  const skillKey = opts.skill;
  const client = createClient(
    { config, skillKey, apiToken: resolveTodoistApiToken({ config, skillKey }) },
    deps,
  );
  const tasks = await client.listTasks({ filter: opts.filter, lang: opts.lang });
  printTasks(tasks, Boolean(opts.json), runtime);
}

export async function todoistCreateTaskCommand(
  opts: CreateTaskOptions,
  runtime: RuntimeLike,
  deps: {
    createClient?: (params: ClientParams) => TodoistClientLike;
    loadConfig?: typeof loadConfig;
  } = {},
): Promise<void> {
  const config = await (deps.loadConfig ?? loadConfig)();
  const skillKey = opts.skill;
  const client = createClient(
    { config, skillKey, apiToken: resolveTodoistApiToken({ config, skillKey }) },
    deps,
  );
  const result = await client.createTask({
    content: opts.content,
    description: opts.description,
    projectId: opts.projectId,
    sectionId: opts.sectionId,
    parentId: opts.parentId,
    labels: parseLabels(opts.labels),
    priority: normalizePriority(opts.priority),
    dueString: opts.dueString,
    dueDate: opts.dueDate,
  });
  if (opts.json) {
    runtime.log(JSON.stringify(result, null, 2));
    return;
  }
  runtime.log(`created\t${result.task.id}\t${result.task.content}\t${result.task.url ?? "-"}`);
}

export async function todoistCloseTaskCommand(
  taskId: string,
  opts: SharedOptions,
  runtime: RuntimeLike,
  deps: {
    createClient?: (params: ClientParams) => TodoistClientLike;
    loadConfig?: typeof loadConfig;
  } = {},
): Promise<void> {
  const config = await (deps.loadConfig ?? loadConfig)();
  const skillKey = opts.skill;
  const client = createClient(
    { config, skillKey, apiToken: resolveTodoistApiToken({ config, skillKey }) },
    deps,
  );
  const result = await client.closeTask(taskId);
  if (opts.json) {
    runtime.log(JSON.stringify(result, null, 2));
    return;
  }
  runtime.log(`closed\t${taskId}`);
}

function createClient(
  params: ClientParams,
  deps: { createClient?: (params: ClientParams) => TodoistClientLike },
): TodoistClientLike {
  return deps.createClient?.(params) ?? new TodoistClient({ apiToken: params.apiToken });
}

function resolveTodoistApiToken(params: {
  config: OpenClawConfig | undefined;
  skillKey?: string;
}): string {
  const envValue = process.env.TODOIST_API_TOKEN?.trim();
  if (envValue) {
    return envValue;
  }
  const skill = resolveSkillEntry(params.config, params.skillKey);
  const fromEnv = skill?.env?.TODOIST_API_TOKEN?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  const fromApiKey = skill?.apiKey?.trim();
  if (fromApiKey) {
    return fromApiKey;
  }
  throw new Error(
    "Todoist API token not found. Set TODOIST_API_TOKEN or configure skills.entries.<skill>.env.TODOIST_API_TOKEN.",
  );
}

function resolveSkillEntry(config: OpenClawConfig | undefined, skillKey?: string) {
  const key = skillKey?.trim();
  if (!key) {
    return undefined;
  }
  return config?.skills?.entries?.[key];
}

function parseLabels(value: string | undefined): string[] | undefined {
  if (!value?.trim()) {
    return undefined;
  }
  const labels = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return labels.length > 0 ? labels : undefined;
}

function normalizePriority(value: string | number | undefined): number | undefined {
  if (value == null) {
    return undefined;
  }
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 4 ? parsed : undefined;
}

function printProjects(projects: TodoistProject[], asJson: boolean, runtime: RuntimeLike) {
  if (asJson) {
    runtime.log(JSON.stringify(projects, null, 2));
    return;
  }
  if (projects.length === 0) {
    runtime.log("No projects found.");
    return;
  }
  for (const project of projects) {
    runtime.log(`${project.id}\t${project.name}`);
  }
}

function printTasks(tasks: TodoistTask[], asJson: boolean, runtime: RuntimeLike) {
  if (asJson) {
    runtime.log(JSON.stringify(tasks, null, 2));
    return;
  }
  if (tasks.length === 0) {
    runtime.log("No tasks found.");
    return;
  }
  for (const task of tasks) {
    runtime.log(`${task.id}\t${task.content}\t${task.projectId ?? "-"}\t${task.url ?? "-"}`);
  }
}
