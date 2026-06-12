# @hemilabs/token-list

![NPM Version](https://img.shields.io/npm/v/%40hemilabs%2Ftoken-list)

List of ERC-20 tokens in the Hemi chains.

## Usage

Obtain the latest version of the token list from directly from GitHub:

```sh
wget https://github.com/hemilabs/token-list/blob/master/src/hemi.tokenlist.json
```

Or install it as an NPM package:

```sh
npm install @hemilabs/token-list
```

and then use it in your code:

```js
const hemiTokenList = require("@hemilabs/token-list");
```

## Adding a New Token to the List

To add a new token to the list just follow [this guide](./docs/add-new-token.md)

## Local Setup

This repository uses [pnpm](https://pnpm.io) as the package manager. Enable [Corepack](https://nodejs.org/api/corepack.html) to use the pinned version automatically:

```sh
corepack enable
```

To install the dependencies, run:

```sh
pnpm install
```

To run the tests, run:

```sh
pnpm test
```
