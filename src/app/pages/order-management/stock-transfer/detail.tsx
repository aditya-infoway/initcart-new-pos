// src/app/pages/order-management/stock-transfer/detail.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router";

/**
 * Stock Transfer Detail — now handled inline as a drawer on the main page.
 * Redirect there.
 */
export default function StockTransferDetail() {
  const navigate = useNavigate();
  useEffect(() => { navigate("/order-management/stock-transfer", { replace: true }); }, [navigate]);
  return null;
}