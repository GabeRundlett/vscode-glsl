import axios, { AxiosResponse } from "axios";
import * as vscode from "vscode";
import * as fs from "fs";
import { checkGLSLLSExecutableIsAvaiable } from "./utils";

export let outputChannel: vscode.OutputChannel;
const releases_url = "https://api.github.com/repos/GabeRundlett/glsl-language-server/releases"
const download_url =
  "https://github.com/GabeRundlett/glsl-language-server/releases/download";

type availablePlatforms = "windows" | "linux" | null

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

  private platformName(): availablePlatforms {
    const platform = process.platform;

    switch (platform) {
      case "win32":
        return "windows";
      case "linux":
        return "linux";
      default:
        return null
    }
  }

  private GLSLLSBinaryName() {
    return `glslls${this.platformName() === "windows" ? "exe" : ""}`
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
  ): Promise<string | undefined> {
    const platform = this.platformName();
    if (!platform) {
      vscode.window.showInformationMessage(
        "There is no language server binary available for your system, you can manually install it from [here](https://github.com/GabeRundlett/glsl-language-server#install)"
      );
      return;
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

        const download_exe_url = `${download_url}/${tag}/${this.GLSLLSBinaryName()}`
        const exe = (
          await axios.get(
            download_exe_url,
            {
              responseType: "arraybuffer",
            }
          )
        ).data;

        progress.report({ message: "Installing..." });
        const installDir = vscode.Uri.joinPath(this.context.globalStorageUri, "glslls_install")
        if (!fs.existsSync(installDir.fsPath))
          fs.mkdirSync(installDir.fsPath, { recursive: true })

        const glsllsBinPath = vscode.Uri.joinPath(installDir, this.GLSLLSBinaryName()).fsPath

        fs.writeFileSync(glsllsBinPath, exe, "binary")
        fs.chmodSync(glsllsBinPath, 0o755);


        const config = vscode.workspace.getConfiguration("glslls");
        config.update("path", glsllsBinPath, true);

        vscode.window.showInformationMessage(
          "GLSL Language Server has been successfully installed!"
        );

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


  public async isGLSLLSInstalled(
  ): Promise<boolean> {


    const configuration = vscode.workspace.getConfiguration("glslls");
    const glsllsPath = configuration.get<string>("path");
    // const glsllsExecutableExists = await checkGLSLLSExecutableIsAvaiable(glsllsPath ? glsllsPath : '');

    // vscode.window.showInformationMessage('ok')

    if (glsllsPath)
      return true


    return false;
  }

  async activateGLSL() {

    const glsllsExists = await this.isGLSLLSInstalled();
    vscode.window.showInformationMessage(`aaaa${glsllsExists}`)

    if (!glsllsExists) {
      await this.promptForInstallGLSLLS(this.context);
      // return null;
    }

    vscode.commands.registerCommand("glslls.install", async () => {
      await this.selectVersionAndInstall();
    });
  }
}
