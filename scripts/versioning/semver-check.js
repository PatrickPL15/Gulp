const fs = require('fs');
const path = require('path');

// Strict SemVer 2.0.0 regex from semver.org specification.
const SEMVER_REGEX = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

function fail(message) {
  console.error(`semver-check: ${message}`);
  process.exit(1);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`Unable to read ${filePath}: ${error.message}`);
  }
}

const workspaceRoot = path.resolve(__dirname, '..', '..');
const packageJsonPath = path.join(workspaceRoot, 'package.json');
const packageLockPath = path.join(workspaceRoot, 'package-lock.json');

const pkg = readJson(packageJsonPath);
const version = String(pkg.version || '').trim();

if (!version) {
  fail('package.json is missing a version field.');
}

if (!SEMVER_REGEX.test(version)) {
  fail(`Version "${version}" is not valid SemVer 2.0.0.`);
}

if (fs.existsSync(packageLockPath)) {
  const lock = readJson(packageLockPath);
  const lockVersion = String(lock.version || '').trim();

  if (!lockVersion) {
    fail('package-lock.json is missing a top-level version field.');
  }

  if (lockVersion !== version) {
    fail(`package-lock.json version (${lockVersion}) does not match package.json version (${version}).`);
  }
}

console.log(`semver-check: OK (${version})`);
