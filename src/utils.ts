import * as path from "path";
import * as fs from "fs";

export function findServerLanguagePath(
  serverExecutable: string,
): Promise<string | null> {
  return new Promise((resolve) => {
    const pathsToCheck = process.env.PATH?.split(path.delimiter) || [];
    let foundPath: string | null = null;

    const checkNextPath = (index: number) => {
      if (index >= pathsToCheck.length) {
        resolve(foundPath);
        return;
      }

      const dir = pathsToCheck[index];
      const fullPath = path.join(dir, serverExecutable);

      fs.access(fullPath, fs.constants.X_OK, (err) => {
        if (!err) {
          foundPath = fullPath;
          resolve(foundPath);
        } else {
          checkNextPath(index + 1);
        }
      });
    };

    checkNextPath(0);
  });
}
