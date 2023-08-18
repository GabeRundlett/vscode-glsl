import axios from "axios";
import * as vscode from "vscode";
import * as fs from "fs";
import { mkdirp } from "mkdirp";

// Focusing on the first releasee
export const releases = "https://github.com/GabeRundlett/glsl-language-server/releases/download"

export const INSTALLATION_NAME = {
    linux: "linux",
    windows: "win32"
} as const

type ObjectValues<T> = T[keyof T];

type InstallationName = ObjectValues<typeof INSTALLATION_NAME>

export function getDefaultInstallationName(): InstallationName | null {
    const platform = process.platform

    switch (platform) {
        case "win32":
            return INSTALLATION_NAME["windows"]
        case 'linux':
            return INSTALLATION_NAME["linux"]
        default:
            return null
    }
}

async function installLanguageServerExecutable(context: vscode.ExtensionContext): Promise<string | null> {
    const platform = getDefaultInstallationName();
    if (!platform) {
        vscode.window.showInformationMessage("There is no language server binary available for your system, you can manually install it from [here](https://github.com/GabeRundlett/glsl-language-server#install)")
        return null
    }

    return vscode.window.withProgress({
        title: "Installing glsl-language-sever",
        location: vscode.ProgressLocation.Notification
    }, async progress => {
        progress.report({ message: "Downloading glsl-language-server executable..." });
        const exe = (await axios.get(`${releases}/0.1.0/glslls${platform.endsWith("windows") ? ".exe" : ""}`, {
            responseType: "arraybuffer"
        })).data;

        progress.report({ message: "Installing..." });
        const installDir = vscode.Uri.joinPath(context.globalStorageUri, "glslls_install");
        if (!fs.existsSync(installDir.fsPath)) mkdirp.sync(installDir.fsPath)

        const glsllsBinPath = vscode.Uri.joinPath(installDir, `glslls${platform.endsWith("windows" ? ".exe" : "")}`).fsPath
        const glsllsBinTempPath = glsllsBinPath + ".tmp";

        fs.writeFileSync(glsllsBinTempPath, exe, "binary")
        fs.chmodSync(glsllsBinTempPath, 0o755)
        if (fs.existsSync(glsllsBinPath)) fs.rmSync(glsllsBinPath)
        fs.renameSync(glsllsBinTempPath, glsllsBinPath)

        let config = vscode.workspace.getConfiguration("glsl.glslls");
        await config.update("path", glsllsBinPath, true);

        return glsllsBinPath;
    })
}



export async function activate(context: vscode.ExtensionContext) {
    vscode.commands.registerCommand("glsl.glslls.install", async () => {
        await installLanguageServerExecutable(context);
    });
}

export async function deactivate(): Promise<void> {

}