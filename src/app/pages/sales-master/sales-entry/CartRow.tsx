// src/app/pages/sales-master/sales-entry/CartRow.tsx
import { TrashIcon, MinusIcon, PlusIcon } from "@heroicons/react/24/outline";

import { Badge, Input } from "@/components/ui";
import { GridCartItem } from "./data";

interface Props {
  item: GridCartItem;
  onQtyChange: (id: number, qty: number) => void;
  onPriceChange: (id: number, price: number) => void;
  onDiscountChange: (id: number, disc: number) => void;
  onDelete: (id: number) => void;
}

export function CartRow({
  item,
  onQtyChange,
  onPriceChange,
  onDiscountChange,
  onDelete,
}: Props) {
  return (
    <div className="py-2.5 border-b border-gray-100 dark:border-dark-700 last:border-0">
      {/* Row 1: name + delete */}
      <div className="flex items-start justify-between gap-1">
        <p className="text-xs font-bold text-gray-800 dark:text-dark-100 leading-tight flex-1 truncate">
          {item.itemName}
        </p>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="text-red-400 hover:text-red-600 shrink-0 p-0.5"
        >
          <TrashIcon className="size-4" />
        </button>
      </div>

      {/* Row 2: badges */}
      <div className="flex flex-wrap gap-1 mt-0.5">
        {item.hsnCode && (
          <span className="text-[9px] bg-gray-100 text-gray-400 px-1 py-0.5 rounded dark:bg-dark-800 dark:text-dark-400">
            HSN: {item.hsnCode}
          </span>
        )}
        {item.taxSlab && item.taxSlab !== "0" && (
          <Badge color="info" variant="soft" className="text-[9px]">
            GST {item.taxSlab}%
          </Badge>
        )}
        {Number(item.discountPercent) > 0 && (
          <Badge color="success" variant="soft" className="text-[9px]">
            {item.discountPercent}% off
          </Badge>
        )}
      </div>

      {/* Row 3: qty + price + disc */}
      <div className="flex items-center gap-2 mt-1.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onQtyChange(item.id, Math.max(1, item.quantity - 1))}
            className="size-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 transition dark:bg-dark-700 dark:text-dark-300"
          >
            <MinusIcon className="size-3" />
          </button>
          <Input
            type="number"
            value={item.quantity}
            onChange={(e) =>
              onQtyChange(item.id, Math.max(1, Number(e.target.value) || 1))
            }
            className="w-12 text-center text-xs font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            min={1}
          />
          <button
            type="button"
            onClick={() => onQtyChange(item.id, item.quantity + 1)}
            className="size-5 rounded-full bg-primary hover:bg-primary-600 flex items-center justify-center text-white transition"
          >
            <PlusIcon className="size-3" />
          </button>
        </div>

        <div className="flex items-center gap-1 flex-1">
          <span className="text-[9px] text-gray-400 shrink-0">₹</span>
          <Input
            type="number"
            value={item.price}
            onChange={(e) => onPriceChange(item.id, Number(e.target.value) || 0)}
            className="text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="Price"
          />
        </div>

        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={item.discountPercent}
            onChange={(e) =>
              onDiscountChange(
                item.id,
                Math.min(100, Math.max(0, Number(e.target.value) || 0)),
              )
            }
            className="w-12 text-xs text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="0"
            min={0}
            max={100}
          />
          <span className="text-[9px] text-gray-400">%</span>
        </div>
      </div>

      {/* Row 4: amounts */}
      <div className="flex items-center justify-between mt-1.5 bg-primary/5 rounded-lg px-2 py-1 dark:bg-primary/10">
        <div className="flex gap-3">
          <div className="text-center">
            <p className="text-[9px] text-gray-400 dark:text-dark-400">Basic</p>
            <p className="text-[10px] font-semibold text-gray-700 dark:text-dark-200">
              ₹{Number(item.basicAmount).toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[9px] text-gray-400 dark:text-dark-400">Disc</p>
            <p className="text-[10px] font-semibold text-success-600 dark:text-success-400">
              -₹{Number(item.discountAmount).toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[9px] text-gray-400 dark:text-dark-400">Tax</p>
            <p className="text-[10px] font-semibold text-info-600 dark:text-info-400">
              ₹{Number(item.taxAmount).toFixed(2)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-gray-400 dark:text-dark-400">Net</p>
          <p className="text-sm font-black text-primary dark:text-primary-400">
            ₹{Number(item.netValue).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}