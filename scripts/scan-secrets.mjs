#!/usr/bin/env node

import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const ignoredDirectories = new Set([
  ".git",
  ".next",
  ".next.icloud-backup",
  ".cache",
  "node_modules",
  "node_modules.icloud-backup",
  "coverage",
  "dist",
  "build",
  "uploads",
]);
const ignoredFiles = new Set(["scripts/scan-secrets.mjs"]);
const textExtensions = new Set([
  ".cjs",
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".py",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml",
]);
const sourceRoots = [
  "backend/src/",
  "frontend/src/",
  "mobile_deferred/backend/",
];

const secretRules = [
  ["private-key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ["aws-access-key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ["github-token", /\b(?:ghp|gho|ghu|ghs|github_pat)_[A-Za-z0-9_]{20,}\b/g],
  ["google-api-key", /\bAIza[A-Za-z0-9_-]{30,}\b/g],
  ["openai-style-key", /\bsk-[A-Za-z0-9_-]{20,}\b/g],
  [
    "credential-in-database-url",
    /\b(?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql):\/\/[^/\s:@]+:[^/\s@]+@/g,
  ],
];
const serviceUrlRule =
  /(?:https?|wss?):\/\/(?:localhost|127\.0\.0\.1|\d{1,3}(?:\.\d{1,3}){3}|[^/\s"'`]*ngrok[^/\s"'`]*)[^\s"'`]*/g;
const allowedSourceUrls = new Set([
  "http://www.w3.org/2000/svg",
  "http://127.0.0.1:8001",
  "http://127.0.0.1:11434",
  "http://localhost:3001",
]);

async function walk(directory, files = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (
      entry.isDirectory() &&
      (ignoredDirectories.has(entry.name) || entry.name.startsWith(".venv"))
    ) {
      continue;
    }

    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, files);
      continue;
    }

    if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function lineNumber(content, index) {
  return content.slice(0, index).split("\n").length;
}

function report(relativePath, content, rule, match) {
  console.error(
    `${relativePath}:${lineNumber(content, match.index)}: ${rule}`
  );
}

async function main() {
  const failures = [];
  const files = await walk(root);

  for (const file of files) {
    const relativePath = path.relative(root, file).split(path.sep).join("/");
    const basename = path.basename(file);
    const extension = path.extname(file).toLowerCase();

    if (
      ignoredFiles.has(relativePath) ||
      basename === ".env" ||
      basename.startsWith(".env.") ||
      !textExtensions.has(extension)
    ) {
      continue;
    }

    if ((await stat(file)).size > 2 * 1024 * 1024) {
      continue;
    }

    const content = await readFile(file, "utf8");
    for (const [name, pattern] of secretRules) {
      pattern.lastIndex = 0;
      for (const match of content.matchAll(pattern)) {
        failures.push([relativePath, name]);
        report(relativePath, content, name, match);
      }
    }

    if (sourceRoots.some((sourceRoot) => relativePath.startsWith(sourceRoot))) {
      serviceUrlRule.lastIndex = 0;
      for (const match of content.matchAll(serviceUrlRule)) {
        if (allowedSourceUrls.has(match[0])) {
          continue;
        }
        failures.push([relativePath, "hardcoded-service-url"]);
        report(relativePath, content, "hardcoded-service-url", match);
      }
    }
  }

  if (failures.length > 0) {
    console.error(`Secret scan failed with ${failures.length} finding(s).`);
    return 1;
  }

  console.log("Secret scan passed.");
  return 0;
}

process.exitCode = await main();
