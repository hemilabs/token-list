const eslint = "eslint --cache --fix --quiet";
const formatFiles = "prettier --ignore-unknown --write";
const sortPackageJson = "better-sort-package-json";

export default {
  "!(package).json": [formatFiles],
  "*.{js,md,ts}": [eslint, formatFiles],
  "*.{svg,yml}": [formatFiles],
  "package.json": [sortPackageJson, formatFiles],
};
