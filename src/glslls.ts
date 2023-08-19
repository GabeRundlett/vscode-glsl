import axios from "axios";
import * as vscode from "vscode";
import * as fs from "fs";
import { mkdirp } from "mkdirp";
import { WorkspaceFolder } from "vscode-languageclient";
import which = require("which");
import { checkGLSLLSExecutableAvailability } from "./utils";

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
        title: "Installing glsl-language-server",
        location: vscode.ProgressLocation.Notification
    }, async progress => {
        progress.report({ message: "Downloading glsl-language-server executable..." });
        // Focusing on the first release for now
        const exe = (await axios.get(`${releases}/1.1.0/glslls${platform.endsWith("windows") ? ".exe" : ""}`, {
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
        vscode.window.showInformationMessage("GLSL Language Server has been successfully installed!")
        return glsllsBinPath;
    })
}

export async function promptForInstallGLSLLS(context: vscode.ExtensionContext) {
    const response = await vscode.window.showWarningMessage(
        'GLSL Language Server is not found. Please install it to use this extension', "Install"
    )

    if (response === "Install")
        return await installLanguageServerExecutable(context);
}

export async function getGLSLLSPath(context: vscode.ExtensionContext): Promise<string | null> {
    const configuration = vscode.workspace.getConfiguration("glsl.glslls")
    let glsllsPath = configuration.get<string | null>("path", null);
    let error: string | null = null;

    if (!glsllsPath) {
        glsllsPath = which.sync("glslls", { nothrow: true });
    }

    const glsllsPathExists = glsllsPath !== null && fs.existsSync(glsllsPath)

    if (glsllsPath && glsllsPathExists) {
        try {
            fs.accessSync(glsllsPath, fs.constants.R_OK | fs.constants.X_OK);
        } catch {
            error = `\`glslls.path\` ${glsllsPath} is not an executable`;
        }
        const stat = fs.statSync(glsllsPath);
        if (!stat.isFile()) {
            error = `\`glslls.path\` ${glsllsPath} is not a file`;
        }
    }

    if (error === null) {
        if (!glsllsPath) {
            return null
        } else if (!glsllsPathExists) {
            error = `Couldn't find GLSL Language Server executable at "${glsllsPath.replace(/"/gm, '\\"')}"`
            return null
        }
    }

    if (error) {
        await vscode.window.showErrorMessage(error)
        return null
    }

    return glsllsPath
}

export async function startClient(context: vscode.ExtensionContext) {
    const configuration = vscode.workspace.getConfiguration("glsl.glslls")
    const debugLog = configuration.get("debugLog", false)
    // promptForInstallGLSLLS(context)
    const glsllsPath = await getGLSLLSPath(context)

    const test = await checkGLSLLSExecutableAvailability(context)
    vscode.window.showInformationMessage(`message: ${test}`)

    if (!glsllsPath) {
        promptForInstallGLSLLS(context)
        return null
    }

}

export async function activate(context: vscode.ExtensionContext) {
    vscode.commands.registerCommand("glsl.glslls.install", async () => {
        await installLanguageServerExecutable(context);
    });
    await startClient(context)

}

export async function deactivate(): Promise<void> { }