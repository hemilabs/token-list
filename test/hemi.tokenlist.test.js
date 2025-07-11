import { hemi, hemiSepolia } from "hemi-viem";
import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";
import { createPublicClient, erc20Abi, http, isAddress } from "viem";

import { getRemoteToken } from "../scripts/get-remote-token.js";

const packageJson = JSON.parse(fs.readFileSync("./package.json", "utf-8"));
const tokenList = JSON.parse(
  fs.readFileSync("./src/hemi.tokenlist.json", "utf-8"),
);

const clients = Object.fromEntries(
  [hemi, hemiSepolia].map((chain) => [
    chain.id,
    createPublicClient({
      chain,
      transport: http(),
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

  tokenList.tokens.forEach(function (token) {
    const {
      address,
      chainId,
      decimals,
      extensions = {},
      logoURI,
      name,
      symbol,
    } = token;

    describe(`Token ${chainId}:${address} (${symbol})`, function () {
      it("should have all its addresses in the checksum format", function () {
        // viem's isAddress checks for checksum format
        assert.ok(isAddress(address));

        // check the bridgeInfo address, if defined
        Object.values(extensions.bridgeInfo ?? {}).forEach(({ tokenAddress }) =>
          assert.ok(isAddress(tokenAddress)),
        );
      });

      it("should be a valid ERC20", async function () {
        const client = clients[chainId];
        const props = await Promise.all(
          ["decimals", "symbol", "name"].map((method) =>
            client.readContract({
              abi: erc20Abi,
              address,
              args: [],
              functionName: /** @type {'decimals'|'symbol'|'name'} */ (method),
            }),
          ),
        );
        assert.deepEqual(props, [decimals, symbol, name]);
      });

      it("image URL and file should be valid for l1 and l2 token logos", function () {
        // TODO https://github.com/hemilabs/token-list/issues/36 testnet bitcoin logo url needs to be updated
        if (address === "0x36Ab5Dba83d5d470F670BC4c06d7Da685d9afAe7") {
          this.skip();
          return;
        }
        const pagesUrl = "https://hemilabs.github.io/token-list";
        const filename = symbol
          .toLowerCase()
          .replace(".e", "")
          .replaceAll(" ", "-")
          .toLowerCase();

        const getFilePath = (uri, folder) =>
          uri.match(
            new RegExp(
              `^${pagesUrl.replaceAll(".", "\\.")}/${folder}/${filename}\\.(svg|png)$`,
            ),
          );

        const l2LogoFilePath = getFilePath(logoURI, "logos");

        const l1LogoFilePath = getFilePath(extensions.l1LogoURI, "l1Logos");

        assert.notEqual(l2LogoFilePath, null);
        fs.accessSync(l2LogoFilePath[0].replace(`${pagesUrl}/`, "src/"));

        assert.notEqual(l1LogoFilePath, null);
        fs.accessSync(l1LogoFilePath[0].replace(`${pagesUrl}/`, "src/"));
      });

      it("should have a valid birth block number", function () {
        const birthBlock = extensions?.birthBlock;
        if (!birthBlock) {
          this.skip();
          return;
        }

        assert.ok(Number.isInteger(birthBlock));
      });

      it("should have the correct remote token address", async function () {
        const client = clients[chainId];
        const tokenAddress =
          extensions?.bridgeInfo?.[client.chain.sourceId].tokenAddress;
        if (!tokenAddress) {
          this.skip();
          return;
        }

        const remoteToken = await getRemoteToken(client, address);
        assert.equal(remoteToken, tokenAddress);
      });
    });
  });
});
