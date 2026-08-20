import { TbPalette, TbUsers } from "react-icons/tb";
import {
  ArrowLeftStartOnRectangleIcon,
  CalendarDaysIcon,
  ClockIcon,
  CubeIcon,
  DocumentPlusIcon,
  HomeIcon,
  HeartIcon,
  PhoneArrowUpRightIcon,
  RectangleStackIcon,
  Squares2X2Icon,
  TagIcon,
  CheckCircleIcon,
  UserPlusIcon,
  ClipboardDocumentListIcon,
  ClipboardDocumentCheckIcon,
  BuildingLibraryIcon,
  BriefcaseIcon,
  CheckBadgeIcon,
  BanknotesIcon,
  DocumentTextIcon,
  ReceiptRefundIcon,
  CurrencyRupeeIcon,
  ArrowsRightLeftIcon,
  ShoppingCartIcon,
  CubeTransparentIcon,
  UsersIcon,
  UserGroupIcon,
  CircleStackIcon,
  GlobeAltIcon,
  PhotoIcon,
  MegaphoneIcon,
  DevicePhoneMobileIcon,
  BoltIcon,
  ClipboardIcon,
  CreditCardIcon,
  TruckIcon,
  UserIcon as HiUserIcon,
  WrenchScrewdriverIcon,
  SparklesIcon,
  FireIcon,
  StarIcon,
  QueueListIcon,
  BeakerIcon,
  CursorArrowRaysIcon,
  BuildingOffice2Icon,
  BuildingStorefrontIcon,
  AcademicCapIcon,
  ScissorsIcon,
  CpuChipIcon,
  KeyIcon,
  MapPinIcon,
  ShieldCheckIcon,
  PlayCircleIcon,
  ShoppingBagIcon,
  ServerStackIcon,
  ChartBarIcon,
  ComputerDesktopIcon,
  BookOpenIcon,
  CalculatorIcon,
  QrCodeIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";
import { ElementType } from "react";

import DashboardsIcon from "@/assets/dualicons/dashboards.svg?react";
import FormsIcon from "@/assets/dualicons/forms.svg?react";
import SettingIcon from "@/assets/dualicons/setting.svg?react";


export const navigationIcons: Record<string, ElementType> = {
  dashboards: DashboardsIcon,
  registration: FormsIcon,
  leads: TbUsers,
  logout: ArrowLeftStartOnRectangleIcon,

  "dashboards.home": HomeIcon,

  "registration.new": DocumentPlusIcon,
  "registration.expired": ClockIcon,

  "leads.new": UserPlusIcon,
  "leads.todaySchedule": CalendarDaysIcon,
  "leads.followUp": PhoneArrowUpRightIcon,

  master: Squares2X2Icon,
  "master.category": TagIcon,
  "master.productSeries": RectangleStackIcon,
  "master.model": CubeIcon,
  "master.variant": CubeIcon,
  "master.variantStructure": RectangleStackIcon,
  "master.bom": CubeTransparentIcon,
  "master.brand": BuildingLibraryIcon,

  itemMaster: CubeIcon,
  "itemMaster.list": CubeIcon,

  leadMaster: UserGroupIcon,
  "leadMaster.list": UserGroupIcon,

  // User Master
userMaster: UsersIcon,
"user_master.createAccount": UserPlusIcon,
"user_master.createEmployee": UsersIcon,

  // Purchase Master
  purchaseMaster: ShoppingCartIcon,
  "purchase_master.purchaseRegister": ClipboardDocumentListIcon,

  stockReport: CircleStackIcon,
  "stock_report.stockReport": ClipboardDocumentListIcon,

  // Enquiry Master
  enquiryMaster: ClipboardDocumentListIcon,
  "enquiry_master.enquiryType": ClipboardDocumentListIcon,
  "enquiry_master.enquirySource": TagIcon,
  "enquiry_master.profession": BriefcaseIcon,
  "enquiry_master.enquiryStatus": CheckBadgeIcon,
  "enquiry_master.banker": BuildingLibraryIcon,
  "enquiry_master.finance": BanknotesIcon,

    // Accounting Master
  accountingMaster: BanknotesIcon,

  "accounting_master.debitNote": DocumentTextIcon,
  "accounting_master.creditNote": ReceiptRefundIcon,
  "accounting_master.cashPayment": CurrencyRupeeIcon,
  "accounting_master.bankPayment": BuildingLibraryIcon,
  "accounting_master.cashReceipt": CurrencyRupeeIcon,
  "accounting_master.bankReceipt": BuildingLibraryIcon,
  "accounting_master.contra": ArrowsRightLeftIcon,
  "accounting_master.journalEntry": ClipboardDocumentListIcon,
  "accounting_master.cashBook": ClipboardDocumentListIcon,
  "accounting_master.bankBook": ClipboardDocumentListIcon,

  // Web Site
  webSite: GlobeAltIcon,
  "webSite.sliderImage": PhotoIcon,
  "webSite.adsManager": MegaphoneIcon,
  "webSite.mobileBanner": DevicePhoneMobileIcon,

  // Vendor Management
  vendorManagement: BuildingLibraryIcon,
  "vendorManagement.createVendor": UserPlusIcon,
  "vendorManagement.vendorList": UsersIcon,
  "vendorManagement.approvalRequests": CheckBadgeIcon,
  "vendorManagement.brandCreation": TagIcon,

  loyaltyPoints: HeartIcon,
  "loyaltyPoints.create": HeartIcon,
  "loyaltyPoints.transaction": HeartIcon,

  products: CubeIcon,
  "products.verification": CheckBadgeIcon,
  "products.categoryMaster": RectangleStackIcon,
  "products.categoryMaster.category": RectangleStackIcon,
  "products.categoryMaster.subCategory": Squares2X2Icon,
  "products.categoryMaster.subSubCategory": CubeTransparentIcon,

  dealsCampaigns: TagIcon,
  "dealsCampaigns.createCampaign": DocumentPlusIcon,
  "dealsCampaigns.dealOfTheDay": CalendarDaysIcon,
  "dealsCampaigns.flashDeal": BoltIcon,
  "dealsCampaigns.featuredDeal": TagIcon,

  orders: ShoppingCartIcon,
  "orders.allOrders": ShoppingCartIcon,
  "orders.orderProfitReport": ClipboardDocumentListIcon,

  reports: ClipboardIcon,
  "reports.salesReport": ClipboardDocumentListIcon,

  subscriptionManagement: ClipboardDocumentListIcon,
  "subscriptionManagement.list": ClipboardDocumentListIcon,

  ecommerceSettings: SettingIcon,
  "ecommerceSettings.shippingConfiguration": TruckIcon,
  "ecommerceSettings.paymentGatewaySetup": CreditCardIcon,
  "ecommerceSettings.returnRefundPolicy": ReceiptRefundIcon,

  settings: SettingIcon,
  "settings.profile": HiUserIcon,
  "settings.general": HiUserIcon,
  "settings.appearance": TbPalette,

  financeWithdrawals: CurrencyRupeeIcon,
  "financeWithdrawals.vendorWithdrawals": BanknotesIcon,
  "financeWithdrawals.transactionReports": ArrowsRightLeftIcon,

  // Services
  services: WrenchScrewdriverIcon,
  "services.manageServices": SparklesIcon,
  "services.manageServices.serviceCategories": RectangleStackIcon,
  "services.manageServices.serviceSubCategories": Squares2X2Icon,
  "services.serviceInquiries": ClipboardDocumentListIcon,
  "services.flashDealParticipation": BoltIcon,
  "services.featuredServices": StarIcon,

  // Service Approvals
  serviceApprovals: ShieldCheckIcon,
  "serviceApprovals.approvalRequests": ClipboardDocumentCheckIcon,

  // Campaigns
  campaigns: MegaphoneIcon,
  "campaigns.createCampaign": DocumentPlusIcon,
  "campaigns.vendorParticipationApproval": CheckBadgeIcon,
  "campaigns.activeCampaignsList": PlayCircleIcon,

  // Marketing Banners — category-specific icons
  marketingBanners: PhotoIcon,
  "marketingBanners.gym": CubeIcon,
  "marketingBanners.saloon": ScissorsIcon,
  "marketingBanners.travelAgency": MapPinIcon,
  "marketingBanners.realEstate": BuildingOffice2Icon,
  "marketingBanners.techIndustry": CpuChipIcon,
  "marketingBanners.professional": BriefcaseIcon,
  "marketingBanners.finance": BanknotesIcon,
  "marketingBanners.healthcare": HeartIcon,
  "marketingBanners.education": AcademicCapIcon,
  "marketingBanners.restaurant": FireIcon,
  "marketingBanners.hotel": KeyIcon,

  // Service Reports
  serviceReports: ClipboardIcon,
  "serviceReports.subscriptionReports": ClipboardDocumentListIcon,
  "serviceReports.inquiryReports": DocumentTextIcon,
  "serviceReports.servicePerformanceReport": BoltIcon,
  "serviceReports.vendorEarningsReport": BanknotesIcon,

  // Agents Management
  agentsManagement: UsersIcon,
  "agentsManagement.createAgent": UserPlusIcon,
  "agentsManagement.agentHierarchyTreeView": QueueListIcon,
  "agentsManagement.agentApproval": CheckBadgeIcon,

  // POS Master
  posMaster: BuildingStorefrontIcon,
  "posMaster.branchMaster": BuildingOffice2Icon,

  // Branch
  branch: UsersIcon,
  "branch.itemVerification": ClipboardDocumentCheckIcon,

  // Commissions & MLM submenu group
  commissionsMLM: CubeTransparentIcon,
  "commissionsMLM.commissionReports": BanknotesIcon,
  "commissionsMLM.profitDistribution": CurrencyRupeeIcon,
  "commissionsMLM.mlmLevels": CubeTransparentIcon,

  // ── Top-level group icons (sidebar rail) ──────────────────────────
  groupWebSite: GlobeAltIcon,                // Web Site
  groupEcommerce: ShoppingBagIcon,           // E-Commerce (Multi-Vendor)
  groupServiceSubscription: ServerStackIcon, // Service Subscription Platform
  groupMLM: ChartBarIcon,                    // MLM (Multi-Level Marketing)
  groupPOS: ComputerDesktopIcon,             // POS (Point of Sale)

  // ── POS Branch Panel ───────────────────────────────────────────────
  posDashboard: HomeIcon,

  // Master
  posMasterMenu: Squares2X2Icon,
  "posMasterMenu.accountCreation":  UserPlusIcon,
  "posMasterMenu.addItems":         CubeIcon,
  "posMasterMenu.websiteItems":     GlobeAltIcon,
  "posMasterMenu.itemBarcodes":     QrCodeIcon,
  "posMasterMenu.orders":           ShoppingCartIcon,
  "posMasterMenu.group":            RectangleStackIcon,
  "posMasterMenu.itemImport":       ArrowUpTrayIcon,
  "posMasterMenu.branchMaster":     BuildingStorefrontIcon,

  // Order Management
  posOrderManagement: ShoppingBagIcon,
  "posOrderManagement.orderItems":        ShoppingCartIcon,
  "posOrderManagement.stockVerification": ClipboardDocumentCheckIcon,
  "posOrderManagement.stockReturn":       ReceiptRefundIcon,
  "posOrderManagement.stockTransfer":     ArrowsRightLeftIcon,

  // Purchase Master
  posPurchaseMaster: TruckIcon,
  "posPurchaseMaster.purchaseEntry":            ClipboardDocumentListIcon,
  "posPurchaseMaster.purchaseReturn":           ReceiptRefundIcon,
  "posPurchaseMaster.createOrder":              DocumentPlusIcon,
  "posPurchaseMaster.purchaseOrderVerify":      ClipboardDocumentCheckIcon,
  "posPurchaseMaster.b2bPurchaseVerification":  ClipboardDocumentCheckIcon,

  // Sales Master
  posSalesMaster: TagIcon,
  "posSalesMaster.salesEntryReport":  ClipboardDocumentListIcon,
  "posSalesMaster.salesEntry2":       DocumentPlusIcon,
  "posSalesMaster.salesReturnReport": ReceiptRefundIcon,
  "posSalesMaster.b2bSales":          ShoppingCartIcon,

  // Stock Master
  posStockMaster: CircleStackIcon,
  "posStockMaster.stockReport":   ClipboardDocumentListIcon,
  "posStockMaster.stockTransfer": ArrowsRightLeftIcon,
  "posStockMaster.stockAdjust":   DocumentTextIcon,

  // B2B Inventory
  posB2BInventory: CubeIcon,
  "posB2BInventory.stockReturn": ReceiptRefundIcon,
  "posB2BInventory.stockTransfer": ArrowsRightLeftIcon,
  "posB2BInventory.stockTransfer.sendOrder": DocumentPlusIcon,
  "posB2BInventory.stockTransfer.receivedOrders": ClipboardDocumentCheckIcon,
  // NEW: Stock Return Management submenu
  "posB2BInventory.stockReturnManagement": TruckIcon,
  "posB2BInventory.stockReturnManagement.list": ClipboardDocumentListIcon,
  "posB2BInventory.stockReturnManagement.create": DocumentPlusIcon,
  // NEW: B2B Stock Return Management submenu
  "posB2BInventory.b2bStockReturnManagement": ReceiptRefundIcon,
  "posB2BInventory.b2bStockReturnManagement.list": ClipboardDocumentListIcon,
  "posB2BInventory.b2bStockReturnManagement.create": DocumentPlusIcon,
  // NEW: SchemeOffer submenu
  "posB2BInventory.schemeOffer": MegaphoneIcon,
  "posB2BInventory.schemeOffer.list": ClipboardDocumentListIcon,
  "posB2BInventory.schemeOffer.create": DocumentPlusIcon,

  // Transaction Master
  posTransactionMaster: ArrowsRightLeftIcon,
  "posTransactionMaster.debitNote":    DocumentTextIcon,
  "posTransactionMaster.creditNote":   ReceiptRefundIcon,
  "posTransactionMaster.quickReceipt": CurrencyRupeeIcon,
  "posTransactionMaster.quickPayment": BanknotesIcon,
  "posTransactionMaster.ledgerReport": ClipboardIcon,
  "posTransactionMaster.dayBook":      CalendarDaysIcon,
  "posTransactionMaster.cashBook":     BanknotesIcon,
  "posTransactionMaster.bankBook":     BuildingLibraryIcon,

  // Reporting
  posReporting: BookOpenIcon,
  "posReporting.outstanding":            ClipboardDocumentListIcon,
  "posReporting.salesEntryReport":       ClipboardDocumentListIcon,
  "posReporting.salesRegister":          ClipboardDocumentListIcon,
  "posReporting.purchaseRegister":       ClipboardDocumentListIcon,
  "posReporting.salesReturnRegister":    ReceiptRefundIcon,
  "posReporting.purchaseReturnRegister": ReceiptRefundIcon,
  "posReporting.duePayment":             BanknotesIcon,
  "posReporting.debitNoteRegister":      DocumentTextIcon,
  "posReporting.creditNoteRegister":     DocumentTextIcon,
  "posReporting.quickReceiptRegister":   CurrencyRupeeIcon,
  "posReporting.quickPaymentRegister":   CurrencyRupeeIcon,

  // Accounting
  posAccounting: CalculatorIcon,
  "posAccounting.bankPayment":    BuildingLibraryIcon,
  "posAccounting.bankReceipt":    BuildingLibraryIcon,
  "posAccounting.cashPayment":    CurrencyRupeeIcon,
  "posAccounting.cashReceipt":    CurrencyRupeeIcon,
  "posAccounting.contra":         ArrowsRightLeftIcon,
  "posAccounting.journalEntries": ClipboardDocumentListIcon,
  "posAccounting.salesProfit":    BanknotesIcon,

  // Employee Management
  posEmployeeManagement: UserGroupIcon,
  "posEmployeeManagement.employeeMaster": UsersIcon,

  // Logout
  posLogout: ArrowLeftStartOnRectangleIcon,
};
