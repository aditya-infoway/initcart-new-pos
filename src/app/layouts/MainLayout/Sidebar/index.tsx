// Import Dependencies
import { useMemo, useState } from "react";
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
 * or ANY descendant child path. This is needed because group segments
 * (e.g. groupMLM) contain children under multiple base paths
 * (e.g. /agents-management/* AND /commissions-mlm/*).
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

  // ✅ Har render pe fresh compute — role-based filtering ab stale nahi hoga
  const navigation = useMemo(() => getNavigation(), []);

  const initialSegment = useMemo(
    () => navigation.find((item) => isSegmentActive(item, pathname)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [activeSegmentPath, setActiveSegmentPath] = useState<SegmentPath>(
    initialSegment?.path,
  );

  const currentSegment = useMemo(() => {
    return navigation.find((item) => item.path === activeSegmentPath);
  }, [navigation, activeSegmentPath]);

  useDidUpdate(() => {
    const activePath = findActiveSegmentPath(navigation, pathname);
    // Only update when a definitive match is found.
    // If no match (e.g. transition to a sub-route not yet indexed),
    // keep the current segment so the panel stays open.
    if (activePath !== undefined) {
      setActiveSegmentPath(activePath);
    }
  }, [pathname]);

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