import { execFile } from "node:child_process";

let classifierModel: string | undefined = "claude-sonnet-4-5-20250929";

export function setClassifierModel(model: string | undefined): void {
  classifierModel = model;
}

export function getClassifierModel(): string | undefined {
  return classifierModel;
}

/**
 * Spawn `claude -p` with the given system prompt and pipe responseText via stdin.
 * Returns the raw stdout string. Uses the user's Claude subscription (flat fee).
 */
export function spawnClaude(
  responseText: string,
  systemPrompt: string,
  jsonSchema: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = [
      "-p", systemPrompt,
      "--output-format", "json",
      "--json-schema", jsonSchema,
      "--no-session-persistence",
    ];
    if (classifierModel) {
      args.push("--model", classifierModel);
    }
    const child = execFile(
      "claude",
      args,
      { maxBuffer: 10 * 1024 * 1024, timeout: 60_000 },
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error(`claude CLI failed: ${err.message}${stderr ? `\n${stderr}` : ""}`));
          return;
        }
        resolve(stdout);
      },
    );

    // Pipe response text via stdin to avoid shell escaping issues
    if (child.stdin) {
      child.stdin.write(responseText);
      child.stdin.end();
    }
  });
}
