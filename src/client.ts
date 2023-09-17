import * as vscode from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";

const LSP_NAME = "GLSL Language Server";

export default class Client {
  private client: LanguageClient | undefined;
  private readonly context: vscode.ExtensionContext;
  private readonly outputChannel = vscode.window.createOutputChannel(LSP_NAME);

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  async provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Definition | vscode.DefinitionLink[] | null> {
    vscode.window.showInformationMessage("testando");
    return Promise.resolve(null);
  }

  async start() {
    const clientOptions: LanguageClientOptions = {
      documentSelector: [{ scheme: "file", language: "glsl" }],
      diagnosticCollectionName: LSP_NAME,
      outputChannel: this.outputChannel,
    };

    const serverOptions: ServerOptions = {
      command: "glslls",
      // args: [],
      transport: TransportKind.stdio,
    };

    this.client = new LanguageClient(
      "GLSL Language Server",
      LSP_NAME,
      serverOptions,
      clientOptions
    );

    try {
      await this.client.start();
      console.log(this.client.initializeResult?.capabilities);
    } catch (error: any) {
      this.outputChannel.appendLine(
        `Error restarting the server: ${error.message}`
      );
      return;
    }
  }

  async stop(): Promise<void> {
    if (this.client) await this.client.stop();
  }
}
