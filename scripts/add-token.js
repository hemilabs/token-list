import {
  createPublicClient,
  erc20Abi,
  getAddress as toChecksum,
  http,
  isAddressEqual,
} from "viem";
import { hemi, hemiSepolia } from "hemi-viem";
import fs from "node:fs";

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

    // The remote token address should be read from the "REMOTE_TOKEN" function
    // as "l1Token" and "remoteToken" are deprecated as per the comments in
    // OptimismMintableERC20.
    // And if there is an error getting the remote address, just ignore it.
    // See: https://github.com/ethereum-optimism/optimism/blob/ca5855220fb2264aa32c882d056dd98da21ac47a/packages/contracts-bedrock/src/universal/OptimismMintableERC20.sol#L23
    const remoteTokenAddress = await client
      .readContract({
        abi: [
          {
            inputs: [],
            name: "REMOTE_TOKEN",
            outputs: [
              {
                internalType: "address",
                name: "",
                type: "address",
              },
            ],
            stateMutability: "view",
            type: "function",
          },
        ],
        address,
        args: [],
        functionName: "REMOTE_TOKEN",
      })
      .catch(() => undefined);

    const filename = symbol.toLowerCase().replace(".e", "");
    const repoUrl = "https://raw.githubusercontent.com/hemilabs/token-list";
    const logoURI = `${repoUrl}/master/src/logos/${filename}.svg`;
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
