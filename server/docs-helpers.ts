/*
 * Bunch of helper functions to help with docs generation.
 */

import type { VFile } from "vfile";

import { resolve } from "path";
import { loadConfig as loadDocsConfig } from "./config-docs";
import { loadConfig as loadSiteConfig } from "./config-site";
import type {
  NavigationItem,
  NavigationCategory,
} from "layouts/DocsPage/types";

const { branches, versions, latest } = loadSiteConfig();
const NEXT_PUBLIC_GITHUB_DOCS = process.env.NEXT_PUBLIC_GITHUB_DOCS;

export const getVersion = (filepath: string) => {
  const result = /content\/([^/]+)\/docs\//.exec(filepath);
  return result ? result[1] : "";
};

const findNavItem = (
  nav: NavigationCategory[] | NavigationItem[],
  pagePath: string
): NavigationItem | void => {
  for (const navCategory of nav) {
    if ("slug" in navCategory && navCategory.slug === pagePath) {
      return navCategory;
    }

    if (navCategory.entries) {
      const item = findNavItem(navCategory.entries, pagePath);

      if (item) return item;
    }
  }

  return undefined;
};

/*
 * Used by some remark plugins to resolve paths to assets based on the
 * current docs folders. E. g. remark-includes.
 */

export const getVersionRootPath = (filepath: string) => {
  const version = getVersion(filepath);

  if (version) {
    return resolve(`content/${version}`);
  } else {
    // CI task for linting stored files in the root of the content folder
    return resolve("content");
  }
};

/*
 * Generates link to use in "Improve" button on the docs pages.
 */

export const getGithubURL = (filepath: string) => {
  const current = getVersion(filepath);
  const root = getVersionRootPath(filepath);
  const ghIssuePath = `${NEXT_PUBLIC_GITHUB_DOCS}/issues/new?labels=documentation&template=documentation.md`;

  return branches[current]
    ? `${ghIssuePath}&title=[v.${current}]%20${filepath.replace(root, "")}`
    : ghIssuePath;
};

/*
 * Generates props for docs page, based on the page location in the FS.
 */

export const getPageMeta = (vfile: VFile) => {
  const current = getVersion(vfile.path);
  const { navigation } = loadDocsConfig(current);
  const githubUrl = getGithubURL(vfile.path);
  let pagePath = vfile.path.split("pages")[1];
  let scopes: string | string[] = "all";

  if (pagePath.includes(".mdx")) {
    pagePath = pagePath.replace(".mdx", "/");
  }

  const navigationItem = findNavItem(navigation, pagePath);

  if (navigationItem && navigationItem.forScopes) {
    if (
      typeof navigationItem.forScopes === "string" &&
      navigationItem.forScopes.includes(",")
    ) {
      scopes = navigationItem.forScopes.split(",").map((scope) => scope.trim());
    }

    scopes = navigationItem.forScopes;
  }

  return {
    navigation,
    githubUrl,
    versions: {
      current,
      latest,
      available: versions,
    },
    scopes,
  };
};
