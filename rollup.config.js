import path from "path";
import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import postcss from "rollup-plugin-postcss";
import resolve from "@rollup/plugin-node-resolve";
import svgr from "@svgr/rollup";
import { terser } from "rollup-plugin-terser";
import visualizer from "rollup-plugin-visualizer";
import analyze from "rollup-plugin-analyzer";
import prefixer from "postcss-prefixer";

import pkg from "./package.json";
const pkg_name = pkg.name.replace("@", "").replace("/", "-");

const extensions = [".ts", ".tsx", ".mjs", ".js"];
// should be the same as peerDependencies.
const globals = { react: "React", "react-dom": "ReactDOM" };

function isBareModuleId(id) {
  return !id.endsWith(".css") &&!id.endsWith(".scss") && !id.startsWith(".") && !id.includes(path.join(process.cwd(), "src")) && !id.includes(path.join(process.cwd(), "assets"));
}

const basePlugins = [
  postcss({
    extract: true,
    plugins: [
      prefixer({
        prefix: "studio-widget-",
        ignore: [/^(?!\.modal).*/g],
      }),
    ],
  }),
  svgr(),
  resolve({
    extensions,
  }),
];

if (process.env.ROLLUP_ANALYZE) {
  basePlugins.push(analyze(), visualizer());
}

const cjs = [
    {
      input: "src/index.ts",
  
      output: {
        file: `cjs/${pkg_name}.js`,
        format: "cjs",
        exports: "named",
        sourcemap: true,
      },
      external: isBareModuleId,
      plugins: [
        ...basePlugins,
        babel({
          extensions,
          exclude: /node_modules/,
          sourceMaps: true,
        }),
        replace({
          "process.env.NODE_ENV": JSON.stringify("development"),
        }),
      ],
    },
    {
      input: "src/index.ts",
  
      output: {
        file: `cjs/${pkg_name}.min.js`,
        format: "cjs",
        exports: "named",
        sourcemap: true,
      },
      external: isBareModuleId,
      plugins: [
        ...basePlugins,
        babel({
          extensions,
          exclude: /node_modules/,
          sourceMaps: true,
        }),
        replace({
          "process.env.NODE_ENV": JSON.stringify("production"),
        }),
        terser(),
      ],
    },
  ];

const umd = [
  {
    input: "src/index.ts",

    output: {
      file: `umd/${pkg_name}.min.js`,
      format: "umd",
      sourcemap: true,
      name: "SemaphoreStudioWidgets",
      globals,
    },
    external: Object.keys(globals),
    plugins: [
      ...basePlugins,
      commonjs(),
      babel({
        extensions,
        exclude: /node_modules/,
        babelHelpers: 'runtime',
        sourceMaps: true,
        plugins: [["@babel/transform-runtime", { useESModules: true }]],
      }),
      replace({
        "process.env.NODE_ENV": JSON.stringify("production"),
      }),
      terser(),
    ],
  },
];

const esm = [
  {
    input: "src/index.ts",

    output: {
      file: `esm/${pkg_name}.js`,
      format: "esm",
      sourcemap: true,
    },
    external: isBareModuleId,
    plugins: [
      ...basePlugins,
      babel({
        extensions,
        exclude: /node_modules/,
        babelHelpers: 'runtime',
        sourceMaps: true,
        plugins: [["@babel/transform-runtime", { useESModules: true }]],
      }),
    ],
  },
];

let config;
switch (process.env.BUILD_ENV) {
  case "cjs":
    config = cjs;
    break;
  case "esm":
    config = esm;
    break;
  case "umd":
    config = umd;
    break;
  default:
    config = [...cjs, ...esm, ...umd];
}

export default config;
