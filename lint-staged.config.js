const formatFiles = "prettier --ignore-unknown --write";
const sortPackageJson = "better-sort-package-json";

module.exports = {
  "!(*.{js,json,md,ts,tsx,yml}|package.json)": [formatFiles],
  "*.{js,md,ts,tsx,yml}": [formatFiles],
  "src/*.json": [formatFiles],
  "package.json": [sortPackageJson, formatFiles],
};
