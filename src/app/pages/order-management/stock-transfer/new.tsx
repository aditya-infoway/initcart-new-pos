// src/app/pages/order-management/stock-transfer/new.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router";

/**
 * New Stock Transfer — create flow is now inline in the parent page.
 * Redirect there.
 */
export default function NewStockTransfer() {
  const navigate = useNavigate();
  useEffect(() => { navigate("/order-management/stock-transfer", { replace: true }); }, [navigate]);
  return null;
}