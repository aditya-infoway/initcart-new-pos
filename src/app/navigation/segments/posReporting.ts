import { NavigationTree } from "@/@types/navigation";

export const posReporting: NavigationTree = {
  id: "posReporting",
  type: "collapse",
  path: "/pos/reporting",
  title: "Reporting",
  icon: "posReporting",
  childs: [
    { id: "posReporting.outstanding",            type: "item", path: "/pos/reporting/outstanding",              title: "Outstanding",               icon: "posReporting.outstanding" },
    { id: "posReporting.salesEntryReport",       type: "item", path: "/pos/reporting/sales-entry-report",        title: "Sales Entry Report",        icon: "posReporting.salesEntryReport" },
    { id: "posReporting.salesRegister",          type: "item", path: "/pos/reporting/sales-register",           title: "Sales Register",            icon: "posReporting.salesRegister" },
    { id: "posReporting.purchaseRegister",       type: "item", path: "/pos/reporting/purchase-register",        title: "Purchase Register",         icon: "posReporting.purchaseRegister" },
    { id: "posReporting.salesReturnRegister",    type: "item", path: "/pos/reporting/sales-return-register",    title: "Sales Return Register",     icon: "posReporting.salesReturnRegister" },
    { id: "posReporting.purchaseReturnRegister", type: "item", path: "/pos/reporting/purchase-return-register", title: "Purchase Return Register",  icon: "posReporting.purchaseReturnRegister" },
    { id: "posReporting.duePayment",             type: "item", path: "/pos/reporting/due-payment",              title: "Due Payment",               icon: "posReporting.duePayment" },
    { id: "posReporting.debitNoteRegister",      type: "item", path: "/pos/reporting/debit-note-register",      title: "Debit Note Register",       icon: "posReporting.debitNoteRegister" },
    { id: "posReporting.creditNoteRegister",     type: "item", path: "/pos/reporting/credit-note-register",     title: "Credit Note Register",      icon: "posReporting.creditNoteRegister" },
    { id: "posReporting.quickReceiptRegister",   type: "item", path: "/pos/reporting/quick-receipt-register",   title: "Quick Receipt Register",    icon: "posReporting.quickReceiptRegister" },
    { id: "posReporting.quickPaymentRegister",   type: "item", path: "/pos/reporting/quick-payment-register",   title: "Quick Payment Register",    icon: "posReporting.quickPaymentRegister" },
  ],
};
