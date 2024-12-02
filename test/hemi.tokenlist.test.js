import { createPublicClient, http } from "viem";
import { describe, it } from "node:test";
import { erc20Abi } from "viem";
import { hemi, hemiSepolia } from "hemi-viem";
import assert from "node:assert/strict";
import fs from "node:fs";

import packageJson from "../package.json" with { type: "json" };
import tokenList from "../src/hemi.tokenlist.json" with { type: "json" };

try {
  process.loadEnvFile();
} catch (e) {}

const clients = Object.fromEntries(
  [hemi, hemiSepolia].map((chain) => [
    chain.id,
    createPublicClient({
      chain,
      transport: http(process.env[`EVM_RPC_URL_${chain.id}`]),
    }),
  ]),
);

describe("Version", function () {
  it("should match the package version", function () {
    const { major, minor, patch } = tokenList.version;
    const versionString = `${major}.${minor}.${patch}`;
    assert.equal(versionString, packageJson.version);
  });
});

describe("List of tokens", function () {
  it("should not be any duplicates", function () {
    assert.equal(
      new Set(
        tokenList.tokens.map(({ chainId, symbol }) => `${chainId}:${symbol}`),
      ).size,
      tokenList.tokens.length,
    );
  });

  tokenList.tokens.map(function (token) {
    const { address, chainId, decimals, logoURI, name, symbol } = token;

    describe(`Token ${chainId}:${symbol}`, function () {
      it("should be a valid ERC20", async function () {
        const client = clients[chainId];
        const props = await Promise.all(
          ["decimals", "symbol", "name"].map((method) =>
            client.readContract({
              abi: erc20Abi,
              address: /** @type {`0x${string}`} */ (address),
              args: [],
              functionName: /** @type {'decimals'|'symbol'|'name'} */ (method),
            }),
          ),
        );
        assert.deepEqual(props, [decimals, symbol, name]);
      });

      it("image URL and file should be valid", function () {
        const repoUrl = "https://raw.githubusercontent.com/hemilabs/token-list";
        const filename = symbol.toLowerCase().replace(".e", "");
        assert.equal(logoURI, `${repoUrl}/master/src/logos/${filename}.svg`);
        fs.accessSync(`src/logos/${filename}.svg`);
      });
    });
  });
});
