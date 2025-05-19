import {
  createPublicClient,
  erc20Abi,
  getAddress as toChecksum,
  http,
  isAddressEqual,
} from "viem";
import { hemi, hemiSepolia } from "hemi-viem";
import fs from "node:fs";

import { getRemoteToken } from "./get-remote-token.js";

const tokenList = JSON.parse(
  fs.readFileSync("./src/hemi.tokenlist.json", "utf-8"),
);

async function addToken() {
  const [chainIdStr, addressGiven] = process.argv.slice(2);
  const chainId = Number.parseInt(chainIdStr);
  const address = toChecksum(addressGiven);

  const found = tokenList.tokens.find(
    (t) => isAddressEqual(t.address, address) && t.chainId === chainId,
  );
  if (found) {
    console.log("Token already present");
    return;
  }

  try {
    const chain = [hemi, hemiSepolia].find((c) => c.id === chainId);
    if (!chain) {
      throw new Error("Unsupported chain");
    }

    const client = createPublicClient({
      chain,
      transport: http(),
    });

    const [decimals, symbol, name] = /** @type {[Number,String,string]} */ (
      await Promise.all(
        ["decimals", "symbol", "name"].map((method) =>
          client.readContract({
            abi: erc20Abi,
            address,
            args: [],
            functionName: /** @type {'decimals'|'symbol'|'name'} */ (method),
          }),
        ),
      )
    );
    const remoteTokenAddress = await getRemoteToken(client, address).catch(
      () => undefined,
    );

    const filename = symbol
      .toLowerCase()
      .replace(".e", "")
      .replaceAll(" ", "-")
      .toLowerCase();
    const pagesUrl = "https://hemilabs.github.io/token-list";
    const logoURI = `${pagesUrl}/logos/${filename}.svg`;
    tokenList.tokens.push({
      address,
      chainId,
      decimals,
      extensions: remoteTokenAddress && {
        bridgeInfo: {
          [chain.sourceId]: {
            tokenAddress: remoteTokenAddress,
          },
        },
      },
      logoURI,
      name,
      symbol,
    });

    tokenList.tokens
      .sort((a, b) => a.address.toLowerCase() - b.address.toLowerCase())
      .sort((a, b) => a.chainId - b.chainId);

    fs.writeFileSync(
      "src/hemi.tokenlist.json",
      JSON.stringify(tokenList, null, 2),
    );

    console.log("Token added");
  } catch (err) {
    console.error("Could not add token:", err.message);
  }
}

addToken();
