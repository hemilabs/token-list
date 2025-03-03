import Ajv from "ajv";
import addFormats from "ajv-formats";
import fs from "node:fs";
import { exit } from "node:process";

const tokenList = JSON.parse(
  fs.readFileSync("./src/hemi.tokenlist.json", "utf-8"),
);

const schemaUrl =
  "https://raw.githubusercontent.com/Uniswap/token-lists/main/src/tokenlist.schema.json";

// Some tokens are invalid (they were deployed with a schema that doesn't match the expected Uniswap list).
// So we must exclude these.
// TODO see https://github.com/hemilabs/token-list/issues/41
const tokenAddressToExclude = ["0x0Af3EC6F9592C193196bEf220BC0Ce4D9311527D"];

// See https://github.com/uniswap/token-lists?tab=readme-ov-file#validating-token-lists
async function validate() {
  const ajv = new Ajv({ allErrors: true, verbose: true });
  addFormats(ajv);
  const schema = await fetch(schemaUrl).then((r) => r.json());
  const validator = ajv.compile(schema);
  const valid = validator({
    ...tokenList,
    tokens: tokenList.tokens.filter(
      (token) => !tokenAddressToExclude.includes(token.address),
    ),
  });
  if (valid) {
    return;
  }
  if (validator.errors) {
    throw validator.errors;
  }
}

validate()
  .then(() => console.info("Schema is valid"))
  .catch(function (err) {
    console.error(err);
    exit(1);
  });
