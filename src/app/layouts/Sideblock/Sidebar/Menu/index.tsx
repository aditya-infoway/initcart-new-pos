// Import Dependencies
import { useLocation } from "react-router";
import { useLayoutEffect, useRef, useState } from "react";
import SimpleBar from "simplebar-react";

// Local Imports
import { useDidUpdate } from "@/hooks";
import { getNavigation } from "@/app/navigation";
import { Accordion } from "@/components/ui";
import { isRouteActive } from "@/utils/isRouteActive";
import { Group } from "./Group";
import { CollapsibleItem } from "./Group/CollapsibleItem";
import { MenuItem } from "./Group/MenuItem";
import { LogoutMenuItem } from "./LogoutMenuItem";

// ----------------------------------------------------------------------

function getActiveCollapsiblePath(nav: ReturnType<typeof getNavigation>, pathname: string) {
  return nav.find(
    (item) =>
      item.type === "collapse" &&
      item.childs?.some(
        (child) => child.path && isRouteActive(child.path, pathname),
      ),
  )?.path;
}

export function Menu() {
  const { pathname } = useLocation();
  const ref = useRef<HTMLDivElement | null>(null);

  // Always get fresh navigation (role-based filtering reads localStorage)
  const nav = getNavigation();
  const mainNav = nav.filter((item) => item.id !== "logout");
  const logoutNav = nav.filter((item) => item.id === "logout");

  const activeCollapsible = getActiveCollapsiblePath(mainNav, pathname);

  const [expanded, setExpanded] = useState<string | null>(
    activeCollapsible || null,
  );

  useDidUpdate(() => {
    const nextExpanded = activeCollapsible;
    if (nextExpanded !== expanded) {
      setExpanded(nextExpanded || null);
    }
  }, [activeCollapsible]);

  useLayoutEffect(() => {
    const activeItem = ref.current?.querySelector("[data-menu-active=true]");
    activeItem?.scrollIntoView({ block: "center" });
  }, []);

  return (
    <SimpleBar
      scrollableNodeProps={{ ref }}
      className="h-full overflow-x-hidden pb-6"
    >
      <Accordion value={expanded} onChange={setExpanded} className="space-y-1">
        {mainNav.map((nav) => {
          if (nav.type === "collapse" && nav.childs && nav.childs.length > 0) {
            return <CollapsibleItem key={nav.id} data={nav} />;
          }

          if (nav.childs && nav.childs.length > 0) {
            return <Group key={nav.id} data={nav} />;
          }

          return <MenuItem key={nav.id} data={nav} />;
        })}
      </Accordion>
    </SimpleBar>
  );
}

// Pinned logout — rendered separately in Sidebar at the bottom
export function LogoutMenu() {
  const nav = getNavigation();
  const logoutNav = nav.filter((item) => item.id === "logout");
  return (
    <div className="px-2 py-2">
      {logoutNav.map((nav) => (
        <LogoutMenuItem key={nav.id} data={nav} />
      ))}
    </div>
  );
}