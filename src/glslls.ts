import axios, { AxiosResponse } from "axios";
import * as vscode from "vscode";
import * as fs from "fs";
import { mkdirp } from "mkdirp";
import { checkGLSLLSExecutableIsAvaiable } from "./utils";

export let outputChannel: vscode.OutputChannel;
const releases_url = "https://api.github.com/repos/GabeRundlett/glsl-language-server/releases"
const download_url =
  "https://github.com/GabeRundlett/glsl-language-server/releases/download";

export enum INSTALLATION_NAME {
  linux = "linux",
  windows = "win32",
}

interface GLSLLSRelease {
  tag_name: string
  pre_release: boolean
  assets: {
    browser_download_url: string
  }
}

export class GLSL {
  private readonly context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  private getDefaultInstallationName(): INSTALLATION_NAME | null {
    const platform = process.platform;

    switch (platform) {
      case "win32":
        return INSTALLATION_NAME["windows"];
      case "linux":
        return INSTALLATION_NAME["linux"];
      default:
        return null;
    }
  }

  async getVersions(): Promise<GLSLLSRelease[]> {
    try {
      const response: AxiosResponse<GLSLLSRelease[]> = await axios.get<GLSLLSRelease[]>(releases_url)
      return response.data
    } catch (error) {
      vscode.window.showErrorMessage("The download repository was not found")
      return []
    }
  }

  async selectVersionAndInstall() {
    const avaiableVersions = await this.getVersions()
    const items: vscode.QuickPickItem[] = []

    for (const option of avaiableVersions) {
      items.push({ label: option.tag_name, description: `${option.pre_release ?? "Pre-release"}` })
    }
    if (avaiableVersions.length === 0)
      return

    items[0].detail = "Latest"
    const selection = await vscode.window.showQuickPick(items, {
      title: "Avaiable GLSL Language Server versions",
      canPickMany: false,
      placeHolder: 'Select a language server version'
    });

    if (selection)
      await this.installLanguageServerExecutable(selection.label)

  }

  private async installLanguageServerExecutable(tag: string
  ): Promise<string | null> {
    const platform = this.getDefaultInstallationName();
    if (!platform) {
      vscode.window.showInformationMessage(
        "There is no language server binary available for your system, you can manually install it from [here](https://github.com/GabeRundlett/glsl-language-server#install)"
      );
      return null;
    }

    return vscode.window.withProgress(
      {
        title: "Installing glsl-language-server",
        location: vscode.ProgressLocation.Notification,
      },
      async (progress) => {
        progress.report({
          message: "Downloading glsl-language-server executable...",
        });
        // Focusing on the first release for now
        const download_exe_url = `${download_url}/${tag}/glslls${platform.endsWith("windows") ? ".exe" : ""}`
        const exe = (
          await axios.get(
            download_exe_url,
            {
              responseType: "arraybuffer",
            }
          )
        ).data;

        progress.report({ message: "Installing..." });
        // const installDir = vscode.Uri.joinPath(
        //   this.context.globalStorageUri,
        //   "glslls_install"
        // );
        // if (!fs.existsSync(installDir.fsPath)) mkdirp.sync(installDir.fsPath);

        // const glsllsBinPath = vscode.Uri.joinPath(
        //   installDir,
        //   `glslls`
        // ).fsPath;
        // const glsllsBinTempPath = glsllsBinPath + ".tmp";

        // fs.writeFileSync(glsllsBinTempPath, exe, "binary");
        // fs.chmodSync(glsllsBinTempPath, 0o755);
        // if (fs.existsSync(glsllsBinPath)) fs.rmSync(glsllsBinPath);
        // fs.renameSync(glsllsBinTempPath, glsllsBinPath);

        // vscode.window.showInformationMessage(
        //   "GLSL Language Server has been successfully installed!"
        // );
        return glsllsBinPath;
      }
    );
  }

  private async promptForInstallGLSLLS(context: vscode.ExtensionContext) {
    const response = await vscode.window.showWarningMessage(
      "The GLSL language server was not found. Install it or specify the executable path",
      "Install",
      "Specify path"
    );

    if (response === "Install")
      return await this.selectVersionAndInstall();
    else if (response === "Specify path") {
      const uris = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        title: "Select GLSLLS executable",
      });
    }
  }

  private async isGLSLLSInstalled(
    context: vscode.ExtensionContext
  ): Promise<boolean> {
    const glsllsExecutableExists = await checkGLSLLSExecutableIsAvaiable(
      context
    );
    const configuration = vscode.workspace.getConfiguration("glslls");
    const glsllsPath = configuration.get<string | null>("path", null);

    if (glsllsPath != null && !glsllsExecutableExists) {
      try {
        fs.accessSync(glsllsPath, fs.constants.R_OK | fs.constants.X_OK);
        return true;
      } catch {
        return false;
      }
    }

    return glsllsExecutableExists;
  }

  async activateGLSL() {
    const glsllsExists = await this.isGLSLLSInstalled(this.context);

    if (!glsllsExists) {
      await this.promptForInstallGLSLLS(this.context);
      return null;
    }

    vscode.commands.registerCommand("glslls.install", async () => {
      // await this.installLanguageServerExecutable(this.context);
    });
  }
}
