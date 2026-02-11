import { Resvg } from "@resvg/resvg-js";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const WIDTH = 1200;
const HEIGHT = 630;

// Ethereum diamond paths scaled and centered
// Original viewBox: 0 0 256 417, we scale to fit ~120px wide
const ethScale = 0.3;
const ethX = 100;
const ethY = 170;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#1a1a2e"/>

  <!-- Subtle gradient overlay -->
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a1a2e"/>
      <stop offset="100%" stop-color="#16213e"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>

  <!-- Ethereum diamond -->
  <g transform="translate(${ethX}, ${ethY}) scale(${ethScale})">
    <polygon fill="#627eea" points="127.96 0 125.17 9.5 125.17 285.17 127.96 287.96 255.92 212.32"/>
    <polygon fill="#8ea3f0" points="127.96 0 0 212.32 127.96 287.96 127.96 154.16"/>
    <polygon fill="#5571e4" points="127.96 312.19 126.39 314.1 126.39 412.51 127.96 417.04 256 236.59"/>
    <polygon fill="#8ea3f0" points="127.96 417.04 127.96 312.19 0 236.59"/>
    <polygon fill="#3b5bd9" points="127.96 287.96 255.92 212.32 127.96 154.16"/>
    <polygon fill="#627eea" points="0 212.32 127.96 287.96 127.96 154.16"/>
  </g>

  <!-- Title -->
  <text x="220" y="290" font-family="Arial, Helvetica, sans-serif" font-size="56" font-weight="bold" fill="#e0e0e0">
    Chain Bias Dashboard
  </text>

  <!-- Tagline -->
  <text x="220" y="345" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#a0a0b8">
    Which blockchain do AI models default to?
  </text>

  <!-- Bottom accent line -->
  <rect x="0" y="610" width="${WIDTH}" height="20" fill="#627eea" opacity="0.6"/>
</svg>`;

const resvg = new Resvg(svg, {
  fitTo: { mode: "width", value: WIDTH },
});

const png = resvg.render().asPng();
const outPath = join(__dirname, "..", "public", "og-image.png");
writeFileSync(outPath, png);
console.log(`Generated ${outPath} (${png.length} bytes)`);
