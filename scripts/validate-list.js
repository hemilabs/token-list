import Ajv from "ajv";
import addFormats from "ajv-formats";
import fs from "node:fs";
import { exit } from "node:process";

const tokenList = JSON.parse(
  fs.readFileSync("./src/hemi.tokenlist.json", "utf-8"),
);

const schemaUrl =
  "https://raw.githubusercontent.com/Uniswap/token-lists/main/src/tokenlist.schema.json";

// See https://github.com/uniswap/token-lists?tab=readme-ov-file#validating-token-lists
async function validate() {
  const ajv = new Ajv({ allErrors: true, verbose: true });
  addFormats(ajv);
  const schema = await fetch(schemaUrl).then((r) => r.json());

  // Some tokens contain spaces in their symbols, which is invalid according to
  // the token-list schema by Uniswap. So to work around those cases, the
  // matching pattern is slightly modified on the fly here.
  const condition = schema.definitions.TokenInfo.properties.symbol.anyOf.find(
    ({ pattern }) => pattern === "^\\S+$",
  );
  if (condition) {
    condition.pattern = "^\\S+( |\\S+)*$";
  }

  // There's a restriction on Extension values that they should not be larger than 42 characters.
  // That's not enough for the l1LogoURI, so we extend that restriction up to 100 characters.

  const l1LogoURIIndex =
    schema.definitions.ExtensionPrimitiveValue.anyOf.findIndex(
      ({ type }) => type === "string",
    );
  schema.definitions.ExtensionPrimitiveValue.anyOf[l1LogoURIIndex].maxLength =
    100;

  // The "oft" extension describes LayerZero bridging and is too deeply nested for
  // the generic ExtensionValue schema, so it is validated with an explicit shape.
  const addressPattern = "^0x[a-fA-F0-9]{40}$";
  schema.definitions.ExtensionMap.properties = {
    oft: {
      additionalProperties: false,
      properties: {
        adapterAddress: { pattern: addressPattern, type: "string" },
        peers: {
          additionalProperties: {
            additionalProperties: false,
            properties: {
              tokenAddress: { pattern: addressPattern, type: "string" },
            },
            required: ["tokenAddress"],
            type: "object",
          },
          minProperties: 1,
          propertyNames: { pattern: "^[0-9]+$" },
          type: "object",
        },
      },
      required: ["adapterAddress", "peers"],
      type: "object",
    },
  };

  const validator = ajv.compile(schema);
  const valid = validator(tokenList);
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
