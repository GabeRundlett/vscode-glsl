import * as vscode from "vscode";
import { GLSL } from "./glslls";
import Client from "./client";

let client: Client | undefined;

export async function activate(context: vscode.ExtensionContext) {
  const glsl = new GLSL(context);
  await glsl.activateGLSL().then(() => {
    client = new Client(context);
    client.start();
  });
}

export async function deactivate(): Promise<void> {
  if (client) {
    await client.stop();
  }
}
