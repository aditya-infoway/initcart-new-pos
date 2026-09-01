// pages/my-branches/MyBranchViewModal.tsx
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import {
  BuildingStorefrontIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Fragment } from "react";

import { Button, Badge } from "@/components/ui";
import { formatDateDDMMYYYY } from "@/ApiHelper";
import { MyBranch } from "./data";

interface MyBranchViewModalProps {
  isOpen: boolean;
  close: () => void;
  branch: MyBranch | null;
}

function LabeledField({
  label,
  value,
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-dark-300">
        {label}
      </div>
      <div className="text-sm font-medium text-gray-800 dark:text-dark-100">
        {value === null || value === undefined || value === "" ? "—" : value}
      </div>
    </div>
  );
}

export function MyBranchViewModal({
  isOpen,
  close,
  branch,
}: MyBranchViewModalProps) {
  if (!branch) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-120" onClose={close}>
        <TransitionChild
          as="div"
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity dark:bg-black/40"
        />

        <TransitionChild
          as={DialogPanel}
          enter="ease-out transform-gpu transition-transform duration-200"
          enterFrom="translate-x-full"
          enterTo="translate-x-0"
          leave="ease-in transform-gpu transition-transform duration-200"
          leaveFrom="translate-x-0"
          leaveTo="translate-x-full"
          className="fixed top-0 right-0 flex h-full w-full lg:max-w-[65%] xl:max-w-[55%] transform-gpu flex-col bg-white dark:bg-dark-700"
        >
          {/* Header */}
          <div className="bg-primary flex shrink-0 items-center justify-between border-b border-primary/20 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-full bg-white/20 text-white">
                <BuildingStorefrontIcon className="size-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {branch.branch_name || "Branch Details"}
                </h3>
                <p className="mt-0.5 text-sm text-white/75">Branch Details</p>
              </div>
            </div>
            <Button
              onClick={close}
              variant="flat"
              isIcon
              className="size-8 rounded-full text-white hover:bg-white/10"
            >
              <XMarkIcon className="size-5" />
            </Button>
          </div>

          {/* Body */}
          <div className="hide-scrollbar grow overflow-y-auto px-5 py-5">
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <Badge
                  color={branch.status === "active" ? "success" : "error"}
                  variant="soft"
                  className="text-sm"
                >
                  {branch.status?.charAt(0).toUpperCase() + branch.status?.slice(1)}
                </Badge>
                {branch.created_at && (
                  <span className="text-sm text-gray-500 dark:text-dark-300">
                    Created: {formatDateDDMMYYYY(branch.created_at)}
                  </span>
                )}
              </div>

              {/* Basic Info */}
              <div className="rounded-xl border border-gray-200 bg-white dark:border-dark-500 dark:bg-dark-750 p-4">
                <h4 className="mb-3 text-sm font-bold text-gray-700 dark:text-dark-100">
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
                  <LabeledField label="Business Name" value={branch.branch_name} />
                  <LabeledField label="Owner Name" value={branch.owner_name} />
                  <LabeledField label="Email" value={branch.email} />
                  <LabeledField
                    label="Phone"
                    value={
                      branch.phone ? (
                        <a
                          href={`tel:${branch.phone}`}
                          className="text-primary-600 dark:text-primary-400"
                        >
                          {branch.phone}
                        </a>
                      ) : null
                    }
                  />
                  <LabeledField label="Role" value={branch.role} />
                  <LabeledField
                    label="Linked Account"
                    value={branch.linked_account_name || "N/A"}
                  />
                </div>
              </div>

              {/* Address */}
              <div className="rounded-xl border border-gray-200 bg-white dark:border-dark-500 dark:bg-dark-750 p-4">
                <h4 className="mb-3 text-sm font-bold text-gray-700 dark:text-dark-100">
                  <MapPinIcon className="inline size-4 mr-1" />
                  Address
                </h4>
                <div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
                  <LabeledField label="Address" value={branch.address} />
                  <LabeledField label="City" value={branch.city} />
                  <LabeledField label="State" value={branch.state} />
                  <LabeledField label="Country" value={branch.country} />
                </div>
              </div>

              {/* Tax Details */}
              <div className="rounded-xl border border-gray-200 bg-white dark:border-dark-500 dark:bg-dark-750 p-4">
                <h4 className="mb-3 text-sm font-bold text-gray-700 dark:text-dark-100">
                  Tax Details
                </h4>
                <div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
                  <LabeledField label="GST Number" value={branch.gst_number || "N/A"} />
                  <LabeledField label="PAN Number" value={branch.pan_number || "N/A"} />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 justify-end gap-3 border-t border-gray-200 px-5 py-4 dark:border-dark-500">
            <Button color="primary" onClick={close}>
              Close
            </Button>
          </div>
        </TransitionChild>
      </Dialog>
    </Transition>
  );
}