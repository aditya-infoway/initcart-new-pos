// src/app/pages/sales-master/sales-entry/ProductCard.tsx
import { PlusIcon, QrCodeIcon, CubeIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

import { Badge, Card } from "@/components/ui";
import { SaleItem, VARIANT_BY_BRANCH } from "./data";

interface Props {
  item: SaleItem;
  onAdd: (item: SaleItem) => void;
  branchType: string | null;
}

export function ProductCard({ item, onAdd, branchType }: Props) {
  const outOfStock = item.stock <= 0;
  const variantFields = VARIANT_BY_BRANCH[branchType || ""] || [];

  return (
    <Card
      className={clsx(
        "relative overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-0.5",
        outOfStock && "opacity-50 cursor-not-allowed grayscale",
      )}
      onClick={() => !outOfStock && onAdd(item)}
    >
      {/* Top colored band */}
      <div
        className={clsx(
          "h-2 w-full",
          outOfStock
            ? "bg-gray-300"
            : item.stock <= 5
              ? "bg-warning"
              : "bg-primary",
        )}
      />

      <div className="p-3 space-y-2">
        {/* Item name + add button */}
        <div className="flex items-start justify-between gap-2">
          <p
            className="text-sm font-bold text-gray-800 dark:text-dark-100 leading-tight line-clamp-2 flex-1"
            title={item.itemName}
          >
            {item.itemName}
          </p>
          {!outOfStock && (
            <div className="shrink-0 size-8 rounded-full bg-primary flex items-center justify-center text-white shadow-lg">
              <PlusIcon className="size-4" />
            </div>
          )}
        </div>

        {/* HSN + barcode chips */}
        <div className="flex flex-wrap gap-1.5">
          {item.hsn && (
            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full dark:bg-dark-800 dark:text-dark-400">
              HSN: {item.hsn}
            </span>
          )}
          {item.barcode && item.barcode !== "-" && (
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1 dark:bg-primary/20">
              <QrCodeIcon className="size-3" /> {item.barcode}
            </span>
          )}
        </div>

        {/* Branch variant pills */}
        {variantFields.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {variantFields.map((f) => {
              const v = (item as any)[f];
              return v && v !== "-" ? (
                <span
                  key={f}
                  className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize font-medium dark:bg-primary/20 dark:text-primary-300"
                >
                  {f}: {v}
                </span>
              ) : null;
            })}
          </div>
        )}

        {/* Unit + tax */}
        <div className="flex gap-1.5 flex-wrap">
          {item.unit && item.unit !== "-" && (
            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full dark:bg-dark-800 dark:text-dark-400">
              Unit: {item.unit}
            </span>
          )}
          {item.taxPercent > 0 && (
            <Badge color="info" variant="soft" className="text-[10px] font-semibold">
              GST {item.taxPercent}%
            </Badge>
          )}
        </div>

        {/* Price + stock */}
        <div className="flex items-end justify-between pt-2 border-t border-gray-100 dark:border-dark-700">
          <div>
            <p className="text-lg font-black text-primary">
              ₹{Number(item.salesPrice).toFixed(2)}
            </p>
            {item.unitSupportsFractional && item.perUnitPrice > 0 && (
              <p className="text-[10px] text-gray-400 dark:text-dark-400">
                per {item.unit}
              </p>
            )}
          </div>
          <Badge
            color={
              item.stock > 10 ? "success" : item.stock > 0 ? "warning" : "error"
            }
            variant="soft"
            className="text-[10px] font-semibold"
          >
            {item.stock > 0 ? `${item.stock} left` : "Out of stock"}
          </Badge>
        </div>
      </div>

      {outOfStock && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center dark:bg-dark-800/70 backdrop-blur-sm">
          <Badge color="error" className="text-xs font-bold px-3 py-1">
            Out of Stock
          </Badge>
        </div>
      )}
    </Card>
  );
}