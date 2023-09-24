import * as vscode from "vscode";
import Client from "./client";
import { GRSLS } from "./grsls";

let client: Client | undefined;

export async function activate(context: vscode.ExtensionContext) {
  const grsls = new GRSLS(context);
  await grsls.activateGRSLSSetup().then(() => {});

  const configuration = vscode.workspace.getConfiguration("grsls");

  const GRSLSPath = configuration.get<string>("path");

  if (GRSLSPath) {
    client = new Client(context);
    return await client.start(GRSLSPath);
  }

  await vscode.window.showErrorMessage(
    "A path to GRSLS has not been configured. 😞",
  );
}

export async function deactivate(): Promise<void> {
  if (client) {
    await client.stop();
  }
}
