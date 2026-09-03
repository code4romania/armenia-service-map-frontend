function isPathMatch(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/');
}

export function getBestActiveHref(pathname: string, hrefs: string[]) {
  const matches = hrefs.filter((href) => isPathMatch(pathname, href));
  if (matches.length === 0) {
    return null;
  }

  matches.sort((a, b) => b.length - a.length);
  return matches[0];
}

/**
 * Like `getBestActiveHref`, but a nav item may claim extra path prefixes via
 * `matchPaths` (e.g. "User management" owns both /admin/organisations and
 * /admin/users). Returns the owning item's `href`, or null when nothing matches.
 */
export function getActiveNavHref(
  pathname: string,
  items: Array<{ href: string; matchPaths?: string[] }>,
) {
  const ownerByPath = new Map<string, string>();
  for (const item of items) {
    ownerByPath.set(item.href, item.href);
    for (const path of item.matchPaths ?? []) ownerByPath.set(path, item.href);
  }
  const best = getBestActiveHref(pathname, Array.from(ownerByPath.keys()));
  return best ? (ownerByPath.get(best) ?? null) : null;
}
