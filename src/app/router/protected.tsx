import { Navigate, RouteObject } from "react-router";

import AuthGuard from "@/middleware/AuthGuard";
import { DynamicLayout } from "../layouts/DynamicLayout";
import { AppLayout } from "../layouts/AppLayout";

/**
 * Protected routes — all under /pos2 prefix (set in router basename).
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

        // ── Logout ─────────────────────────────────────────────────────
        {
          path: "logout",
          element: <Navigate to="/login" replace />,
        },

// ── Master Menu ────────────────────────────────────────────────
// Account Creation
{
  path: "Addaccounts",
  lazy: async () => ({
    Component: (await import("@/app/pages/master-menu/account-creation")).default,
  }),
},
{
  path: "accounts",
  lazy: async () => ({
    Component: (await import("@/app/pages/master-menu/account-creation/AccountForm")).default,
  }),
},
{
  path: "Addaccounts/edit/:id",
  lazy: async () => ({
    Component: (await import("@/app/pages/master-menu/account-creation/AccountForm")).default,
  }),
},

        // Items
        {
          path: "Additems",
          lazy: async () => ({
            Component: (await import("@/app/pages/master-menu/items")).default,
          }),
        },
        {
          path: "Items",
          lazy: async () => ({
            Component: (await import("@/app/pages/master-menu/items/item-form")).default,
          }),
        },
        {
          path: "Additems/:id/edit",
          lazy: async () => ({
            Component: (await import("@/app/pages/master-menu/items/item-form")).default,
          }),
        },

        // Website Items
        {
          path: "WebItems",
          lazy: async () => ({
            Component: (await import("@/app/pages/master-menu/website-items")).default,
          }),
        },
        {
          path: "website-items/:id/edit",
          lazy: async () => ({
            Component: (await import("@/app/pages/master-menu/website-items/detail")).default,
          }),
        },
        {
          path: "website-items/:id",
          lazy: async () => ({
            Component: (await import("@/app/pages/master-menu/website-items/detail")).default,
          }),
        },

        // Barcodes
        {
          path: "pendingBarcodes",
          lazy: async () => ({
            Component: (await import("@/app/pages/master-menu/item-barcodes")).default,
          }),
        },
        {
          path: "PendingBarcodes",
          lazy: async () => ({
            Component: (await import("@/app/pages/master-menu/item-barcodes")).default,
          }),
        },

        // Orders
        {
          path: "Orders",
          lazy: async () => ({
            Component: (await import("@/app/pages/master-menu/orders")).default,
          }),
        },
        {
          path: "branch/orders/:orderId",
          lazy: async () => ({
            Component: (await import("@/app/pages/order-management/order-items/detail")).default,
          }),
        },

        // Group
        {
          path: "createGroup",
          lazy: async () => ({
            Component: (await import("@/app/pages/master-menu/group")).default,
          }),
        },

        // Item Import / Excel
        {
          path: "ExcelImportExport",
          lazy: async () => ({
            Component: (await import("@/app/pages/master-menu/item-import")).default,
          }),
        },

        // Branch Master
        {
          path: "branchMaster",
          lazy: async () => ({
            Component: (await import("@/app/pages/master-menu/branch-master/index")).default,
          }),
        },

        // ── Order Management ───────────────────────────────────────────
        {
          path: "order-items",
          lazy: async () => ({
            Component: (await import("@/app/pages/order-management/order-items")).default,
          }),
        },
        {
          path: "stock-verification",
          lazy: async () => ({
            Component: (await import("@/app/pages/order-management/stock-verification")).default,
          }),
        },
        {
          path: "stockReturn",
          lazy: async () => ({
            Component: (await import("@/app/pages/stock-master/stock-return")).default,
          }),
        },
        {
          path: "stockTransfer",
          lazy: async () => ({
            Component: (await import("@/app/pages/order-management/stock-transfer")).default,
          }),
        },


// ── My Branches ───────────────────────────────────────────────────────────
{
  path: "mybranches",
  children: [
    {
      index: true,
      lazy: async () => ({
        Component: (await import("@/app/pages/my-branches")).default,
      }),
    },
  ],
},
        // ── Purchase Master ────────────────────────────────────────────
        {
          path: "Addpurchaseitem",
          lazy: async () => ({
            Component: (await import("@/app/pages/purchase-master/purchase-entry")).default,
          }),
        },
        {
          path: "purchases",
          lazy: async () => ({
            Component: (await import("@/app/pages/purchase-master/purchase-entry/new-purchase")).default,
          }),
        },
        {
          path: "purchaseReturnList",
          lazy: async () => ({
            Component: (await import("@/app/pages/purchase-master/purchase-return")).default,
          }),
        },
        {
          path: "purchase-return",
          lazy: async () => ({
            Component: (await import("@/app/pages/purchase-master/purchase-return/new-return")).default,
          }),
        },
        {
          path: "purchaseimport",
          lazy: async () => ({
            Component: (await import("@/app/pages/purchase-master/purchase-excel-import-export/index")).default,
          }),
        },
        {
          path: "b2bpurchaseverify",
          lazy: async () => ({
            Component: (await import("@/app/pages/purchase-master/b2b-purchase-verification")).default,
          }),
        },

        // ── Sales Master ───────────────────────────────────────────────
        {
          path: "Addsalesitem",
          lazy: async () => ({
            Component: (await import("@/app/pages/sales-master/sales-entry")).default,
          }),
        },
        {
          path: "sales",
          lazy: async () => ({
            Component: (await import("@/app/pages/sales-master/sales-entry/new-sale")).default,
          }),
        },
        {
          path: "salesReturnList",
          lazy: async () => ({
            Component: (await import("@/app/pages/sales-master/sales-return")).default,
          }),
        },
        {
          path: "sales-return",
          lazy: async () => ({
            Component: (await import("@/app/pages/sales-master/sales-return/new-return")).default,
          }),
        },
        {
          path: "salesentry2",
          lazy: async () => ({
            Component: (await import("@/app/pages/sales-master/sales-entry/sales-entry-form2")).default,
          }),
        },
        {
          path: "salesProfitReport",
          lazy: async () => ({
            Component: (await import("@/app/pages/accounting/sales-profit-report")).default,
          }),
        },
        {
          path: "b2bsales",
          lazy: async () => ({
            Component: (await import("@/app/pages/sales-master/b2b-sales/index")).default,
          }),
        },
        {
          path: "b2bsalescreate",
          lazy: async () => ({
            Component: (await import("@/app/pages/sales-master/b2b-sales/create")).default,
          }),
        },

        // ── Stock Master ───────────────────────────────────────────────
        {
          path: "stock-report",
          lazy: async () => ({
            Component: (await import("@/app/pages/stock-master/stock-report")).default,
          }),
        },
        {
          path: "stockDetail/:variantId",
          lazy: async () => ({
            Component: (await import("@/app/pages/stock-master/stock-report/detail")).default,
          }),
        },

        // ── B2B Inventory ───────────────────────────────────────────────
        {
          path: "b2bstockReturn",
          lazy: async () => ({
            Component: (await import("@/app/pages/b2b-inventory/stock-return")).default,
          }),
        },
        {
          path: "B2BStockTransfer",
          lazy: async () => ({
            Component: (await import("@/app/pages/b2b-inventory/stock-transfer/send-order")).default,
          }),
        },
        {
          path: "B2BOrderRequest",
          lazy: async () => ({
            Component: (await import("@/app/pages/b2b-inventory/stock-transfer/received-orders/index")).default,
          }),
        },
        {
          path: "stockReturnverification",
          lazy: async () => ({
            Component: (await import("@/app/pages/b2b-inventory/stock-return-management/index")).default,
          }),
        },
        {
          path: "b2bstockReturnverification",
          lazy: async () => ({
            Component: (await import("@/app/pages/b2b-inventory/b2b-stock-return-management/index")).default,
          }),
        },
        {
          path: "SchemeOffer",
          lazy: async () => ({
            Component: (await import("@/app/pages/b2b-inventory/scheme-offer/index")).default,
          }),
        },
        {
          path: "SchemeOffers/:id/report",
          lazy: async () => ({
            Component: (await import("@/app/pages/b2b-inventory/scheme-offer/report")).default,
          }),
        },
        {
          path: "SchemeOfferRegister",
          lazy: async () => ({
            Component: (await import("@/app/pages/b2b-inventory/scheme-offer/my-offers/index")).default,
          }),
        },
        {
          path: "SchemeOfferRegister/:id/report",
          lazy: async () => ({
            Component: (await import("@/app/pages/b2b-inventory/scheme-offer/my-offers/report")).default,
          }),
        },

        // ── Accounting ─────────────────────────────────────────────────
        {
          path: "Bank-payment",
          lazy: async () => ({
            Component: (await import("@/app/pages/accounting/bank-payment")).default,
          }),
        },
        {
          path: "Bank-receipt",
          lazy: async () => ({
            Component: (await import("@/app/pages/accounting/bank-receipt")).default,
          }),
        },
        {
          path: "Cash-Payment",
          lazy: async () => ({
            Component: (await import("@/app/pages/accounting/cash-payment")).default,
          }),
        },
        {
          path: "Cash-receipt",
          lazy: async () => ({
            Component: (await import("@/app/pages/accounting/cash-receipt")).default,
          }),
        },
        {
          path: "Contra",
          lazy: async () => ({
            Component: (await import("@/app/pages/accounting/contra")).default,
          }),
        },
        {
          path: "JournalEntries",
          lazy: async () => ({
            Component: (await import("@/app/pages/accounting/journal-entries")).default,
          }),
        },
        {
          path: "debit-note",
          lazy: async () => ({
            Component: (await import("@/app/pages/accounting/journal-entries")).default,
          }),
        },
        {
          path: "credit-note",
          lazy: async () => ({
            Component: (await import("@/app/pages/accounting/journal-entries")).default,
          }),
        },

        // ── Transaction Master ─────────────────────────────────────────
        {
          path: "ledger-report",
          lazy: async () => ({
            Component: (await import("@/app/pages/transaction-master/ledger-report")).default,
          }),
        },
        {
          path: "ledger-detail/:accountId",
          lazy: async () => ({
            Component: (await import("@/app/pages/transaction-master/ledger-report/detail")).default,
          }),
        },
        {
          path: "dayBook",
          lazy: async () => ({
            Component: (await import("@/app/pages/accounting/day-book")).default,
          }),
        },
        {
          path: "cashBook",
          lazy: async () => ({
            Component: (await import("@/app/pages/transaction-master/cash-book")).default,
          }),
        },
        {
          path: "bankBook",
          lazy: async () => ({
            Component: (await import("@/app/pages/transaction-master/bank-book")).default,
          }),
        },

        // ── Reporting ──────────────────────────────────────────────────
        {
          path: "purchaseRegister",
          lazy: async () => ({
            Component: (await import("@/app/pages/reporting/purchase-register")).default,
          }),
        },
        {
          path: "purchaseReturnRegister",
          lazy: async () => ({
            Component: (await import("@/app/pages/reporting/purchase-return-register")).default,
          }),
        },
        {
          path: "salesEntryRegister",
          lazy: async () => ({
            Component: (await import("@/app/pages/reporting/sales-entry-report")).default,
          }),
        },
        {
          path: "salesReturnRegister",
          lazy: async () => ({
            Component: (await import("@/app/pages/reporting/sales-return-register")).default,
          }),
        },
        {
          path: "outStandingReport",
          lazy: async () => ({
            Component: (await import("@/app/pages/reporting/outstanding")).default,
          }),
        },
        {
          path: "duePaymentReport",
          lazy: async () => ({
            Component: (await import("@/app/pages/reporting/due-payment")).default,
          }),
        },

        // ── Employee Management ────────────────────────────────────────
        {
          path: "allEmployees",
          lazy: async () => ({
            Component: (await import("@/app/pages/employee-management/employee-master")).default,
          }),
        },
        {
          path: "Employees",
          lazy: async () => ({
            Component: (await import("@/app/pages/employee-management/employee-master/EmployeeFormPage")).default,
          }),
        },
        {
          path: "Employees/edit/:id",
          lazy: async () => ({
            Component: (await import("@/app/pages/employee-management/employee-master/EmployeeFormPage")).default,
          }),
        },
        {
          path: "employees/:id/permissions",
          lazy: async () => ({
            Component: (await import("@/app/pages/employee-management/employee-master/permissions")).default,
          }),
        },

        // ── My Branches ────────────────────────────────────────────────
        {
          path: "myBranches",
          lazy: async () => ({
            Component: (await import("@/app/pages/my-branches")).default,
          }),
        },

        // ── AI Purchase Bill ───────────────────────────────────────────
        {
          path: "aipurchasebill",
          lazy: async () => ({
            Component: (await import("@/app/pages/purchase-master/purchase-entry/new-purchase")).default,
          }),
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

        // ── Profile & Setting shortcuts ────────────────────────────────
        {
          path: "profile",
          element: <Navigate to="/settings/profile" replace />,
        },
        {
          path: "Setting",
          element: <Navigate to="/settings/general" replace />,
        },
      ],
    },
  ],
};

export { protectedRoutes };
