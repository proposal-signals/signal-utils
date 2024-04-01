import { defineConfig } from 'vite'
import { babel } from "@rollup/plugin-babel";

export default defineConfig({
  // esbuild in vite does not support decorators
  // https://github.com/evanw/esbuild/issues/104
  esbuild: false,
  plugins: [
    babel({
      babelHelpers: "inline",
      extensions: [".js", ".ts"],
    }),
  ]
})
