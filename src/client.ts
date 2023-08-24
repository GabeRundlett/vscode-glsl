import * as vscode from "vscode";
import { LanguageClient, LanguageClientOptions, ServerOptions } from "vscode-languageclient/node";

const LSP_NAME = "GLSL Language Server"

export default class Client {
    private client: LanguageClient | undefined;
    private readonly context: vscode.ExtensionContext;
    private readonly outputChannel = vscode.window.createOutputChannel(LSP_NAME)
    
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    // async provideDefinition(
    //     document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken
    // ): Promise<vscode.Definition | vscode.DefinitionLink[] | null> {
    //     vscode.window.showInformationMessage('provide definition...')
    //     return Promise.resolve(null)
    // }

    async start() {
        const config = vscode.workspace.getConfiguration("glslls");

        // const config = vscode.workspace.getConfiguration("glslls");

        // vscode.commands.registerCommand("extension.provideDefinition",
        //     this.test();
        // );

        const clientOptions: LanguageClientOptions = {
            documentSelector: [{ scheme: "file", language: "glsl" }],
            diagnosticCollectionName: LSP_NAME,
            outputChannel: this.outputChannel,
            middleware: {}
        }


        const serverOptions: ServerOptions = {
            command: "zls",
            args: ["-p 5352"],
        }

        this.client = new LanguageClient(
            'GLSL Language Server',
            LSP_NAME,
            serverOptions,
            clientOptions
        );



        try {
            vscode.window.showInformationMessage("connecting...")
            await this.client.start();
            vscode.window.showInformationMessage("connected!")
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