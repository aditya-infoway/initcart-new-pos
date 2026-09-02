// Import Dependencies
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";

// Local Imports
import { useBreakpointsContext } from "@/app/contexts/breakpoint/context";
import { useSidebarContext } from "@/app/contexts/sidebar/context";
import { getNavigation } from "@/app/navigation";
import { useDidUpdate } from "@/hooks";
import { isRouteActive } from "@/utils/isRouteActive";
import { MainPanel } from "./MainPanel";
import { PrimePanel } from "./PrimePanel";
import { NavigationTree } from "@/@types/navigation";

// ----------------------------------------------------------------------

export type SegmentPath = string | undefined;

/**
 * Recursively checks whether `pathname` matches the item itself
 * or ANY descendant child path.
 */
function isSegmentActive(item: NavigationTree, pathname: string): boolean {
  if (isRouteActive(item.path, pathname)) return true;
  if (item.childs) {
    return item.childs.some((child) => isSegmentActive(child, pathname));
  }
  return false;
}

function findActiveSegmentPath(nav: NavigationTree[], pathname: string): SegmentPath {
  return nav.find((item) => isSegmentActive(item, pathname))?.path;
}

export function Sidebar() {
  const { pathname } = useLocation();
  const { name, lgAndDown } = useBreakpointsContext();
  const { isExpanded, close } = useSidebarContext();

  const navigation = useMemo(() => getNavigation(), []);

  // Initialise from a lazy state function so it runs once with the correct pathname
  const [activeSegmentPath, setActiveSegmentPath] = useState<SegmentPath>(
    () => findActiveSegmentPath(navigation, pathname),
  );

  const currentSegment = useMemo(() => {
    return navigation.find((item) => item.path === activeSegmentPath);
  }, [navigation, activeSegmentPath]);

  // Keep active segment in sync on every navigation (including initial mount)
  useEffect(() => {
    const activePath = findActiveSegmentPath(navigation, pathname);
    if (activePath !== undefined) {
      setActiveSegmentPath(activePath);
    }
  }, [navigation, pathname]);

  useDidUpdate(() => {
    if (lgAndDown && isExpanded) close();
  }, [name]);

  return (
    <>
      <MainPanel
        nav={navigation}
        activeSegmentPath={activeSegmentPath}
        setActiveSegmentPath={setActiveSegmentPath}
      />
      <PrimePanel
        close={close}
        currentSegment={currentSegment}
        pathname={pathname}
      />
    </>
  );
}
