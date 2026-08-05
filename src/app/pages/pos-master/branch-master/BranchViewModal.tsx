// Import Dependencies
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Fragment } from "react";

// Local Imports
import { Badge, Button } from "@/components/ui";
import { formatDateDDMMYYYY } from "@/ApiHelper";
import { Branch } from "./data";

// ----------------------------------------------------------------------

interface BranchViewModalProps {
  isOpen: boolean;
  close: () => void;
  branch: Branch | null;
}

function SectionBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-dark-500 dark:bg-dark-750">
      <div className="border-b border-gray-200 px-4 py-3 dark:border-dark-500">
        <h4 className="text-sm font-bold text-gray-800 dark:text-dark-100">{title}</h4>
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}

function Row2({
  l1, v1, l2, v2,
}: {
  l1: string; v1: React.ReactNode;
  l2: string; v2: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
      <div>
        <span className="text-sm font-semibold text-gray-500 dark:text-dark-300">{l1}: </span>
        <span className="text-sm text-gray-800 dark:text-dark-100">{v1 || "—"}</span>
      </div>
      <div>
        <span className="text-sm font-semibold text-gray-500 dark:text-dark-300">{l2}: </span>
        <span className="text-sm text-gray-800 dark:text-dark-100">{v2 || "—"}</span>
      </div>
    </div>
  );
}

function DocLink({ label, url }: { label: string; url?: string | null }) {
  return (
    <div>
      <span className="text-sm font-semibold text-gray-500 dark:text-dark-300">{label}: </span>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
        >
          View
        </a>
      ) : (
        <span className="text-sm text-gray-400">N/A</span>
      )}
    </div>
  );
}

export function BranchViewModal({ isOpen, close, branch }: BranchViewModalProps) {
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

        <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6">
          <div className="flex min-h-full items-center justify-center">
            <TransitionChild
              as={DialogPanel}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-2"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-2"
              className="w-full max-w-lg overflow-hidden rounded-2xl bg-gray-50 shadow-xl dark:bg-dark-800"
            >
              {/* Close */}
              <div className="flex justify-end px-4 pt-4">
                <Button onClick={close} variant="flat" isIcon className="size-8 rounded-full">
                  <XMarkIcon className="size-5" />
                </Button>
              </div>

              {/* Header */}
              <div className="px-6 pb-4 text-center">
                <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10 text-primary">
                  {branch?.branchLogo ? (
                    <img
                      src={branch.branchLogo}
                      alt={branch.branchName}
                      className="size-full rounded-full object-cover"
                    />
                  ) : (
                    <InformationCircleIcon className="size-7" />
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {branch?.branchName || "Branch Details"}
                </h3>
              </div>

              {/* Body */}
              <div className="max-h-[65vh] space-y-3 overflow-y-auto px-5 pb-5">
                <SectionBox title="Basic Information">
                  <div className="space-y-2">
                    <Row2
                      l1="Type" v1={branch?.branchType ? branch.branchType.charAt(0).toUpperCase() + branch.branchType.slice(1) : "—"}
                      l2="Status"
                      v2={
                        branch ? (
                          <Badge
                            color={branch.status === "active" ? "success" : "error"}
                            variant="soft"
                          >
                            {branch.status}
                          </Badge>
                        ) : "—"
                      }
                    />
                    <Row2 l1="Owner" v1={branch?.ownerName} l2="Email" v2={branch?.email} />
                    <Row2
                      l1="Phone" v1={branch?.phone}
                      l2="Created" v2={branch ? formatDateDDMMYYYY(branch.createdAt) : "—"}
                    />
                  </div>
                </SectionBox>

                <SectionBox title="Address">
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-semibold text-gray-500 dark:text-dark-300">Address: </span>
                      <span className="text-sm text-gray-800 dark:text-dark-100">{branch?.address || "—"}</span>
                    </div>
                    <Row2 l1="City" v1={branch?.city} l2="State" v2={branch?.state} />
                    <div>
                      <span className="text-sm font-semibold text-gray-500 dark:text-dark-300">Pincode: </span>
                      <span className="text-sm text-gray-800 dark:text-dark-100">{branch?.pincode || "—"}</span>
                    </div>
                  </div>
                </SectionBox>

                <SectionBox title="Bank Details">
                  <div className="space-y-2">
                    <Row2 l1="Bank Name" v1={branch?.bankName} l2="Account No" v2={branch?.accountNumber} />
                    <Row2 l1="IFSC Code" v1={branch?.ifscCode} l2="UPI ID" v2={branch?.upiId} />
                  </div>
                </SectionBox>

                <SectionBox title="Documents">
                  <div className="grid grid-cols-2 gap-3">
                    <DocLink label="License" url={branch?.licenseFile} />
                    <DocLink label="GST" url={branch?.gstCertificate} />
                    <DocLink label="ID Proof" url={branch?.idProof} />
                    <DocLink label="Logo" url={branch?.branchLogo} />
                  </div>
                </SectionBox>
              </div>

              {/* Footer */}
              <div className="flex justify-center border-t border-gray-200 px-5 py-4 dark:border-dark-500">
                <Button color="primary" className="min-w-[8rem]" onClick={close}>
                  Close
                </Button>
              </div>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
