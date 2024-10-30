// Syncs the version of the metadata file with the version set in the
// package.json file.
//
// This script is executed just before committing the changes
// done by the "npm version" command.

"use strict";

const fs = require("fs");

const packageJson = require("../package.json");
const metadata = require("../src/hemi.tokenlist.json");

const [major, minor, patch] = packageJson.version.split(".");
metadata.version.major = parseInt(major);
metadata.version.minor = parseInt(minor);
metadata.version.patch = parseInt(patch);

fs.writeFileSync("src/hemi.tokenlist.json", JSON.stringify(metadata, null, 2));
