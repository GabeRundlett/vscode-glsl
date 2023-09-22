import { exec, spawn } from "child_process";
import { ExtensionContext, window } from "vscode";

export async function checkGLSLLSExecutableIsAvaiable(binaryPath: string): Promise<boolean> {
    const glslLanguageServer = binaryPath

    return new Promise((resolve) => {
        const process = spawn(glslLanguageServer, ['--version'])

        process.on('close', (code) => {
            resolve(code === 0); // Executable
        });

        process.on('error', () => {
            resolve(false); // If an error occurs, the executable is not available
        });
    });
}