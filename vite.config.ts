import path, { basename } from "node:path";
import { createRequire } from "node:module";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { globbySync } from "globby";
import { babel } from "@rollup/plugin-babel";
import react from '@vitejs/plugin-react'

const require = createRequire(import.meta.url);
const manifest = require("./package.json");

let entryFiles = globbySync(["src/**/*.ts"], { ignore: ["**/*.d.ts"] });

let entries: Record<string, string> = {};

for (let entry of entryFiles) {
  let name = basename(entry);
  entries[name] = entry;
}

export default defineConfig({
  // esbuild in vite does not support decorators
  // https://github.com/evanw/esbuild/issues/104
  test: {
    // 👋 add the line below to add jsdom to vite
    environment: 'jsdom',
  },
  esbuild: false,
  build: {
    outDir: "dist",
    // These targets are not "support".
    // A consuming app or library should compile further if they need to support
    // old browsers.
    target: ["esnext", "firefox121"],
    // In case folks debug without sourcemaps
    //
    // TODO: do a dual build, split for development + production
    // where production is optimized for CDN loading via
    // https://limber.glimdown.com
    minify: false,
    sourcemap: true,
    rollupOptions: {
      output: {
        dir: "dist",
        experimentalMinChunkSize: 0,
        format: "es",
        hoistTransitiveImports: false,
        sourcemap: true,
        entryFileNames: (entry) => {
          const { name, facadeModuleId } = entry;
          const fileName = `${name}.js`;
          if (!facadeModuleId) {
            return fileName;
          }
          const relativeDir = path.relative(
            path.resolve(__dirname, "src"),
            path.dirname(facadeModuleId),
          );
          return path.join(relativeDir, fileName);
        },
      },
      external: [
        ...Object.keys(manifest.dependencies || {}),
        ...Object.keys(manifest.peerDependencies || {}),
      ],
    },
    lib: {
      entry: entries,
      name: "signal-utils",
      formats: ["es"],
    },
  },
  plugins: [
    babel({
      babelHelpers: "inline",
      extensions: [".js", ".ts"],
    }),
    dts({
      // This can generate duplicate types in the d.ts files
      // rollupTypes: true,
      outDir: "declarations",
      // ignore tests
      include: ["src"],
    }),
    react()
  ],
});
