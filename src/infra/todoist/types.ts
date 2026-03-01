export type TodoistProject = {
  id: string;
  name: string;
  isInboxProject?: boolean | null;
  raw: unknown;
};

export type TodoistTask = {
  id: string;
  content: string;
  description?: string | null;
  projectId?: string | null;
  url?: string | null;
  isCompleted?: boolean | null;
  raw: unknown;
};

export type TodoistCreateTaskInput = {
  content: string;
  description?: string;
  projectId?: string;
  sectionId?: string;
  parentId?: string;
  labels?: string[];
  priority?: number;
  dueString?: string;
  dueDate?: string;
};

export type TodoistCreateTaskResult = {
  task: TodoistTask;
  raw: unknown;
};

export class TodoistHttpError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = "TodoistHttpError";
    this.status = status;
    this.body = body;
  }
}
