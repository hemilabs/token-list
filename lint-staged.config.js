const eslint = "eslint --cache --fix --quiet";
const formatFiles = "prettier --ignore-unknown --write";
const sortPackageJson = "better-sort-package-json";

export default {
  "!(*.{js,json,md,ts,tsx,yml}|package.json)": [eslint, formatFiles],
  "!package.json": [formatFiles],
  "package.json": [sortPackageJson, formatFiles],
};
