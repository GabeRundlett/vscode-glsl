import * as vscode from 'vscode';
import { activate as activateGLSLLS, deactivate as deactivateGLSLLS } from './glslls';

export function activate(context: vscode.ExtensionContext) {
    activateGLSLLS(context)
}

export async function deactivate(): Promise<void> { }