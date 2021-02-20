import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import webWorkerLoader from "rollup-plugin-web-worker-loader";

export default {
  input: "src/index.js",
  output: {
    file: "public/bundle.js",
    format: "iife",
    sourcemap: true,
  },
  plugins: [resolve(), commonjs(), webWorkerLoader()],
};
