import { NavigationTree } from "@/@types/navigation";

export const posReporting: NavigationTree = {
  id: "posReporting",
  type: "collapse",
  path: "/reporting",
  title: "Reporting",
  icon: "posReporting",
  childs: [
    { id: "posReporting.outstanding",            type: "item", path: "/reporting/outstanding",              title: "Outstanding",               icon: "posReporting.outstanding" },
    { id: "posReporting.salesEntryReport",       type: "item", path: "/reporting/sales-entry-report",        title: "Sales Entry Report",        icon: "posReporting.salesEntryReport" },
    { id: "posReporting.salesRegister",          type: "item", path: "/reporting/sales-register",           title: "Sales Register",            icon: "posReporting.salesRegister" },
    { id: "posReporting.purchaseRegister",       type: "item", path: "/reporting/purchase-register",        title: "Purchase Register",         icon: "posReporting.purchaseRegister" },
    { id: "posReporting.salesReturnRegister",    type: "item", path: "/reporting/sales-return-register",    title: "Sales Return Register",     icon: "posReporting.salesReturnRegister" },
    { id: "posReporting.purchaseReturnRegister", type: "item", path: "/reporting/purchase-return-register", title: "Purchase Return Register",  icon: "posReporting.purchaseReturnRegister" },
    { id: "posReporting.duePayment",             type: "item", path: "/reporting/due-payment",              title: "Due Payment",               icon: "posReporting.duePayment" },
    { id: "posReporting.debitNoteRegister",      type: "item", path: "/reporting/debit-note-register",      title: "Debit Note Register",       icon: "posReporting.debitNoteRegister" },
    { id: "posReporting.creditNoteRegister",     type: "item", path: "/reporting/credit-note-register",     title: "Credit Note Register",      icon: "posReporting.creditNoteRegister" },
    { id: "posReporting.quickReceiptRegister",   type: "item", path: "/reporting/quick-receipt-register",   title: "Quick Receipt Register",    icon: "posReporting.quickReceiptRegister" },
    { id: "posReporting.quickPaymentRegister",   type: "item", path: "/reporting/quick-payment-register",   title: "Quick Payment Register",    icon: "posReporting.quickPaymentRegister" },
  ],
};
