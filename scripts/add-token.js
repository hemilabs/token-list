import {
  createPublicClient,
  erc20Abi,
  getAddress as toChecksum,
  http,
  isAddress,
  isAddressEqual,
} from "viem";
import { hemi, hemiSepolia } from "hemi-viem";
import fs from "node:fs";

// eslint fails to parse "with { type: "json" }"
// See https://github.com/eslint/eslint/discussions/15305
const tokenList = JSON.parse(fs.readFileSync("./src/hemi.tokenlist.json"));

async function addToken() {
  const [chainIdStr, address] = process.argv.slice(2);
  const chainId = Number.parseInt(chainIdStr);

  if (!isAddress(address)) {
    throw new Error("Invalid address");
  }

  if (
    tokenList.tokens.find(
      (token) =>
        isAddressEqual(token.address, address) && token.chainId === chainId,
    )
  ) {
    console.log("Token already present");
    return;
  }

  try {
    const chain = [hemi, hemiSepolia].find((c) => c.id === chainId);
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

    const filename = symbol.toLowerCase().replace(".e", "");
    const repoUrl = "https://raw.githubusercontent.com/hemilabs/token-list";
    const logoURI = `${repoUrl}/master/src/logos/${filename}.svg`;
    tokenList.tokens.push({
      address: toChecksum(address),
      chainId,
      decimals,
      logoURI,
      name,
      symbol,
    });

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
