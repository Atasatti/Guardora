#!/usr/bin/env node

import { readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const sourceDirectories = [
  path.join(root, "backend", "src"),
  path.join(root, "mobile_deferred", "backend"),
];

async function javaScriptFiles(directory, files = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await javaScriptFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(fullPath);
    }
  }
  return files;
}

for (const directory of sourceDirectories) {
  for (const file of await javaScriptFiles(directory)) {
    const result = spawnSync(process.execPath, ["--check", file], {
      encoding: "utf8",
    });

    if (result.status !== 0) {
      process.stderr.write(result.stderr);
      process.exitCode = 1;
    }
  }
}

if (!process.exitCode) {
  console.log("Backend JavaScript syntax check passed.");
}
