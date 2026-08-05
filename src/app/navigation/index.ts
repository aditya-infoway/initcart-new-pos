import { posDashboard }          from "./segments/posDashboard";
import { posMasterMenu }         from "./segments/posMasterMenu";
import { posOrderManagement }    from "./segments/posOrderManagement";
import { posPurchaseMaster }     from "./segments/posPurchaseMaster";
import { posSalesMaster }        from "./segments/posSalesMaster";
import { posStockMaster }        from "./segments/posStockMaster";
import { posTransactionMaster }  from "./segments/posTransactionMaster";
import { posReporting }          from "./segments/posReporting";
import { posAccounting }         from "./segments/posAccounting";
import { posLogout }             from "./segments/posLogout";

// ── POS Branch Panel Navigation ────────────────────────────────────────────
export const navigation = [
  posDashboard,         // Dashboard
  posMasterMenu,        // Master
  posOrderManagement,   // Order Management
  posPurchaseMaster,    // Purchase Master
  posSalesMaster,       // Sales Master
  posStockMaster,       // Stock Master
  posTransactionMaster, // Transaction Master
  posReporting,         // Reporting
  posAccounting,        // Accounting
  posLogout,            // Logout
];
