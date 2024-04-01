import { resolve, basename } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { globbySync } from 'globby'

import { babel } from "@rollup/plugin-babel";

import { Addon } from "@embroider/addon-dev/rollup";

let entryFiles = globbySync('src/*.ts');

let entries = {}; 

for (let entry of entryFiles) {
  let name = basename(entry)
  entries[name] = entry; 
}

const lib = new Addon();

export default defineConfig({
  // esbuild in vite does not support decorators
  // https://github.com/evanw/esbuild/issues/104
  esbuild: false,
  build: {
    outDir: 'dist',
    // These targets are not "support".
    // A consuming app or library should compile further if they need to support
    // old browsers.
    target: ['esnext', 'firefox121'],
    // In case folks debug without sourcemaps
    //
    // TODO: do a dual build, split for development + production
    // where production is optimized for CDN loading via
    // https://limber.glimdown.com
    minify: false,
    sourcemap: true,
    rollupOptions: {
      output: lib.output(),
    },
    lib: {
      entry: entries,
      name: 'signal-utils',
      formats: ['es'],
    }
  },
  plugins: [
    babel({
      babelHelpers: "inline",
      extensions: [".js", ".ts"],
    }),
    dts({
      rollupTypes: true,
      outDir: 'declarations',
    })
  ]
})
