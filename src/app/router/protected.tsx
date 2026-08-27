import { Navigate, RouteObject } from "react-router";

import AuthGuard from "@/middleware/AuthGuard";
import { DynamicLayout } from "../layouts/DynamicLayout";
import { AppLayout } from "../layouts/AppLayout";

/**
 * Protected routes — all under  prefix.
 */
const protectedRoutes: RouteObject = {
  id: "protected",
  path: "",
  Component: AuthGuard,
  children: [
    {
      path: "",
      Component: DynamicLayout,
      children: [
        {
          index: true,
          element: <Navigate to="/dashboards/home" replace />,
        },

        // ── Dashboard ──────────────────────────────────────────────────
        {
          path: "dashboards",
          children: [
            { index: true, element: <Navigate to="/dashboards/home" replace /> },
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
            { index: true, element: <Navigate to="/master-menu/account-creation" replace /> },
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
              path: "branch-master",
              lazy: async () => ({
                Component: (await import("@/app/pages/master-menu/branch-master/index")).default,
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
            { index: true, element: <Navigate to="/order-management/order-items" replace /> },
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
            {
              path: "stock-transfer",
              children: [
                {
                  index: true,
                  lazy: async () => ({
                    Component: (await import("@/app/pages/order-management/stock-transfer")).default,
                  }),
                },
                {
                  path: "new",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/order-management/stock-transfer/new")).default,
                  }),
                },
                {
                  path: ":id",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/order-management/stock-transfer/detail")).default,
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
            { index: true, element: <Navigate to="/reporting/outstanding" replace /> },
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
            { index: true, element: <Navigate to="/stock/stock-report" replace /> },
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
            {
              path: "stock-transfer",
              children: [
                {
                  index: true,
                  lazy: async () => ({
                    Component: (await import("@/app/pages/order-management/stock-transfer")).default,
                  }),
                },
                {
                  path: "new",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/order-management/stock-transfer/new")).default,
                  }),
                },
                {
                  path: ":id",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/order-management/stock-transfer/detail")).default,
                  }),
                },
              ],
            },
          ],
        },

        // ── B2B Inventory ───────────────────────────────────────────────
        {
          path: "b2b-inventory",
          children: [
            { index: true, element: <Navigate to="/b2b-inventory/stock-return" replace /> },
            {
              path: "stock-return",
              children: [
                {
                  index: true,
                  lazy: async () => ({
                    Component: (await import("@/app/pages/b2b-inventory/stock-return")).default,
                  }),
                },
                {
                  path: "create",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/b2b-inventory/stock-return/create")).default,
                  }),
                },
                {
                  path: "detail/:id",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/b2b-inventory/stock-return/detail")).default,
                  }),
                },
              ],
            },
            {
              path: "stock-transfer",
              children: [
                { index: true, element: <Navigate to="/b2b-inventory/stock-transfer/send-order" replace /> },
                {
                  path: "send-order",
                  children: [
                    {
                      index: true,
                      lazy: async () => ({
                        Component: (await import("@/app/pages/b2b-inventory/stock-transfer/send-order")).default,
                      }),
                    },
                    {
                      path: "create",
                      lazy: async () => ({
                        Component: (await import("@/app/pages/b2b-inventory/stock-transfer/send-order/create")).default,
                      }),
                    },
                    {
                      path: "detail/:id",
                      lazy: async () => ({
                        Component: (await import("@/app/pages/b2b-inventory/stock-transfer/send-order/detail")).default,
                      }),
                    },
                  ],
                },
                {
                  path: "received-orders",
                  children: [
                    {
                      index: true,
                      lazy: async () => ({
                        Component: (await import("@/app/pages/b2b-inventory/stock-transfer/received-orders/index")).default,
                      }),
                    },
                    {
                      path: "detail/:id",
                      lazy: async () => ({
                        Component: (await import("@/app/pages/b2b-inventory/stock-transfer/received-orders/detail")).default,
                      }),
                    },
                  ],
                },
              ],
            },

            // ── NEW: Stock Return Management ──────────────────────────────
            {
              path: "stock-return-management",
              lazy: async () => ({
                Component: (await import("@/app/pages/b2b-inventory/stock-return-management/index")).default,
              }),
            },

            // ── NEW: B2B Stock Return Management ──────────────────────────
            {
              path: "b2b-stock-return-management",
              children: [
                {
                  index: true,
                  lazy: async () => ({
                    Component: (await import("@/app/pages/b2b-inventory/b2b-stock-return-management/index")).default,
                  }),
                },
                // {
                //   path: "create",
                //   lazy: async () => ({
                //     Component: (await import("@/app/pages/b2b-inventory/b2b-stock-return-management/create")).default,
                //   }),
                // },
              ],
            },

            // ── NEW: SchemeOffer ──────────────────────────────────────────
// ✅ SAHI - my-offers scheme-offer ke andar
{
  path: "scheme-offer",
  children: [
    {
      index: true,
      lazy: async () => ({
        Component: (await import("@/app/pages/b2b-inventory/scheme-offer/index")).default,
      }),
    },
    {
      path: "create",
      lazy: async () => ({
        Component: (await import("@/app/pages/b2b-inventory/scheme-offer/create")).default,
      }),
    },
    {
      path: ":id/report",
      lazy: async () => ({
        Component: (await import("@/app/pages/b2b-inventory/scheme-offer/report")).default,
      }),
    },
    // ✅ my-offers ANDAR hai
    {
      path: "my-offers",
      children: [
        {
          index: true,
          lazy: async () => ({
            Component: (await import("@/app/pages/b2b-inventory/scheme-offer/my-offers/index")).default,
          }),
        },
        {
          path: ":id/report",
          lazy: async () => ({
            Component: (await import("@/app/pages/b2b-inventory/scheme-offer/my-offers/report")).default,
          }),
        },
      ],
    },
  ],
},
          ],
        },

        // ── Purchase Master ────────────────────────────────────────────
        {
          path: "purchase",
          children: [
            { index: true, element: <Navigate to="/purchase/purchase-entry" replace /> },
            {
              path: "purchase-entry",
              lazy: async () => ({
                Component: (await import("@/app/pages/purchase-master/purchase-entry")).default,
              }),
            },
            {
  path: "purchase-excel-import-export",
  lazy: async () => ({
    Component: (await import("@/app/pages/purchase-master/purchase-excel-import-export/index")).default,
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
            
            {
              path: "b2b-purchase-verification",
              children: [
                {
                  index: true,
                  lazy: async () => ({
                    Component: (await import("@/app/pages/purchase-master/b2b-purchase-verification")).default,
                  }),
                },
                {
                  path: "detail/:id",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/purchase-master/b2b-purchase-verification/detail")).default,
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
            { index: true, element: <Navigate to="/sales/sales-entry-report" replace /> },
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
            {
              path: "sales-entry2",
              lazy: async () => ({
                Component: (await import("@/app/pages/sales-master/sales-entry/sales-entry-form2")).default,
              }),
            },
            {
              path: "b2b-sales",
              children: [
                {
                  index: true,
                  lazy: async () => ({
                    Component: (await import("@/app/pages/sales-master/b2b-sales/index")).default,
                  }),
                },
                {
                  path: "create",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/sales-master/b2b-sales/create")).default,
                  }),
                },
                {
                  path: "detail/:id",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/sales-master/b2b-sales/detail")).default,
                  }),
                },
              ],
            },
            {
              path: "sales-return-report",
              children: [
                {
                  index: true,
                  lazy: async () => ({
                    Component: (await import("@/app/pages/sales-master/sales-return")).default,
                  }),
                },
                {
                  path: "new",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/sales-master/sales-return/new-return")).default,
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
            { index: true, element: <Navigate to="/accounting/bank-payment" replace /> },
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
            { index: true, element: <Navigate to="/transaction/ledger-report" replace /> },
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

        // ── Employee Management ─────────────────────────────────────────
        {
          path: "employee-management",
          children: [
            { index: true, element: <Navigate to="/employee-management/employee-master" replace /> },
            {
              path: "employee-master",
              children: [
                {
                  index: true,
                  lazy: async () => ({
                    Component: (await import("@/app/pages/employee-management/employee-master")).default,
                  }),
                },
                {
                  path: ":id/permissions",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/employee-management/employee-master/permissions")).default,
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
            { index: true, element: <Navigate to="/settings/profile" replace /> },
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
