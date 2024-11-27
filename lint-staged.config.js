const formatFiles = "prettier --ignore-unknown --write";
const sortPackageJson = "better-sort-package-json";

export default {
  "!package.json": [formatFiles],
  "package.json": [sortPackageJson, formatFiles],
};
