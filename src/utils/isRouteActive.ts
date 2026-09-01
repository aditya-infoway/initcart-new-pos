import { matchPath } from "react-router";

/**
 * Checks if the given path matches the current pathname.
 *
 * @param The path to check against the current location.
 * @param The current path of the browser.
 * @returns Returns `true` if the path matches the current pathname, otherwise `false`.
 */
export function isRouteActive(
  path: string | undefined,
  pathname: string,
): boolean {
  if (!path) return false;
  // Use exact match (end: true) to prevent "/" and short paths
  // from matching every URL via prefix matching.
  return !!matchPath({ path, end: true }, pathname);
}
