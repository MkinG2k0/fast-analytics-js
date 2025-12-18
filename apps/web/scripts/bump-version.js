import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJsonPath = join(__dirname, "..", "package.json");

try {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

  const [major, minor, patch] = packageJson.version.split(".").map(Number);
  const oldVersion = packageJson.version;
  const newVersion = `${major}.${minor}.${patch + 1}`;

  packageJson.version = newVersion;

  writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + "\n",
    "utf-8"
  );

  console.log(`Version bumped from ${oldVersion} to ${newVersion}`);

  process.exit(0);
} catch (error) {
  console.error("Error bumping version:", error);
  process.exit(1);
}
