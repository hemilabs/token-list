import { hemi, hemiSepolia } from "hemi-viem";
import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";
import {
  checksumAddress,
  createPublicClient,
  erc20Abi,
  http,
  isAddress,
} from "viem";
import { readContract } from "viem/actions";
import { arbitrum, base, bsc, mainnet, optimism, sepolia } from "viem/chains";

import { isAllowanceSlot, rpcUrls } from "../scripts/find-allowance-slot.js";
import { getRemoteToken } from "../scripts/get-remote-token.js";

const packageJson = JSON.parse(fs.readFileSync("./package.json", "utf-8"));
const tokenList = JSON.parse(
  fs.readFileSync("./src/hemi.tokenlist.json", "utf-8"),
);

// A client per chain, keyed by chain id: the Hemi chains where tokens live plus
// the chains a LayerZero-bridged token can reach to read its remote OFT peer.
// Cap each request at 5s and disable retries so an unresponsive or rate-limited
// public RPC fails fast instead of hanging on retry/Retry-After backoff.
const clients = Object.fromEntries(
  [hemi, hemiSepolia, mainnet, sepolia, optimism, bsc, base, arbitrum].map(
    (chain) => [
      chain.id,
      createPublicClient({
        chain,
        transport: http(rpcUrls[chain.id], { retryCount: 0, timeout: 5000 }),
      }),
    ],
  ),
);

// LayerZero V2 endpoint ID for Hemi. Remote OFTs peer back to the Hemi adapter
// using this id.
const hemiEndpointId = 30329;

const peersAbi = [
  {
    inputs: [{ type: "uint32" }],
    name: "peers",
    outputs: [{ type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
];
const tokenAbi = [
  {
    inputs: [],
    name: "token",
    outputs: [{ type: "address" }],
    stateMutability: "view",
    type: "function",
  },
];

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
        const isChecksummed = (value) =>
          isAddress(value) && checksumAddress(value) === value;
        assert.ok(isChecksummed(address));
        Object.values(extensions.bridgeInfo ?? {}).forEach(({ tokenAddress }) =>
          assert.ok(isChecksummed(tokenAddress)),
        );
        if (extensions.oft) {
          assert.ok(isChecksummed(extensions.oft.adapterAddress));
          Object.values(extensions.oft.peers)
            .flatMap(({ adapterAddress, tokenAddress }) =>
              adapterAddress === undefined
                ? [tokenAddress]
                : [adapterAddress, tokenAddress],
            )
            .forEach((value) => assert.ok(isChecksummed(value)));
        }
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

      it("should have the correct allowance slot", async function () {
        const { allowanceSlot } = extensions;
        if (allowanceSlot === undefined) {
          this.skip();
          return;
        }

        assert.ok(
          await isAllowanceSlot({
            address,
            client: clients[chainId],
            slot: BigInt(allowanceSlot),
          }),
        );
      });

      it("should have the correct allowance slot in its bridged tokens", async function () {
        const bridgedTokens = Object.entries(
          extensions.bridgeInfo ?? {},
        ).filter(([, { allowanceSlot }]) => allowanceSlot !== undefined);
        if (!bridgedTokens.length) {
          this.skip();
          return;
        }

        for (const [
          remoteChainId,
          { allowanceSlot, tokenAddress },
        ] of bridgedTokens) {
          const client = clients[remoteChainId];
          assert.ok(client, `no client configured for chain ${remoteChainId}`);
          assert.ok(
            await isAllowanceSlot({
              address: tokenAddress,
              client,
              slot: BigInt(allowanceSlot),
            }),
          );
        }
      });

      it("should have the correct allowance slot in its OFT peers", async function () {
        const peers = Object.entries(extensions.oft?.peers ?? {}).filter(
          ([, { allowanceSlot }]) => allowanceSlot !== undefined,
        );
        if (!peers.length) {
          this.skip();
          return;
        }

        for (const [remoteChainId, { allowanceSlot, tokenAddress }] of peers) {
          const client = clients[remoteChainId];
          assert.ok(client, `no client configured for chain ${remoteChainId}`);
          assert.ok(
            await isAllowanceSlot({
              address: tokenAddress,
              client,
              slot: BigInt(allowanceSlot),
            }),
          );
        }
      });

      it("should have ERC20 remote tokens", async function () {
        const remoteTokens = [
          ...Object.entries(extensions.bridgeInfo ?? {}),
          ...Object.entries(extensions.oft?.peers ?? {}),
        ];
        if (!remoteTokens.length) {
          this.skip();
          return;
        }

        for (const [remoteChainId, { tokenAddress }] of remoteTokens) {
          const client = clients[remoteChainId];
          assert.ok(client, `no client configured for chain ${remoteChainId}`);
          // name and symbol are optional in EIP-20 (and bytes32 in MKR).
          await Promise.all(
            ["decimals", "totalSupply"].map((method) =>
              readContract(client, {
                abi: erc20Abi,
                address: tokenAddress,
                args: [],
                functionName: /** @type {'decimals'|'totalSupply'} */ (method),
              }),
            ),
          );
        }
      });

      it("should have the correct remote token address", async function () {
        const client = clients[chainId];
        const tokenAddress =
          extensions?.bridgeInfo?.[client.chain.sourceId].tokenAddress;
        const remoteToken = await getRemoteToken(client, address).catch(
          () => null,
        );
        if (!tokenAddress && !remoteToken) {
          this.skip();
          return;
        }

        assert.equal(remoteToken, tokenAddress);
      });

      it("should have valid LayerZero OFT peers", async function () {
        const { oft } = extensions;
        if (!oft) {
          this.skip();
          return;
        }

        // The Hemi-side OFT adapter must wrap this token.
        const adapterToken = await readContract(clients[chainId], {
          abi: tokenAbi,
          address: oft.adapterAddress,
          args: [],
          functionName: "token",
        });
        assert.equal(adapterToken, address);

        // Every peer OFT must point back to the Hemi adapter.
        for (const [
          remoteChainId,
          { adapterAddress, tokenAddress },
        ] of Object.entries(oft.peers)) {
          const client = clients[remoteChainId];
          assert.ok(client, `no client configured for chain ${remoteChainId}`);
          // A native OFT (no adapter) must return itself as its token.
          const remoteAdapterToken = await readContract(client, {
            abi: tokenAbi,
            address: adapterAddress ?? tokenAddress,
            args: [],
            functionName: "token",
          });
          assert.equal(remoteAdapterToken, tokenAddress);
          const peer = await readContract(client, {
            abi: peersAbi,
            address: adapterAddress ?? tokenAddress,
            args: [hemiEndpointId],
            functionName: "peers",
          });
          assert.equal(
            checksumAddress(`0x${peer.slice(-40)}`),
            oft.adapterAddress,
          );
        }
      });
    });
  });
});
