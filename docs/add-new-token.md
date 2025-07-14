# Adding a New Token to the List

The goal of this guide is to walk you through the steps needed to add a new token to the token list.

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

> You need to install the project dependencies before running this command with `npm install`.

The script will automatically add the information about the new token to [./src/hemi.tokenlist.json](../src/hemi.tokenlist.json) file as shown below:

```jsonc
// hemi.tokenlist.json
...
{
    "address": "0x0C8aFD1b58aa2A5bAd2414B861D8A7fF898eDC3A",
    "chainId": 743111,
    "decimals": 18,
    "extensions": {
      "l1LogoURI": "https://hemilabs.github.io/token-list/l1Logos/weth.svg",
    },
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

In addition to that, in the extensions field, a L1 logo version is added that does not include the Hemi logo in it. These logos shall be added to the [./src/l1Logos](../src/l1Logos) directory.

```json
"extensions": {
  "logoURI": "https://hemilabs.github.io/token-list/l1Logos/weth.svg",
}
```

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

If the new token will be used for the tunnel you also need to add the `bridgeInfo` data to the JSON file (if it does not have it already).

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
npm version minor
```

This command will increase the minor version by 1 and add a tag to the commit you created in the previous step.

After that you can finally create a PR and, once merged, you have to wait for the new release to be published to use it anywhere you want it.
