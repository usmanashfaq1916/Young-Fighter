/* eslint-disable @typescript-eslint/no-require-imports */
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

async function main() {
  const svgPath = path.join(process.cwd(), "public", "YFA_logo.svg");
  const outDir = path.join(process.cwd(), "public");
  const svg = fs.readFileSync(svgPath);

  const sizes = [192, 512];
  for (const size of sizes) {
    await sharp(svg)
      .resize(size, size, { fit: "contain", background: { r: 11, g: 31, b: 58, alpha: 1 } })
      .png()
      .toFile(path.join(outDir, `icon-${size}.png`));
    await sharp(svg)
      .resize(size, size, { fit: "cover" })
      .png()
      .toFile(path.join(outDir, `icon-maskable-${size}.png`));
  }
  await sharp(svg)
    .resize(64, 64, { fit: "contain", background: { r: 11, g: 31, b: 58, alpha: 1 } })
    .png()
    .toFile(path.join(outDir, "favicon.png"));
  console.log("Icons generated.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
