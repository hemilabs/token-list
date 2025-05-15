import fs from "fs";

const tokenList = JSON.parse(
  fs.readFileSync("src/hemi.tokenlist.json", "utf-8"),
);

const prefix =
  "https://raw.githubusercontent.com/hemilabs/token-list/master/src/";

const toRelative = (url) =>
  url.startsWith(prefix) ? url.slice(prefix.length) : url;

const logo = ({ logoURI }) => `
<img class="inline size-4" src="${toRelative(logoURI)}" />
`;

const row = ({ name, chainId, symbol, address, logoURI }) => `
<tr>
  <td>${logo({ logoURI })}${name}</td>
  <td>${chainId === 43111 ? "Hemi" : "Hemi Sepolia"}</td>
  <td>${symbol}</td>
  <td>${address}</td>
</tr>
`;

const page = ({ name, tokens }) => `
<!DOCTYPE html>
<html lang="en">
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<head>
  <title>${name}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>

<body class="p-4">
  <table class="table-auto w-full">
    <thead>
      <tr>
        <th>Name</th>
        <th>Chain</th>
        <th>Symbol</th>
        <th>Address</th>
      </tr>
    </thead>
    <tbody>
      ${tokens.map((token) => row(token)).join("")}
    </tbody>
  </table>
</body>

</html>
`;

fs.writeFileSync("public/index.html", page(tokenList));
