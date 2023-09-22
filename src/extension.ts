import * as vscode from "vscode";
import { GLSL } from "./glslls";
import Client from "./client";

let client: Client | undefined;

export async function activate(context: vscode.ExtensionContext) {
  const glsl = new GLSL(context);
  glsl
    .activateGLSL()

    .then(async () => {
      const configuration = vscode.workspace.getConfiguration("glslls");
      const glsllsPath = configuration.get<string>("path", "");

      if (glsllsPath) {
        client = new Client(context);
        client.start(glsllsPath);
      }
    });
}

export async function deactivate(): Promise<void> {
  if (client) {
    await client.stop();
  }
}
