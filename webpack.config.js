const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlInlineScriptPlugin = require("html-inline-script-webpack-plugin");

module.exports = (env, argv) => [
  // 1. Figma sandbox backend (code.ts -> code.js)
  {
    name: "code",
    mode: argv.mode,
    entry: "./src/code.ts",
    output: {
      filename: "code.js",
      path: path.resolve(__dirname, "dist"),
    },
    module: {
      rules: [{ test: /\.tsx?$/, use: "ts-loader", exclude: /node_modules/ }],
    },
    resolve: { extensions: [".ts", ".tsx", ".js"] },
  },
  // 2. React UI (bundled + inlined into a single ui.html)
  {
    name: "ui",
    mode: argv.mode,
    entry: "./src/ui/index.tsx",
    output: {
      filename: "ui.js",
      path: path.resolve(__dirname, "dist"),
    },
    module: {
      rules: [
        { test: /\.tsx?$/, use: "ts-loader", exclude: /node_modules/ },
        { test: /\.css$/, use: ["style-loader", "css-loader"] },
      ],
    },
    resolve: { extensions: [".ts", ".tsx", ".js", ".css"] },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./src/ui/template.html",
        filename: "ui.html",
        inject: "body",
        cache: false,
      }),
      new HtmlInlineScriptPlugin(),
    ],
  },
];
