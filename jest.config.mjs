import "process";
import * as path from "path";
import * as vm from "vm";

// Following the example here:
// https://nextjs.org/docs/testing#setting-up-jest-with-the-rust-compiler
import { default as nextJest } from "next/jest.js";
import { default as mdxConfig } from "./.build/server/mdx-config-docs.mjs";

if (typeof vm.SyntheticModule !== "function") {
  throw new Error(
    "This Jest config requires you to run Jest with NodeJS's" +
      " --experimental-vm-modules flag in order to use ECMAScript modules." +
      " Our Jest config requires ESM in order to load MDX test files. This is" +
      " because we need to support async operatiosn when processing MDX."
  );
}

let mdxDocsOptions = {};

process.env["DOCS_CONFIG_OVERRIDE_PATH"] = path.join(
  "jest-tests",
  "empty-config.json"
);

export default async function createJestConfig() {
  const createJestConfig = nextJest({
    // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
    dir: "./",
  });

  const customJestConfig = {
    moduleDirectories: ["node_modules", "<rootDir>/"],
    testEnvironment: "jest-environment-jsdom",
    // Ignore SVG resource queries in Webpack module rules. For context on
    // resource queries:
    // https://webpack.js.org/configuration/module/#ruleresourcequery This is a
    // bit of a hack. next/jest defines a moduleNameMapper that maps SVG files
    // to fileMock.js, and this applies the same mapper to SVG files with
    // resource query parameters.
    moduleNameMapper: {
      "^.*\\.svg\\?\\w+$":
        "<rootDir>/node_modules/next/dist/build/jest/__mocks__/fileMock.js",
    },
  };

  const loadConf = await createJestConfig(customJestConfig);
  const loadedConf = await loadConf();

  loadedConf.transformIgnorePatterns = [
    // MDX-JS uses ECMAScript modules, so we need to ensure that we can
    // transform the source. The default next/jest config ignores all
    // contents of node_modules, so we override that config before passing
    // it to Jest.
    //
    // Context: https://mdxjs.com/docs/troubleshooting-mdx/#esm
    "/node_modules/(?!@mdx-js)",
    // Besides '/node_modules/' this is the second default
    // transformIgnorePatterns value.
    "^.+\\.module\\.(css|sass|scss)$",
  ];

  // Get the transformer config the next/jest-generated Jest config uses for
  // JavaScript files so we can pass it to our custom MDX transformer.
  // next/jest generates this from our NextJS config, so we need to generate
  // the config before we can pass it to the transformer.
  for (const value of Object.values(loadedConf.transform)) {
    if (value.length == 2 && value[0].includes("jest-transformer.js")) {
      loadedConf.transform["^.+\\.(md|mdx)$"] = [
        "./jest-tests/mdx-transformer.mjs",
        {
          mdxOptions: mdxConfig,
          nextConfig: value[1].nextConfig,
        },
      ];
      break;
    }
  }

  loadedConf.extensionsToTreatAsEsm = [
      ".ts",
      ".tsx",
      ".jsx",
      ".mdx"
  ]

  return loadedConf;
}
