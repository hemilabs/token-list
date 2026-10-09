# Adding a New Token to the List

The goal of this guide is to walk you through the steps needed to add a new token to the token list.

The list only holds data that can be verified on chain. Anything that can be derived from other data, or is presentation-only, does not belong in it.

## Before you begin

You need to have some information about the token you want to add to the list before you begin this process:

### Chain ID

The new token can be added to testnet and/or mainnet and the chain ID for each is the following:

- Testnet: 743111
- Mainnet: 43111

> If you want to add the token to both testnet and mainnet you need to execute these steps for each chain (one for testnet and another for mainnet).

### Token Address

The new token's smart contract must already be deployed in the chain you want to add it to and this process will provide a Token Address like the one below:

[0x8970a6A9Eae065aA81a94E86ebCAF4F3d4dd6DA1](https://explorer.hemi.xyz/address/0x8970a6A9Eae065aA81a94E86ebCAF4F3d4dd6DA1)

> You can get this information from the tokens section of Hemi Explorer.

## Step 1 - Run the Add Token Script

There is a script that automates the process of adding new tokens to the list and you just need to use the `chain-id` and `address` you collected in the previous step:

```sh
node scripts/add-token <chain-id> <address>
```

> You need to install the project dependencies before running this command with `pnpm install`.

The script will automatically add the information about the new token to [./src/hemi.tokenlist.json](../src/hemi.tokenlist.json) file as shown below:

```jsonc
// hemi.tokenlist.json
...
{
    "address": "0x0C8aFD1b58aa2A5bAd2414B861D8A7fF898eDC3A",
    "chainId": 743111,
    "decimals": 18,
    "logoURI": "https://hemilabs.github.io/token-list/logos/weth.svg",
    "name": "Wrapped Ether",
    "symbol": "WETH"
}
...
```

## Step 2 - Add the Token Logos

If you pay attention to the information added by the script in the previous step it has the `logoURI` for the new token and you need to add the image file related to it to the [./src/logos](../src/logos) directory. This logo must include the "Hemi" sub-logo in it.

```json
"logoURI": "https://hemilabs.github.io/token-list/logos/weth.svg",
```

> The token logo can be an SVG or PNG file (it sets `svg` as default in the `logoURI`, but you can change it to `png` if needed).

In addition to the L2 logo, you must add a L1 logo version that does not include the Hemi logo in it. This logo file shall be added to the [./src/l1Logos](../src/l1Logos) directory with the same file name and extension as the L2 one (e.g. `weth.svg`). It is not referenced from the list: its URL is the `logoURI` with `/logos/` replaced by `/l1Logos/`.

## Step 3 - Add the rest of the optional Extensions values

Some important token information is not gathered by the `add-token` script and may need to be added manually to the [./src/hemi.tokenlist.json](../src/hemi.tokenlist.json) file as extensions.

### birthBlock

You can get the `birthBlock` number from Hemi Explorer, just check the block number of the transaction that created the token smart contract and add it to the JSON file as follows:

```jsonc
...
{
    "address": "0x0C8aFD1b58aa2A5bAd2414B861D8A7fF898eDC3A",
    "chainId": 743111,
    "decimals": 18,
    "extensions": {
        "birthBlock": 195484 // <------
    },
    "logoURI": "https://hemilabs.github.io/token-list/logos/weth.svg",
    "name": "Wrapped Ether",
    "symbol": "WETH"
}
...
```

### bridgeInfo (optional)

`bridgeInfo` maps each remote chain id to the canonical remote token on the standard bridge, that is, the token the Hemi token is bridged from through the tunnel. If the new token will be used for the tunnel you also need to add the `bridgeInfo` data to the JSON file (if it does not have it already).

```jsonc
...
{
    "address": "0x3Adf21A6cbc9ce6D5a3ea401E7Bae9499d391298",
    "chainId": 743111,
    "decimals": 6,
    "extensions": {
        "birthBlock": 575834,
        "bridgeInfo": { //<-----------------
            "11155111": {
                "tokenAddress": "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0"
            }
        }
    },
    "logoURI": "https://hemilabs.github.io/token-list/logos/usdt.svg",
    "name": "USDT.e",
    "symbol": "USDT.e"
}
...
```

### allowanceSlot (optional)

Base storage slot of the `mapping(owner => mapping(spender => uint256))` (or `uint96`, as in COMP and UNI), with the owner as the outer key, so an entry sits at `keccak256(abi.encode(spender, keccak256(abi.encode(owner, allowanceSlot))))`. Tokens using ERC-7201 namespaced storage or a Vyper layout do not fit this shape, so omit the extension instead of guessing.

There is no getter for it, so run the script to find it:

```sh
node scripts/find-allowance-slot.js 43111 0xad11a8BEb98bbf61dbb1aa0F6d6F2ECD87b35afA
```

```jsonc
...
{
    "address": "0xad11a8BEb98bbf61dbb1aa0F6d6F2ECD87b35afA",
    "chainId": 43111,
    "decimals": 6,
    "extensions": {
        "allowanceSlot": 10, // <------
        "birthBlock": 623077
    },
    "logoURI": "https://hemilabs.github.io/token-list/logos/usdc.svg",
    "name": "Bridged USDC (Stargate)",
    "symbol": "USDC.e"
}
...
```

For the token on Ethereum, add it next to its `tokenAddress` in `bridgeInfo`, and pass chain id `1` to the script.

```jsonc
"bridgeInfo": {
  "1": {
    "allowanceSlot": 3, // <------
    "tokenAddress": "0x6B175474E89094C44Da98b954EedeAC495271d0F"
  }
}
```

The `should have the correct allowance slot` tests check every `allowanceSlot` in the list, so a wrong value fails CI.

### oft (optional)

If the token is bridged with LayerZero, add the `oft` extension:

- `adapterAddress`: the OFT contract on Hemi. Its `token()` must return the Hemi token address, so for a native OFT it is the token address itself.
- `peers`: one entry per remote chain id, with the `tokenAddress` of the token on that chain.

```jsonc
...
{
    "address": "0xAA40c0c7644e0b2B224509571e10ad20d9C4ef28",
    "chainId": 43111,
    "decimals": 8,
    "extensions": {
        "oft": { // <------
            "adapterAddress": "0xDefa4A253a0Ec96a2e6D74A409B3B348924bf390",
            "peers": {
                "1": {
                    "tokenAddress": "0x06ea695B91700071B161A434fED42D1DcbAD9f00"
                }
            }
        }
    },
    ...
}
...
```

When the remote OFT is an adapter wrapping a separate token, add the adapter as `adapterAddress` in the peer entry. An `allowanceSlot` for the remote token can be added there too (see [allowanceSlot](#allowanceslot-optional)).

```jsonc
"oft": {
  "adapterAddress": "0xfF16E26B7fFCf24c378D57DF536dC5eC104a7dE4",
  "peers": {
    "1": {
      "adapterAddress": "0x63413dA01EE7E1cec9d51EE27B3FAf81d786821c", // <------
      "allowanceSlot": 1,
      "tokenAddress": "0xf196C68233464A16CFDa319a47c21f4cECa62001"
    }
  }
}
```

## Step 4 - Commit Changes

Create a commit with your changes (it must be signed):

```sh
git add <files-path>
git commit -S -m "Added new token <token-name>"
```

The changes you did in the code will be checked automatically in terms of formating, linting and unit tests. If one of these checks fail the commit will not be done and you will need to fix the problems before commiting again.

## Step 5 - Bump Package Minor Version

You can only use the new token you added if you generate a new package version for it and that can be done by running:

```sh
pnpm version minor
```

This command will increase the minor version by 1 and add a tag to the commit you created in the previous step.

After that you can finally create a PR and, once merged, you have to wait for the new release to be published to use it anywhere you want it.
