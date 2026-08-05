import { Navigate, RouteObject } from "react-router";

import AuthGuard from "@/middleware/AuthGuard";
import { DynamicLayout } from "../layouts/DynamicLayout";
import { AppLayout } from "../layouts/AppLayout";

/**
 * Protected routes — all under /pos prefix.
 */
const protectedRoutes: RouteObject = {
  id: "protected",
  path: "pos",
  Component: AuthGuard,
  children: [
    {
      path: "",
      Component: DynamicLayout,
      children: [
        {
          index: true,
          element: <Navigate to="/pos/dashboards/home" replace />,
        },

        // ── Dashboard ──────────────────────────────────────────────────
        {
          path: "dashboards",
          children: [
            { index: true, element: <Navigate to="/pos/dashboards/home" replace /> },
            {
              path: "home",
              lazy: async () => ({
                Component: (await import("@/app/pages/dashboards/home/crm-analytics")).default,
              }),
            },
          ],
        },

        // ── Master Menu ────────────────────────────────────────────────
        {
          path: "master-menu",
          children: [
            { index: true, element: <Navigate to="/pos/master-menu/account-creation" replace /> },
            {
              path: "account-creation",
              lazy: async () => ({
                Component: (await import("@/app/pages/master-menu/account-creation")).default,
              }),
            },
            {
              path: "add-items",
              children: [
                {
                  index: true,
                  lazy: async () => ({
                    Component: (await import("@/app/pages/master-menu/items")).default,
                  }),
                },
                {
                  path: "new",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/master-menu/items/item-form")).default,
                  }),
                },
                {
                  path: ":id/edit",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/master-menu/items/item-form")).default,
                  }),
                },
              ],
            },
            {
              path: "item-barcodes",
              lazy: async () => ({
                Component: (await import("@/app/pages/master-menu/item-barcodes")).default,
              }),
            },
            {
              path: "group",
              lazy: async () => ({
                Component: (await import("@/app/pages/master-menu/group")).default,
              }),
            },
            {
              path: "orders",
              lazy: async () => ({
                Component: (await import("@/app/pages/master-menu/orders")).default,
              }),
            },
            {
              path: "item-import",
              lazy: async () => ({
                Component: (await import("@/app/pages/master-menu/item-import")).default,
              }),
            },
            {
              path: "website-items",
              children: [
                {
                  index: true,
                  lazy: async () => ({
                    Component: (await import("@/app/pages/master-menu/website-items")).default,
                  }),
                },
                {
                  path: ":id",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/master-menu/website-items/detail")).default,
                  }),
                },
              ],
            },
          ],
        },

        // ── Order Management ───────────────────────────────────────────
        {
          path: "order-management",
          children: [
            { index: true, element: <Navigate to="/pos/order-management/order-items" replace /> },
            {
              path: "order-items",
              children: [
                {
                  index: true,
                  lazy: async () => ({
                    Component: (await import("@/app/pages/order-management/order-items")).default,
                  }),
                },
                {
                  path: "new",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/order-management/order-items/new-order")).default,
                  }),
                },
                {
                  path: ":id",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/order-management/order-items/detail")).default,
                  }),
                },
              ],
            },
            {
              path: "stock-verification",
              children: [
                {
                  index: true,
                  lazy: async () => ({
                    Component: (await import("@/app/pages/order-management/stock-verification")).default,
                  }),
                },
                {
                  path: ":id/verify-items",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/order-management/stock-verification/verify-items")).default,
                  }),
                },
                {
                  path: ":id",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/order-management/stock-verification/detail")).default,
                  }),
                },
              ],
            },
            {
              path: "stock-return",
              children: [
                {
                  index: true,
                  lazy: async () => ({
                    Component: (await import("@/app/pages/stock-master/stock-return")).default,
                  }),
                },
                {
                  path: "new",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/stock-master/stock-return/new-return")).default,
                  }),
                },
                {
                  path: ":id",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/stock-master/stock-return/detail")).default,
                  }),
                },
              ],
            },
          ],
        },

        // ── Reporting ──────────────────────────────────────────────────
        {
          path: "reporting",
          children: [
            { index: true, element: <Navigate to="/pos/reporting/outstanding" replace /> },
            {
              path: "outstanding",
              lazy: async () => ({
                Component: (await import("@/app/pages/reporting/outstanding")).default,
              }),
            },
            {
              path: "sales-register",
              lazy: async () => ({
                Component: (await import("@/app/pages/sales-master/sales-entry")).default,
              }),
            },
            {
              path: "sales-entry-report",
              lazy: async () => ({
                Component: (await import("@/app/pages/reporting/sales-entry-report")).default,
              }),
            },
            {
              path: "purchase-register",
              lazy: async () => ({
                Component: (await import("@/app/pages/reporting/purchase-register")).default,
              }),
            },
            {
              path: "sales-return-register",
              lazy: async () => ({
                Component: (await import("@/app/pages/reporting/sales-return-register")).default,
              }),
            },
            {
              path: "purchase-return-register",
              lazy: async () => ({
                Component: (await import("@/app/pages/reporting/purchase-return-register")).default,
              }),
            },
            {
              path: "due-payment",
              lazy: async () => ({
                Component: (await import("@/app/pages/reporting/due-payment")).default,
              }),
            },
          ],
        },

        // ── Stock Master ───────────────────────────────────────────────
        {
          path: "stock",
          children: [
            { index: true, element: <Navigate to="/pos/stock/stock-report" replace /> },
            {
              path: "stock-report",
              children: [
                {
                  index: true,
                  lazy: async () => ({
                    Component: (await import("@/app/pages/stock-master/stock-report")).default,
                  }),
                },
                {
                  path: ":variantId",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/stock-master/stock-report/detail")).default,
                  }),
                },
              ],
            },
          ],
        },

        // ── Purchase Master ────────────────────────────────────────────
        {
          path: "purchase",
          children: [
            { index: true, element: <Navigate to="/pos/purchase/purchase-entry" replace /> },
            {
              path: "purchase-entry",
              lazy: async () => ({
                Component: (await import("@/app/pages/purchase-master/purchase-entry")).default,
              }),
            },
            {
              path: "purchase-entry/new",
              lazy: async () => ({
                Component: (await import("@/app/pages/purchase-master/purchase-entry/new-purchase")).default,
              }),
            },
            {
              path: "purchase-return",
              children: [
                {
                  index: true,
                  lazy: async () => ({
                    Component: (await import("@/app/pages/purchase-master/purchase-return")).default,
                  }),
                },
                {
                  path: "new",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/purchase-master/purchase-return/new-return")).default,
                  }),
                },
              ],
            },
          ],
        },

        // ── Sales Master ───────────────────────────────────────────────
        {
          path: "sales",
          children: [
            { index: true, element: <Navigate to="/pos/sales/sales-entry-report" replace /> },
            {
              path: "sales-entry-report",
              children: [
                {
                  index: true,
                  lazy: async () => ({
                    Component: (await import("@/app/pages/sales-master/sales-entry")).default,
                  }),
                },
                {
                  path: "new",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/sales-master/sales-entry/new-sale")).default,
                  }),
                },
              ],
            },
          ],
        },

        // ── Accounting ─────────────────────────────────────────────────
        {
          path: "accounting",
          children: [
            { index: true, element: <Navigate to="/pos/accounting/bank-payment" replace /> },
            {
              path: "bank-payment",
              lazy: async () => ({
                Component: (await import("@/app/pages/accounting/bank-payment")).default,
              }),
            },
            {
              path: "bank-receipt",
              lazy: async () => ({
                Component: (await import("@/app/pages/accounting/bank-receipt")).default,
              }),
            },
            {
              path: "cash-payment",
              lazy: async () => ({
                Component: (await import("@/app/pages/accounting/cash-payment")).default,
              }),
            },
            {
              path: "cash-receipt",
              lazy: async () => ({
                Component: (await import("@/app/pages/accounting/cash-receipt")).default,
              }),
            },
            {
              path: "contra",
              lazy: async () => ({
                Component: (await import("@/app/pages/accounting/contra")).default,
              }),
            },
            {
              path: "journal-entries",
              lazy: async () => ({
                Component: (await import("@/app/pages/accounting/journal-entries")).default,
              }),
            },
            {
              path: "sales-profit-report",
              lazy: async () => ({
                Component: (await import("@/app/pages/accounting/sales-profit-report")).default,
              }),
            },
          ],
        },

        // ── Transaction Master ─────────────────────────────────────────
        {
          path: "transaction",
          children: [
            { index: true, element: <Navigate to="/pos/transaction/ledger-report" replace /> },
            {
              path: "day-book",
              lazy: async () => ({
                Component: (await import("@/app/pages/accounting/day-book")).default,
              }),
            },
            {
              path: "cash-book",
              lazy: async () => ({
                Component: (await import("@/app/pages/transaction-master/cash-book")).default,
              }),
            },
            {
              path: "bank-book",
              lazy: async () => ({
                Component: (await import("@/app/pages/transaction-master/bank-book")).default,
              }),
            },
            {
              path: "ledger-report",
              children: [
                {
                  index: true,
                  lazy: async () => ({
                    Component: (await import("@/app/pages/transaction-master/ledger-report")).default,
                  }),
                },
                {
                  path: ":id",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/transaction-master/ledger-report/detail")).default,
                  }),
                },
              ],
            },
          ],
        },

        // ── Settings ───────────────────────────────────────────────────
        {
          path: "settings",
          Component: AppLayout,
          lazy: async () => ({
            Component: (await import("@/app/pages/settings/Layout")).default,
          }),
          children: [
            { index: true, element: <Navigate to="/pos/settings/profile" replace /> },
            {
              path: "profile",
              lazy: async () => ({
                Component: (await import("@/app/pages/settings/sections/AdminProfile")).default,
              }),
            },
            {
              path: "general",
              lazy: async () => ({
                Component: (await import("@/app/pages/settings/sections/General")).default,
              }),
            },
            {
              path: "appearance",
              lazy: async () => ({
                Component: (await import("@/app/pages/settings/sections/Appearance")).default,
              }),
            },
          ],
        },
      ],
    },
  ],
};

export { protectedRoutes };
