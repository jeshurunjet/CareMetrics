// Rasterise the existing CareMetrics pulse mark; no generated artwork or font assets.
import { createRequire } from "node:module"
import { readFile } from "node:fs/promises"
const require = createRequire(import.meta.url)
const sharp = require(
  require.resolve("sharp", { paths: [require.resolve("next")] }),
)
const source = await readFile("public/icons/caremetrics.svg")
for (const size of [192, 512]) {
  for (const variant of ["", "maskable-"]) {
    await sharp(source)
      .resize(size, size)
      .png()
      .toFile(`public/icons/caremetrics-${variant}${size}.png`)
  }
}
