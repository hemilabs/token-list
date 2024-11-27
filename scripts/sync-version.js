import fs from "node:fs";

import packageJson from "../package.json" with { type: "json" };
import tokenList from "../src/hemi.tokenlist.json" with { type: "json" };

const [major, minor, patch] = packageJson.version.split(".");
tokenList.version.major = parseInt(major);
tokenList.version.minor = parseInt(minor);
tokenList.version.patch = parseInt(patch);

tokenList.timestamp = new Date().toISOString();

fs.writeFileSync("src/hemi.tokenlist.json", JSON.stringify(tokenList, null, 2));
