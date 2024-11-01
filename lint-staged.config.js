const formatFiles = "prettier --ignore-unknown --write";
const sortPackageJson = "better-sort-package-json";

module.exports = {
  "!(*.{js,json,md,svg,ts,tsx,yml}|package.json)": [formatFiles],
  "*.{js,md,svg,ts,tsx,yml}": [formatFiles],
  "src/*.json": [formatFiles],
  "package.json": [sortPackageJson, formatFiles],
};
