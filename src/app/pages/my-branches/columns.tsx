// pages/my-branches/columns.tsx
import { ColumnDef } from "@tanstack/react-table";
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { Button, Badge } from "@/components/ui";
import { MyBranch } from "./data";

interface ColumnMeta {
  onView: (item: MyBranch) => void;
  onEdit: (item: MyBranch) => void;
  onDelete: (item: MyBranch) => void;
  onStatusToggle: (item: MyBranch) => void;
}

export const columns: ColumnDef<MyBranch>[] = [
  {
    id: "srNo",
    header: "#",
    size: 55,
    enableSorting: false,
    enableGlobalFilter: false,
    cell: ({ row }) => (
      <span className="text-gray-800 dark:text-dark-100">{row.index + 1}</span>
    ),
  },
  {
    id: "branch_name",
    accessorKey: "branch_name",
    header: "Business Name",
    cell: ({ row }) => (
      <span className="font-semibold text-gray-900 dark:text-white">
        {row.original.branch_name || "—"}
      </span>
    ),
  },
  {
    id: "owner_name",
    accessorKey: "owner_name",
    header: "Owner",
    cell: ({ row }) => (
      <span className="text-gray-700 dark:text-dark-100">
        {row.original.owner_name || "—"}
      </span>
    ),
  },
  {
    id: "email",
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-gray-600 dark:text-dark-200">
        {row.original.email || "—"}
      </span>
    ),
  },
  {
    id: "phone",
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => (
      <a
        href={`tel:${row.original.phone}`}
        className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
      >
        {row.original.phone || "—"}
      </a>
    ),
  },
  {
    id: "city",
    accessorKey: "city",
    header: "City",
    cell: ({ row }) => (
      <span className="text-gray-700 dark:text-dark-100">
        {row.original.city || "—"}
      </span>
    ),
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: ({ row, table }) => {
      const item = row.original;
      const meta = table.options.meta as any;
      const isActive = item.status === "active";

      return (
        <button
          onClick={() => meta?.onStatusToggle?.(item)}
          className="cursor-pointer"
        >
          <Badge
            color={isActive ? "success" : "error"}
            variant="soft"
            className="hover:opacity-80 transition-opacity"
          >
            <span className="flex items-center gap-1">
              {isActive ? (
                <CheckCircleIcon className="size-3.5" />
              ) : (
                <XCircleIcon className="size-3.5" />
              )}
              {item.status || "active"}
            </span>
          </Badge>
        </button>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    size: 130,
    enableSorting: false,
    enableGlobalFilter: false,
    cell: ({ row, table }) => {
      const item = row.original;
      const meta = table.options.meta as any;

      return (
        <div className="flex items-center justify-center gap-1.5">
          <Button
            variant="flat"
            isIcon
            size="sm"
            onClick={() => meta?.onView?.(item)}
            title="View"
            className="text-gray-500 hover:text-primary-600"
          >
            <EyeIcon className="size-4.5 stroke-1" />
          </Button>
          <Button
            variant="flat"
            isIcon
            size="sm"
            onClick={() => meta?.onEdit?.(item)}
            title="Edit"
            className="text-gray-500 hover:text-amber-600"
          >
            <PencilIcon className="size-4.5 stroke-1" />
          </Button>
          <Button
            variant="flat"
            isIcon
            size="sm"
            onClick={() => meta?.onDelete?.(item)}
            title="Delete"
            className="text-gray-500 hover:text-red-600"
          >
            <TrashIcon className="size-4.5 stroke-1" />
          </Button>
        </div>
      );
    },
  },
];

export const exportColumns = [
  { key: "branch_name" as const, header: "Business Name" },
  { key: "owner_name" as const, header: "Owner Name" },
  { key: "email" as const, header: "Email" },
  { key: "phone" as const, header: "Phone" },
  { key: "city" as const, header: "City" },
  { key: "status" as const, header: "Status" },
];