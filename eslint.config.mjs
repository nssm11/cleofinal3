import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

/**
 * Every raster image in the product would be a third-party asset, and there
 * are none by design: the archive's artwork is locally generated SVG and any
 * `<img>` is an escape hatch that must stay visible in review. The rule stays
 * on everywhere.
 */
export default defineConfig([
  ...nextCoreWebVitals,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
