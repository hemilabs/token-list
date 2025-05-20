import fs from "fs";

const [logo] = process.argv.slice(2);

const svgContent = fs.readFileSync(`src/logos/${logo}.svg`, "utf8");
const base64Match = svgContent.match(
  /xlink:href="data:image\/png;base64,([^"]+)"/,
);
if (base64Match && base64Match[1]) {
  const imageBuffer = Buffer.from(base64Match[1], "base64");
  fs.writeFileSync(`src/logos/${logo}.png`, imageBuffer);
  console.log("PNG file has been created successfully!");
} else {
  console.error("No Base64 PNG data found in the SVG file");
}
