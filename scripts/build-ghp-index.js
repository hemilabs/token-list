import fs from "fs";

const tokenList = JSON.parse(
  fs.readFileSync("src/hemi.tokenlist.json", "utf-8"),
);

const prefix = "https://hemilabs.github.io/token-list/";

const toRelative = (url) =>
  url.startsWith(prefix) ? url.slice(prefix.length) : url;

const logo = ({ logoURI, name }) => `
<img alt="${name} token icon" class="inline min-w-6 size-6" src="${toRelative(logoURI)}" />
`;

const shortenAddress = (address) =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

const row = ({ name, chainId, symbol, address, logoURI }) => `
<tr class="h-12 border-y">
  <td class="px-4 py-3">
    ${logo({ logoURI, name })}
    <span class="hidden lg:inline overflow-hidden whitespace-nowrap ml-2 text-ellipsis">${name}</span>
  </td>
  <td class="overflow-hidden whitespace-nowrap px-4 py-3 text-ellipsis">${symbol}</td>
  <td class="overflow-hidden whitespace-nowrap px-4 py-3 text-ellipsis">${chainId === 43111 ? "Hemi" : "Hemi Sepolia"}</td>
  <td class="px-4 py-3">
    <a class="font-mono text-neutral-500 hover:text-neutral-700" href="https://${chainId === 43111 ? "explorer" : "testnet.explorer"}.hemi.xyz/token/${address}" title="${address}">
      ${shortenAddress(address)}
    </a>
  </td>
</tr>
`;

const page = ({ name, tokens, version }) => `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="description" content="List of tokens on the Hemi networks.">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${name}</title>

  <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=JetBrains+Mono:wght@400&display=swap" as="style" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet" />

  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            mono: ['JetBrains Mono'],
            sans: ['Inter']
          }
        }
      }
    }
  </script>
</head>

<body class="bg-zinc-50 px-2 text-neutral-950">
  <header class="flex items-center justify-between max-w-5xl mx-auto py-2.5 border-b border-gray-200">
    <a href="https://hemi.xyz">
      <img src="assets/hemi-logo.svg" alt="Hemi" height="28" width="78" />
    </a>
    <span>
      <a class="ml-3 px-4 py-2 rounded-lg border-t border-gray-200 shadow-md" href="https://docs.hemi.xyz">Read the docs</a>
      <a class="ml-3 px-4 py-2 rounded-lg text-white bg-orange-500 shadow-md" href="https://app.hemi.xyz">Launch Portal</a>
    </span>
  </header>
  <section class="flex flex-col items-center">
    <img class="my-12" src="assets/hemi-logo-orange.svg" height="131" width="132" alt="Hemi" />
    <h1 class="max-w-xl text-5xl text-center font-semibold">Explore tokens on the Hemi networks</h1>
    <table class="max-w-full overflow-hidden mt-14 rounded-xl shadow-md">
      <thead class="hidden lg:table-header-group h-11 border-b bg-zinc-100">
        <tr>
          <th class="px-4 py-3 text-left font-normal">Name</th>
          <th class="px-4 py-3 text-left font-normal">Symbol</th>
          <th class="px-4 py-3 text-left font-normal">Chain</th>
          <th class="px-4 py-3 text-left font-normal">Address</th>
        </tr>
      </thead>
      <tbody>
        ${tokens
          .sort((a, b) => a.name.localeCompare(b.name))
          .sort((a, b) => a.chainId - b.chainId)
          .map((token) => row(token))
          .join("")}
      </tbody>
    </table>
  </section>
  <footer class="max-w-5xl mx-auto text-center text-sm text-neutral-500 py-2.5">
    <p>
      <a class="hover:text-neutral-700" href="https://github.com/hemilabs/token-list/releases/tag/v${version.major}.${version.minor}.${version.patch}">
        Token list v${version.major}.${version.minor}.${version.patch}
      </a>
    </p>
  </footer>
</body>

</html>
`;

fs.writeFileSync("public/index.html", page(tokenList));
