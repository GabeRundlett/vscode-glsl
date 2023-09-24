import * as vscode from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";

const LSP_NAME = "GRSLS Language Server";

export default class Client {
  private client: LanguageClient | undefined;
  private readonly context: vscode.ExtensionContext;
  private readonly outputChannel = vscode.window.createOutputChannel(LSP_NAME);

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  async start(grslsPath: string) {
    const clientOptions: LanguageClientOptions = {
      documentSelector: [{ scheme: "file", language: "glsl" }],
      diagnosticCollectionName: LSP_NAME,
      outputChannel: this.outputChannel,
    };

    const serverOptions: ServerOptions = {
      command: grslsPath,
      transport: TransportKind.stdio,
    };

    this.client = new LanguageClient(
      "GR Language Server",
      LSP_NAME,
      serverOptions,
      clientOptions,
    );

    try {
      await this.client.start();
      vscode.commands.registerCommand("grsls.restart", async () => {
        if (this.client) {
          await this.client.restart();
        }
      });
    } catch (error: any) {
      this.outputChannel.appendLine(
        `Error restarting the server: ${error.message}`,
      );
      return;
    }
  }

  async stop(): Promise<void> {
    if (this.client) await this.client.stop();
  }
}
