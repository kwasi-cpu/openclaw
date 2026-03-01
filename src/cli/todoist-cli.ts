import type { Command } from "commander";
import {
  todoistCloseTaskCommand,
  todoistCreateTaskCommand,
  todoistListProjectsCommand,
  todoistListTasksCommand,
} from "../commands/todoist.js";
import { defaultRuntime } from "../runtime.js";
import { runCommandWithRuntime } from "./cli-utils.js";

export function registerTodoistCli(program: Command) {
  const todoist = program.command("todoist").description("Direct Todoist helpers");

  const projects = todoist.command("projects").description("List Todoist projects");
  projects
    .command("list")
    .option("--skill <key>", "Resolve auth from a configured skill entry")
    .option("--json", "Output JSON", false)
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await todoistListProjectsCommand(opts, defaultRuntime);
      });
    });

  const tasks = todoist.command("tasks").description("List, create, and close Todoist tasks");

  tasks
    .command("list")
    .option("--filter <query>", "Todoist filter query")
    .option("--lang <code>", "Language code for date parsing")
    .option("--skill <key>", "Resolve auth from a configured skill entry")
    .option("--json", "Output JSON", false)
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await todoistListTasksCommand(opts, defaultRuntime);
      });
    });

  tasks
    .command("create")
    .requiredOption("--content <text>", "Task content")
    .option("--description <text>", "Task description")
    .option("--project-id <id>", "Todoist project id")
    .option("--section-id <id>", "Todoist section id")
    .option("--parent-id <id>", "Parent task id")
    .option("--labels <csv>", "Comma-separated labels")
    .option("--priority <n>", "Priority 1-4")
    .option("--due-string <text>", "Natural language due date")
    .option("--due-date <date>", "Explicit due date (YYYY-MM-DD)")
    .option("--skill <key>", "Resolve auth from a configured skill entry")
    .option("--json", "Output JSON", false)
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await todoistCreateTaskCommand(opts, defaultRuntime);
      });
    });

  tasks
    .command("close <taskId>")
    .option("--skill <key>", "Resolve auth from a configured skill entry")
    .option("--json", "Output JSON", false)
    .action(async (taskId, opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await todoistCloseTaskCommand(taskId, opts, defaultRuntime);
      });
    });
}
