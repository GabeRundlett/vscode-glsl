import * as vscode from 'vscode';
import { GLSL } from './glslls';

export async function activate(context: vscode.ExtensionContext) {
    const glsl = new GLSL(context)
    await glsl.activateGLSL();
}

export async function deactivate(): Promise<void> { }