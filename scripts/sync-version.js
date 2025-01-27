import fs from "node:fs";

const packageJson = JSON.parse(fs.readFileSync("./package.json", "utf-8"));
const tokenList = JSON.parse(
  fs.readFileSync("./src/hemi.tokenlist.json", "utf-8"),
);

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
