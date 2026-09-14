//navigation/segments/posDashboard.ts
import { NavigationTree } from "@/@types/navigation";

export const posDashboard: NavigationTree = {
  id: "posDashboard",
  type: "item",
  path: "/dashboards/home",
  title: "Dashboard",
  icon: "posDashboard",
  alwaysVisible: true, 
  // No flags — sabko dikhega
};