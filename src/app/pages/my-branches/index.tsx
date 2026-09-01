// pages/my-branches/index.tsx
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  RowSelectionState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import clsx from "clsx";

import { Page } from "@/components/shared/Page";
import { Input, Button } from "@/components/ui";
import {
  PlusIcon,
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
// ✅ Correct import from category page reference
import { fuzzyFilter } from "@/utils/react-table/fuzzyFilter";
import { Get, Delete, toasterrormsg, toastsuccessmsg } from "@/ApiHelper";
// ✅ Correct import from category page reference
import { MasterTable } from "../master/shared/MasterTable";
import { columns } from "./columns";
import { MyBranch, STATUS_OPTIONS, mapApiMyBranch } from "./data";
import { MyBranchDrawer } from "./MyBranchDrawer";
import { MyBranchViewModal } from "./MyBranchViewModal";

// Extend TableMeta type
declare module "@tanstack/react-table" {
  interface TableMeta<TData> {
    onView?: (item: TData) => void;
    onEdit?: (item: TData) => void;
    onDelete?: (item: TData) => void;
    onStatusToggle?: (item: TData) => void;
  }
}

export default function MyBranchesPage() {
  const [data, setData] = useState<MyBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<MyBranch | null>(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewingBranch, setViewingBranch] = useState<MyBranch | null>(null);

  // ---------------- LIST ----------------
  const fetchList = async () => {
    try {
      setLoading(true);
      const response = await Get("pos/my-branches/", {}, false);
      const list = (response.data?.data || []).map(mapApiMyBranch);
      setData(list);
    } catch (err) {
      toasterrormsg("Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const search = globalFilter.toLowerCase();
      if (search) {
        const match =
          item.branch_name?.toLowerCase().includes(search) ||
          item.owner_name?.toLowerCase().includes(search) ||
          item.email?.toLowerCase().includes(search) ||
          item.phone?.includes(search) ||
          item.city?.toLowerCase().includes(search);
        if (!match) return false;
      }
      if (filterStatus && filterStatus !== "all" && item.status !== filterStatus) {
        return false;
      }
      return true;
    });
  }, [data, globalFilter, filterStatus]);

  // ---------------- VIEW ----------------
  const handleView = (item: MyBranch) => {
    setViewingBranch(item);
    setViewOpen(true);
  };

  // ---------------- EDIT ----------------
  const handleEdit = (item: MyBranch) => {
    setEditingBranch(item);
    setDrawerOpen(true);
  };

  // ---------------- DELETE ----------------
  const handleDelete = async (item: MyBranch) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete "${item.branch_name}". This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) return;

    try {
      await Delete(`pos/my-branches/${item.id}/`, {}, false);
      toastsuccessmsg("Branch deleted successfully");
      fetchList();
    } catch (err) {
      toasterrormsg("Failed to delete branch");
    }
  };

  // ---------------- STATUS TOGGLE ----------------
  const handleStatusToggle = async (item: MyBranch) => {
    const newStatus = item.status === "active" ? "inactive" : "active";

    const result = await Swal.fire({
      title: "Change Status?",
      text: `Change "${item.branch_name}" status to ${newStatus}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: `Yes, ${newStatus}`,
      cancelButtonText: "Cancel",
      confirmButtonColor: newStatus === "active" ? "#16a34a" : "#dc2626",
    });

    if (!result.isConfirmed) return;

    try {
      await Get(`pos/my-branches/${item.id}/change_status/`, { status: newStatus }, false);
      toastsuccessmsg(`Status changed to ${newStatus}`);
      fetchList();
    } catch (err) {
      toasterrormsg("Failed to change status");
    }
  };

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { globalFilter, sorting, rowSelection },
    enableRowSelection: true,
    getRowId: (row) => String(row.id),
    meta: {
      onView: handleView,
      onEdit: handleEdit,
      onDelete: handleDelete,
      onStatusToggle: handleStatusToggle,
    },
    filterFns: { fuzzy: fuzzyFilter },
    globalFilterFn: fuzzyFilter,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  return (
    <Page title="My Branches">
      <div className="transition-content w-full pb-5">
        {/* Toolbar */}
        <div className="px-(--margin-x) mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="w-full max-w-xs">
              <Input
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                prefix={<MagnifyingGlassIcon className="size-4" />}
                classNames={{ input: "ring-primary-500/50 h-9 text-sm focus:ring-3" }}
                placeholder="Search by Name, Owner, Email, Phone, City..."
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outlined"
              className={clsx("h-9 gap-2 rounded-md px-3 text-sm", showFilters && "border-primary text-primary")}
              onClick={() => setShowFilters((v) => !v)}
            >
              <FunnelIcon className={clsx("size-4", showFilters && "text-primary")} />
              <span>Filter</span>
            </Button>
            <Button
              variant="outlined"
              className="h-9 gap-2 rounded-md px-3 text-sm"
              onClick={fetchList}
              disabled={loading}
            >
              <ArrowPathIcon className={clsx("size-4", loading && "animate-spin")} />
              <span>Refresh</span>
            </Button>
            <Button
              color="primary"
              className="h-9 gap-2 rounded-md px-4 text-sm"
              onClick={() => {
                setEditingBranch(null);
                setDrawerOpen(true);
              }}
            >
              <PlusIcon className="size-4" />
              <span>Add Branch</span>
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="px-(--margin-x) mt-3">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-dark-500 dark:bg-dark-600">
              <p className="mb-3 text-sm font-semibold text-gray-700 dark:text-dark-200">
                Filter Branches
              </p>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-dark-300">
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-dark-500 dark:bg-dark-700 dark:text-dark-100"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="mt-4">
          <MasterTable
            table={table}
            columnCount={columns.length}
            emptyMessage={
              loading
                ? "Loading branches..."
                : "No branches found. Click + Add Branch to create one."
            }
          />
        </div>
      </div>

      <MyBranchDrawer
        isOpen={drawerOpen}
        close={() => setDrawerOpen(false)}
        branch={editingBranch}
        onSaved={fetchList}
      />

      <MyBranchViewModal
        isOpen={viewOpen}
        close={() => setViewOpen(false)}
        branch={viewingBranch}
      />
    </Page>
  );
}