import * as vscode from "vscode";
import {
  Command,
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  StreamInfo,
  TransportKind,
  createServerSocketTransport,
} from "vscode-languageclient/node";
import * as net from "net";
import * as cp from "child_process";

const LSP_NAME = "GRSLS Language Server";

export default class Client {
  private client: LanguageClient | undefined;
  private readonly context: vscode.ExtensionContext;
  private readonly outputChannel = vscode.window.createOutputChannel(LSP_NAME);

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  async start(grslsPath: string) {
    const connectionInfo = {
      port: 7125,
      host: "127.0.0.0",
    };

    const clientOptions: LanguageClientOptions = {
      documentSelector: [{ scheme: "file", language: "glsl" }],
      diagnosticCollectionName: LSP_NAME,
      outputChannel: this.outputChannel,
    };

    function startServerWithStreamInfo(): Promise<{
      process: cp.ChildProcess;
      streamInfo: StreamInfo;
    }> {
      return new Promise<{ process: cp.ChildProcess; streamInfo: StreamInfo }>(
        (resolve, reject) => {
          const serverProcess = cp.spawn(grslsPath, []);

          const socket = net.connect(connectionInfo);

          const streamInfo: StreamInfo = {
            writer: socket,
            reader: socket,
          };

          resolve({ process: serverProcess, streamInfo });

          serverProcess.on("error", (err) => {
            reject(err);
          });
        },
      );
    }

    const serverOptions: ServerOptions = async () => {
      try {
        const { process, streamInfo } = await startServerWithStreamInfo();
        return {
          reader: streamInfo.reader,
          writer: streamInfo.writer,
        };
      } catch (error) {
        console.error("Error starting server:", error);
        throw error;
      }
    };

    this.client = new LanguageClient(
      "GR Language Server",
      LSP_NAME,
      serverOptions,
      clientOptions,
    );

    try {
      await this.client.start();
      console.log(this.client.initializeResult?.capabilities);
      createServerSocketTransport;
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
