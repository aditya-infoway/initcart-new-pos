import { NavigationTree } from "@/@types/navigation";

export const settings: NavigationTree = {
  id: "settings",
  type: "collapse",
  path: "/settings",
  title: "Settings",
  icon: "settings",
  childs: [
    {
      id: "settings.profile",
      type: "item",
      path: "/settings/profile",
      title: "Profile",
      icon: "settings.profile",
    },
    {
      id: "settings.general",
      type: "item",
      path: "/settings/general",
      title: "General",
      icon: "settings.general",
    },
    {
      id: "settings.appearance",
      type: "item",
      path: "/settings/appearance",
      title: "Appearance",
      icon: "settings.appearance",
    },
  ],
};
