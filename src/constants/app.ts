export const APP_NAME = "InitCart POS";
export const APP_KEY = "tailux";
export const APP_LOGO = "/images/initcart/fav.png";
export const APP_FAVICON = "/images/initcart/fav.png";

// Redirect Paths
export const REDIRECT_URL_KEY = "redirect";
export const HOME_PATH = "/pos/dashboards/home";
export const GHOST_ENTRY_PATH = "/pos/login";
export const SELECT_COMPANY_PATH = "/pos/select-company";

// Navigation Types
export type NavigationType = "root" | "group" | "collapse" | "item" | "divider";

export const COLORS = [
  "neutral",
  "primary",
  "secondary",
  "info",
  "success",
  "warning",
  "error",
] as const;

export type ColorType = (typeof COLORS)[number];
