// Following the example here:
// https://nextjs.org/docs/testing#setting-up-jest-with-the-rust-compiler
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

const customJestConfig = {
  moduleDirectories: ["node_modules", "<rootDir>/"],
  testEnvironment: "jest-environment-jsdom",
  // Ignore resource queries in Webpack module rules. For context:
  // https://webpack.js.org/configuration/module/#ruleresourcequery
  moduleNameMapper: {
    "(^.*\\.\\w{3})\\?\\w+$": "$1",
  },
  transform: {
    "\\.svg$": [
      "babel-jest",
      {
        presets: [
          "@svgr/babel-preset",
          "next/babel"
        ]
      },
    ],
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
