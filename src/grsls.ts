import axios, { AxiosResponse } from "axios";
import * as vscode from "vscode";
import * as fs from "fs";
import { findServerLanguagePath } from "./utils";

export let outputChannel: vscode.OutputChannel;
const releases_url = "https://api.github.com/repos/GabeRundlett/grsls/releases";

type availablePlatforms = "windows" | "linux" | null;

interface GRSLRelease {
  tag_name: string;
  pre_release: boolean;
  assets: [{ browser_download_url: string }];
}

interface VersionItem {
  label: string;
  description: string;
  browser_download_url: string;
  detail: string | undefined;
}

export class GRSLS {
  private readonly context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  private get platformName(): availablePlatforms {
    const platform = process.platform;

    switch (platform) {
      case "win32":
        return "windows";
      case "linux":
        return "linux";
      default:
        return null;
    }
  }

  private get ExecutableExtension(): string {
    return this.platformName === "windows" ? ".exe" : "";
  }

  private async getGRSLSPath(): Promise<string | null> {
    const config = vscode.workspace.getConfiguration("grsls");
    return config.get<string | null>("path", null);
  }

  private async getVersions(): Promise<GRSLRelease[]> {
    try {
      const response: AxiosResponse<GRSLRelease[]> =
        await axios.get<GRSLRelease[]>(releases_url);
      return response.data;
    } catch (error) {
      vscode.window.showErrorMessage("The download repository was not found");
      return [];
    }
  }

  private async installLanguageServerExecutable(
    download_url: string,
  ): Promise<string | undefined> {
    const platform = this.platformName;
    if (!platform) {
      vscode.window.showInformationMessage(
        "There is no language server executable available for your system, you can manually install it from [here](https://github.com/GabeRundlett/grsls#install)",
      );
      return;
    }

    return vscode.window.withProgress(
      {
        title: "Installing GRSLS",
        location: vscode.ProgressLocation.Notification,
      },
      async (progress) => {
        progress.report({
          message: "Downloading GRSLS executable...",
        });

        const download_exe_url = download_url;
        const exe = (
          await axios.get(download_exe_url, {
            responseType: "arraybuffer",
          })
        ).data;

        progress.report({ message: "Installing..." });
        const installDir = vscode.Uri.joinPath(
          this.context.globalStorageUri,
          "grsls_install",
        );
        if (!fs.existsSync(installDir.fsPath))
          fs.mkdirSync(installDir.fsPath, { recursive: true });

        const GRSLSBinPath = vscode.Uri.joinPath(
          installDir,
          `grsls${this.ExecutableExtension}`,
        ).fsPath;

        fs.writeFileSync(GRSLSBinPath, exe, "binary");
        fs.chmodSync(GRSLSBinPath, 0o755);

        const config = vscode.workspace.getConfiguration("grsls");
        await config.update(
          "path",
          GRSLSBinPath,
          vscode.ConfigurationTarget.Global,
        );

        vscode.window.showInformationMessage(
          "GRSLS has been successfully installed!",
        );

        return GRSLSBinPath;
      },
    );
  }

  private async selectVersionAndInstall() {
    const availableVersions = await this.getVersions();
    const items: VersionItem[] = availableVersions.map((option) => ({
      label: option.tag_name,
      description: option.pre_release ? "Pre-release" : "",
      browser_download_url: option.assets[0].browser_download_url,
      detail: undefined,
    }));

    if (availableVersions.length === 0) return;

    items[0].detail = "Latest";

    const selection = await vscode.window.showQuickPick(items, {
      title: "Available GRSLS versions",
      canPickMany: false,
      placeHolder: "Select a GRSLS version",
    });

    vscode.window.showInformationMessage(
      `teste:::${selection?.browser_download_url}`,
    );
    vscode.window.showInformationMessage(
      `oia:::${this.ExecutableExtension} 2: ${selection?.browser_download_url}`,
    );

    if (selection) {
      const selectedItem = items.find((item) => item.label === selection.label);

      if (selectedItem) {
        await this.installLanguageServerExecutable(
          selectedItem.browser_download_url + this.ExecutableExtension,
        );
      }
    }
  }

  private async promptForInstallGRSLS(warnText: string) {
    const response = await vscode.window.showWarningMessage(
      warnText,
      "Install",
      "Select GRSLS Executable",
      "Find GRSLS in PATH",
    );

    if (response === "Install") {
      await this.selectVersionAndInstall();
    } else if (response === "Select GRSLS Executable") {
      const uris = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        title: "Select GRSLS executable",
      });
      if (uris) {
        const config = vscode.workspace.getConfiguration("grsls");
        await config.update(
          "path",
          uris[0].fsPath,
          vscode.ConfigurationTarget.Global,
        );
      }
    } else if (response === "Find GRSLS in PATH") {
      const languageNames = ["grsls", "glslls"];
      const foundPaths = await Promise.all(
        languageNames.map((name) => findServerLanguagePath(name)),
      );

      for (let i = 0; i < languageNames.length; i++) {
        const path = foundPaths[i];
        if (path) {
          const config = vscode.workspace.getConfiguration("grsls");
          await config.update("path", path, vscode.ConfigurationTarget.Global);
        }
      }
    }
    return;
  }

  async activateGRSLSSetup() {
    vscode.commands.registerCommand("grsls.install", async () => {
      await this.promptForInstallGRSLS(
        "Install GRSLS or specify the executable path",
      );
    });

    const GRSLSExists = await this.getGRSLSPath();

    if (!GRSLSExists) {
      await this.promptForInstallGRSLS(
        "The GRSLS was not found. Install it or specify the executable path",
      );
    }
  }
}
