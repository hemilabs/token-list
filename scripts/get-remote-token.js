import { hemi, hemiSepolia } from "hemi-viem";
import { createPublicClient, getAddress as toChecksum, http } from "viem";

const [filename, chainIdStr, addressGiven] = process.argv.slice(1);

const partialLegacyMintableErc20Abi = [
  {
    inputs: [],
    name: "l1Token",
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
];
const partialOptimismMintableErc20Abi = [
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
  {
    inputs: [],
    name: "remoteToken",
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
];

// To maximize compatibility, the remote token address is read from the legacy
// "l1Token" method first, before trying the recommended "REMOTE_TOKEN" contract
// property in the new mintable interface, and finally from the new
// "remoteToken" method. The full ABIs are defined in LegacyMintableERC20.json
// and OptimismMintableERC20.json.
// See: https://github.com/ethereum-optimism/optimism
export const getRemoteToken = (client, address) =>
  client
    .readContract({
      abi: partialLegacyMintableErc20Abi,
      address,
      args: [],
      functionName: "l1Token",
    })
    .catch(() =>
      client.readContract({
        abi: partialOptimismMintableErc20Abi,
        address,
        args: [],
        functionName: "REMOTE_TOKEN",
      }),
    )
    .catch(() =>
      client.readContract({
        abi: partialOptimismMintableErc20Abi,
        address,
        args: [],
        functionName: "remoteToken",
      }),
    );

async function printRemoteToken() {
  try {
    const chainId = Number.parseInt(chainIdStr);
    const chain = [hemi, hemiSepolia].find((c) => c.id === chainId);
    if (!chain) {
      throw new Error("Unsupported chain");
    }

    const client = createPublicClient({ chain, transport: http() });
    const address = toChecksum(addressGiven);
    const remoteTokenAddress = await getRemoteToken(client, address);
    console.log(remoteTokenAddress);
  } catch (err) {
    console.error("Could not get the remote token address:", err.message);
  }
}

// Only run this script if it is the main module. This allows importing the
// "getRemoteToken" function in other scripts without side effects.
if (filename === import.meta.filename) {
  printRemoteToken();
}
