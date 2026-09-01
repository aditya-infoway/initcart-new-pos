// segments/posMybranchMaster.ts
import { NavigationTree } from "@/@types/navigation";

export const posMyBranches: NavigationTree = {
  id: "posMyBranches",
  type: "item",
  path: "/mybranches",
  title: "My Branches",
  icon: "myBranches",
  franchiseOnly: true,  // ✅ Only franchise users
};