import type { Command } from "commander";
import {
  composioExecuteToolCommand,
  composioGetToolCommand,
  composioListAccountsCommand,
  composioListToolsCommand,
} from "../commands/composio.js";
import { defaultRuntime } from "../runtime.js";
import { runCommandWithRuntime } from "./cli-utils.js";

export function registerComposioCli(program: Command) {
  const composio = program.command("composio").description("Composio tool discovery and execution");

  const tools = composio.command("tools").description("List, inspect, and execute Composio tools");

  tools
    .command("list")
    .description("List Composio tools")
    .option("--toolkit <slug>", "Filter by toolkit slug")
    .option("--limit <n>", "Limit results")
    .option("--skill <key>", "Resolve auth from a configured skill entry")
    .option("--json", "Output JSON", false)
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await composioListToolsCommand(opts, defaultRuntime);
      });
    });

  tools
    .command("get <toolSlug>")
    .description("Get one Composio tool definition")
    .option("--skill <key>", "Resolve auth from a configured skill entry")
    .option("--json", "Output JSON", false)
    .action(async (toolSlug, opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await composioGetToolCommand(toolSlug, opts, defaultRuntime);
      });
    });

  tools
    .command("exec <toolSlug>")
    .description("Execute one Composio tool")
    .option("--account <id>", "Explicit connected account id")
    .option("--account-env <name>", "Environment variable name containing the connected account id")
    .option("--args <json>", "Tool arguments as a JSON object string")
    .option("--skill <key>", "Resolve auth from a configured skill entry")
    .option("--json", "Output JSON", false)
    .action(async (toolSlug, opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await composioExecuteToolCommand(toolSlug, opts, defaultRuntime);
      });
    });

  const accounts = composio.command("accounts").description("List Composio connected accounts");

  accounts
    .command("list")
    .description("List connected accounts")
    .option("--toolkit <slug>", "Filter by toolkit slug")
    .option("--skill <key>", "Resolve auth from a configured skill entry")
    .option("--json", "Output JSON", false)
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await composioListAccountsCommand(opts, defaultRuntime);
      });
    });
}
