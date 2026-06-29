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

const hemiExplorerUrl = (chainId, address) =>
  `https://${chainId === 43111 ? "explorer.hemi.xyz" : "testnet.explorer.hemi.xyz"}/token/${address}`;

const etherscanUrl = (chainId, address) =>
  `https://${chainId === 1 ? "etherscan.io" : "sepolia.etherscan.io"}/token/${address}`;

const copyButton = (address) => `
<button aria-label="Copy address" class="copy-button group relative align-middle text-neutral-400 hover:text-neutral-700" data-address="${address}" type="button">
  <span class="pointer-events-none absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-white group-hover:block">Copy</span>
  <svg class="copy-icon size-4" fill="currentColor" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.6 2.802a1.2 1.2 0 0 1 1.2-1.2h3.103a1.2 1.2 0 0 1 .848.352L13.25 4.45a1.2 1.2 0 0 1 .351.85v4.702a1.2 1.2 0 0 1-1.2 1.2h-.8V8.498a2.4 2.4 0 0 0-.703-1.696L8.4 4.305a2.4 2.4 0 0 0-1.697-.703H5.6v-.8Z" />
    <path d="M3.6 4.8A1.2 1.2 0 0 0 2.4 6v7.2a1.2 1.2 0 0 0 1.2 1.2h5.6a1.2 1.2 0 0 0 1.2-1.2V8.499a1.2 1.2 0 0 0-.352-.848L7.552 5.152a1.2 1.2 0 0 0-.85-.351H3.6Z" />
  </svg>
  <svg class="check-icon hidden size-4 text-green-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</button>
`;

function addressLink(chainId, address) {
  const url = [43111, 743111].includes(chainId)
    ? hemiExplorerUrl(chainId, address)
    : etherscanUrl(chainId, address);
  return `
<span class="inline-flex items-center gap-1.5">
  <a class="font-mono text-neutral-500 hover:text-neutral-700" href="${url}" rel="noopener noreferrer" target="_blank" title="${address}">
    ${shortenAddress(address)}
  </a>
  ${copyButton(address)}
</span>
`;
}

function row({ address, chainId, extensions, logoURI, name, symbol }) {
  const chainName = chainId === 43111 ? "Hemi" : "Hemi Sepolia";
  const l1ChainId = chainId === 43111 ? 1 : 11155111;
  const l1Address = extensions?.bridgeInfo?.[l1ChainId]?.tokenAddress || "";
  const rowId = `${name}${symbol}${address}${l1Address}`.toLowerCase();
  return `
<tr class="h-12 border-y" id="${rowId}">
  <td class="px-4 py-3">
    ${logo({ logoURI, name })}
    <span class="hidden lg:inline overflow-hidden whitespace-nowrap ml-2 text-ellipsis">${name}</span>
  </td>
  <td class="overflow-hidden whitespace-nowrap px-4 py-3 text-ellipsis">${symbol}</td>
  <td class="overflow-hidden whitespace-nowrap px-4 py-3 text-ellipsis">${chainName}</td>
  <td class="px-4 py-3">
    ${addressLink(chainId, address)}
  </td>
  <td class="hidden lg:table-cell px-4 py-3">
    ${l1Address ? addressLink(l1ChainId, l1Address) : "-"}
  </td>
</tr>
`;
}

const page = ({ name, tokens, version }) => `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="description" content="List of tokens on the Hemi networks.">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${name}</title>

  <link rel="icon" type="image/x-icon" href="assets/favicon.ico" />
  <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=JetBrains+Mono:wght@400&display=swap" as="style" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet" />

  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            orange: {
                600: '#FF4600',
              },
            },
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
      <a class="ml-3 px-4 py-2 rounded-lg text-white bg-orange-600 shadow-md" href="https://app.hemi.xyz">Launch Portal</a>
    </span>
  </header>
  <section class="flex flex-col items-center">
    <img class="my-12" src="assets/hemi-logo-orange.svg" height="131" width="132" alt="Hemi" />
    <h1 class="max-w-xl text-5xl text-center font-semibold">Explore tokens on the Hemi networks</h1>
    <input class="border rounded-xl mt-8 px-4 py-2" id="searchInput" placeholder="Search"/>
    <table class="max-w-full overflow-hidden mt-8 rounded-xl shadow-md">
      <thead class="hidden lg:table-header-group h-11 border-b bg-zinc-100">
        <tr>
          <th class="px-4 py-3 text-left font-normal">Name</th>
          <th class="px-4 py-3 text-left font-normal">Symbol</th>
          <th class="px-4 py-3 text-left font-normal">Chain</th>
          <th class="px-4 py-3 text-left font-normal">Address</th>
          <th class="px-4 py-3 text-left font-normal">L1 Address</th>
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

  <script>
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', function (event) {
      const query = event.target.value.toLowerCase();
      const rows = document.querySelectorAll('tbody tr');
      rows.forEach(function (row) {
        row.style.display = row.id.includes(query) ? '' : 'none';
      });
    });

    document.querySelectorAll('.copy-button').forEach(function (button) {
      button.addEventListener('click', function () {
        navigator.clipboard.writeText(button.getAttribute('data-address')).then(function () {
          const copyIcon = button.querySelector('.copy-icon');
          const checkIcon = button.querySelector('.check-icon');
          copyIcon.classList.add('hidden');
          checkIcon.classList.remove('hidden');
          setTimeout(function () {
            copyIcon.classList.remove('hidden');
            checkIcon.classList.add('hidden');
          }, 1500);
        });
      });
    });
  </script>
</body>

</html>
`;

fs.writeFileSync("public/index.html", page(tokenList));
