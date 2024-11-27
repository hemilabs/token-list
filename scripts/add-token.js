import { createPublicClient, http } from "viem";
import { erc20Abi } from "viem";
import { hemi, hemiSepolia } from "hemi-viem";
import fs from "node:fs";

import tokenList from "../src/hemi.tokenlist.json" with { type: "json" };

try {
  process.loadEnvFile();
} catch (e) {}

const [chainIdStr, address] = process.argv.slice(2);
const chainId = Number.parseInt(chainIdStr);

if (
  tokenList.tokens.find(
    (token) => token.address === address && token.chainId === chainId,
  )
) {
  console.log("Token already present");
  process.exit(0);
}

try {
  const client = createPublicClient({
    chain: [hemi, hemiSepolia].find((chain) => chain.id == chainId),
    transport: http(process.env[`RPC_URL_${chainId}`]),
  });

  const [decimals, symbol, name] = /** @type {[Number,String,string]} */ (
    await Promise.all(
      ["decimals", "symbol", "name"].map((method) =>
        client.readContract({
          abi: erc20Abi,
          address: /** @type {`0x${string}`} */ (address),
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
    address,
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
