import * as vscode from "vscode";
import { LanguageClient, LanguageClientOptions, ServerOptions } from "vscode-languageclient/node";
import { GLSL } from "./glslls";

const LSP_NAME = "GLSL LSP"

export default class Client extends LanguageClient {
    private readonly context: vscode.ExtensionContext;
    private readonly outputChannel = vscode.window.createOutputChannel(LSP_NAME)
    constructor(
        context: vscode.ExtensionContext,
        glsl: GLSL,
        name: string,
        serverOptions: ServerOptions,
        clientOptions: LanguageClientOptions
    ) {
        super(name, serverOptions, clientOptions)
        this.context = context;
    }


    async start() {
        const config = vscode.workspace.getConfiguration("glsl.glslls");

        const clientOptions: LanguageClientOptions = {
            documentSelector: [{ scheme: "file", language: "glsl" }],
            diagnosticCollectionName: LSP_NAME,
            outputChannel: this.outputChannel,
            middleware: {

            }
        }
    }
}