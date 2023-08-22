import * as vscode from "vscode";
import { LanguageClient, LanguageClientOptions, ServerOptions } from "vscode-languageclient/node";

const LSP_NAME = "GLSL LSP"

export default class Client {
    private client: LanguageClient | undefined;
    private readonly context: vscode.ExtensionContext;
    private readonly outputChannel = vscode.window.createOutputChannel(LSP_NAME)

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }


    async start() {
        const config = vscode.workspace.getConfiguration("glslls");

        const clientOptions: LanguageClientOptions = {
            documentSelector: [{ language: "glsl" }],
            diagnosticCollectionName: LSP_NAME,
            outputChannel: this.outputChannel,
            middleware: {}
        }

        const serverOptions = {
            command: "glslls"
        }

        this.client = new LanguageClient(
            'glslLanguageServer',
            LSP_NAME,
            serverOptions,
            clientOptions
        );

        try {
            await this.client.start();
        } catch (error: any) {
            this.outputChannel.appendLine(
                `Error restarting the server: ${error.message}`
            );
            return;
        }
    }

    async stop(): Promise<void> {
        if (this.client)
            await this.client.stop();
    }

}