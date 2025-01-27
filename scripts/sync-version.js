import fs from "node:fs";

// eslint fails to parse "with { type: "json" }"
// See https://github.com/eslint/eslint/discussions/15305
const packageJson = JSON.parse(fs.readFileSync("./package.json"));
const tokenList = JSON.parse(fs.readFileSync("./src/hemi.tokenlist.json"));

const currentVersion = [
  tokenList.version.major,
  tokenList.version.minor,
  tokenList.version.patch,
].join(".");

if (currentVersion !== packageJson.version) {
  const [major, minor, patch] = packageJson.version.split(".");
  tokenList.version.major = parseInt(major);
  tokenList.version.minor = parseInt(minor);
  tokenList.version.patch = parseInt(patch);

  tokenList.timestamp = new Date().toISOString();

  fs.writeFileSync(
    "src/hemi.tokenlist.json",
    JSON.stringify(tokenList, null, 2),
  );

  console.log("Version updated");
}
