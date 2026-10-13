import { hemi, hemiSepolia } from "hemi-viem";
import {
  createPublicClient,
  encodeAbiParameters,
  erc20Abi,
  getAddress as toChecksum,
  http,
  keccak256,
  maxUint256,
  maxUint96,
  toHex,
} from "viem";
import { mainnet, sepolia } from "viem/chains";

// The default Ethereum RPCs are unreliable, so use explicit endpoints there.
export const rpcUrls = {
  [mainnet.id]: "https://eth.drpc.org",
  [sepolia.id]: "https://ethereum-sepolia-rpc.publicnode.com",
};

const [filename, chainIdStr, addressGiven] = process.argv.slice(1);

// Any pair works: the override writes the allowance straight into storage, so
// neither address needs a balance or a prior approval.
const probeOwner = "0x1111111111111111111111111111111111111111";
const probeSpender = "0x2222222222222222222222222222222222222222";

// Solidity lays a mapping entry at keccak256(key . slot), so the allowance of
// an (owner, spender) pair under a base slot index lands here.
const getAllowanceStorageKey = ({ owner, slot, spender }) =>
  keccak256(
    encodeAbiParameters(
      [{ type: "address" }, { type: "bytes32" }],
      [
        spender,
        keccak256(
          encodeAbiParameters(
            [{ type: "address" }, { type: "uint256" }],
            [owner, slot],
          ),
        ),
      ],
    ),
  );

export async function isAllowanceSlot({ address, client, slot }) {
  const allowance = await client.readContract({
    abi: erc20Abi,
    address,
    args: [probeOwner, probeSpender],
    functionName: "allowance",
    stateOverride: [
      {
        address,
        stateDiff: [
          {
            slot: getAllowanceStorageKey({
              owner: probeOwner,
              slot,
              spender: probeSpender,
            }),
            value: toHex(maxUint256, { size: 32 }),
          },
        ],
      },
    ],
  });
  // COMP and UNI pack allowances into a uint96, so the forced value reads
  // back truncated to its maximum.
  return allowance === maxUint256 || allowance === maxUint96;
}

export async function findAllowanceSlot(client, address, lastSlot = 300n) {
  for (let slot = 0n; slot <= lastSlot; slot++) {
    if (await isAllowanceSlot({ address, client, slot })) {
      return slot;
    }
  }
  return null;
}

async function printAllowanceSlot() {
  try {
    const chainId = Number.parseInt(chainIdStr);
    const chain = [hemi, hemiSepolia, mainnet].find((c) => c.id === chainId);
    if (!chain) {
      throw new Error("Unsupported chain");
    }

    const client = createPublicClient({
      chain,
      transport: http(rpcUrls[chain.id]),
    });
    const slot = await findAllowanceSlot(client, toChecksum(addressGiven));
    if (slot === null) {
      throw new Error("No slot matched, the token may not use a plain mapping");
    }
    console.log(slot.toString());
  } catch (err) {
    console.error("Could not find the allowance slot:", err.message);
  }
}

// Only run this script if it is the main module. This allows importing
// "isAllowanceSlot" and "rpcUrls" in other files without side effects.
if (filename === import.meta.filename) {
  printAllowanceSlot();
}
