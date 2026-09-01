// pages/my-branches/MyBranchDrawer.tsx
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
  KeyIcon,
  MapPinIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Controller, useForm } from "react-hook-form";
import { Fragment, useEffect, useMemo, useState } from "react";

import { Button, Input } from "@/components/ui";
import { GhostSpinner } from "@/components/ui";
import { Combobox } from "@/components/shared/form/StyledCombobox";
import { Post, Patch, Get, toastsuccessmsg, toasterrormsg } from "@/ApiHelper";
import {
  MyBranch,
  MyBranchFormValues,
  BRANCH_STATUS_OPTIONS,
  ROLE_OPTIONS,
  emptyMyBranchForm,
  buildMyBranchFormValues,
  LinkableAccount,
  MyTaxDetails,
} from "./data";

interface MyBranchDrawerProps {
  isOpen: boolean;
  close: () => void;
  branch: MyBranch | null;
  onSaved: () => void;
}

export function MyBranchDrawer({
  isOpen,
  close,
  branch,
  onSaved,
}: MyBranchDrawerProps) {
  const isEdit = Boolean(branch && branch.id > 0);
  const [saving, setSaving] = useState(false);
  const [debitorAccounts, setDebitorAccounts] = useState<LinkableAccount[]>([]);
  const [creditorAccounts, setCreditorAccounts] = useState<LinkableAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [myTaxDetails, setMyTaxDetails] = useState<MyTaxDetails>({
    gst_number: "",
    pan_number: "",
  });

  const defaultValues = useMemo(
    () => (branch ? buildMyBranchFormValues(branch) : emptyMyBranchForm()),
    [branch]
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<MyBranchFormValues>({
    defaultValues,
    mode: "onTouched",
  });

useEffect(() => {
  if (isOpen) {
    reset(branch ? buildMyBranchFormValues(branch) : emptyMyBranchForm());

    const fetchTaxDetails = async () => {
      try {
        const res = await Get("pos/my-branches/my_tax_details/", {}, false);

        const responseData = (res as any)?.data?.data || (res as any)?.data || res || {};
        

        
        setMyTaxDetails({
          gst_number: responseData?.gst_number || responseData?.gstNumber || "",
          pan_number: responseData?.pan_number || responseData?.panNumber || "",
        });
      } catch (error) {
        console.error("Failed to fetch tax details:", error);
        setMyTaxDetails({ gst_number: "", pan_number: "" });
      }
    };
    fetchTaxDetails();
  }
}, [branch, isOpen, reset]);

  // Fetch linked accounts when drawer opens
  useEffect(() => {
    if (isOpen) {
      const fetchAccounts = async () => {
        setLoadingAccounts(true);
        try {
          const params = branch ? `?branch_id=${branch.id}` : "";
          const res = await Get(`pos/branch-linkable-accounts/${params}`, {}, false);
          const data = res as any;
          setDebitorAccounts(data?.debitor_accounts || []);
          setCreditorAccounts(data?.creditor_accounts || []);
        } catch (error) {
          console.error("Failed to fetch accounts:", error);
          setDebitorAccounts([]);
          setCreditorAccounts([]);
        } finally {
          setLoadingAccounts(false);
        }
      };
      fetchAccounts();
    }
  }, [isOpen, branch]);

  const handleClose = () => {
    reset(emptyMyBranchForm());
    close();
  };

  // Combine accounts for combobox
  const accountOptions = useMemo(() => {
    const options: Array<{ id: string | number; label: string; type: "debitor" | "creditor" }> =
      [];
    debitorAccounts.forEach((acc) => {
      options.push({ id: acc.id, label: acc.account_name, type: "debitor" });
    });
    creditorAccounts.forEach((acc) => {
      options.push({ id: acc.id, label: acc.account_name, type: "creditor" });
    });
    return options;
  }, [debitorAccounts, creditorAccounts]);

  const onSubmit = async (values: MyBranchFormValues) => {
    setSaving(true);
    try {
      const payload: any = {
        branch_name: values.branch_name,
        owner_name: values.owner_name,
        phone: values.phone,
        email: values.email,
        address: values.address,
        country: values.country,
        state: values.state,
        city: values.city,
        status: values.status,
        role: values.role,
      };

      if (values.sundry_debitor_account) {
        payload.sundry_debitor_account = values.sundry_debitor_account;
      }
      if (values.sundry_creditor_account) {
        payload.sundry_creditor_account = values.sundry_creditor_account;
      }

      if (!isEdit && values.password) {
        payload.password = values.password;
      }
      if (isEdit && values.password) {
        payload.password = values.password;
      }

      if (isEdit) {
        await Patch(`pos/my-branches/${branch!.id}/`, payload);
      } else {
        await Post("pos/my-branches/", payload);
      }
      toastsuccessmsg(
        isEdit ? "Branch updated successfully." : "Branch created successfully."
      );
      onSaved();
      handleClose();
    } catch (e: any) {
      const errMsg =
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        Object.values(e?.response?.data ?? {})
          .flat()
          .join(", ") ||
        (isEdit ? "Failed to update branch." : "Failed to create branch.");
      toasterrormsg(errMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-100" onClose={handleClose}>
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
            <div>
              <h3 className="text-lg font-semibold text-white">
                {isEdit ? "Edit Branch" : "Add New Branch"}
              </h3>
              <p className="mt-0.5 text-sm text-white/75">
                {isEdit
                  ? "Update branch details"
                  : "Create a new branch with all required details"}
              </p>
            </div>
            <Button
              onClick={handleClose}
              variant="flat"
              isIcon
              className="size-8 rounded-full text-white hover:bg-white/10"
            >
              <XMarkIcon className="size-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex grow flex-col overflow-hidden">
            <div className="hide-scrollbar grow space-y-5 overflow-y-auto px-5 py-5">
              {/* Row 1: Branch Name + Owner Name */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  {...register("branch_name", {
                    required: "Business Name is required",
                  })}
                  prefix={<BuildingStorefrontIcon className="size-4" />}
                  placeholder="Business Name"
                  label={<>Business Name <span className="text-red-500">*</span></>}
                  error={errors.branch_name?.message}
                />
                <Input
                  {...register("owner_name", {
                    required: "Owner Name is required",
                  })}
                  prefix={<UserIcon className="size-4" />}
                  placeholder="Owner Name"
                  label={<>Owner Name <span className="text-red-500">*</span></>}
                  error={errors.owner_name?.message}
                />
              </div>

              {/* Row 2: Email + Phone */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Invalid email",
                    },
                  })}
                  prefix={<EnvelopeIcon className="size-4" />}
                  placeholder="Email"
                  label={<>Email <span className="text-red-500">*</span></>}
                  error={errors.email?.message}
                  type="email"
                />
                <Input
                  {...register("phone", {
                    required: "Phone is required",
                    minLength: { value: 10, message: "Min 10 digits" },
                  })}
                  prefix={<PhoneIcon className="size-4" />}
                  placeholder="Phone"
                  label={<>Phone <span className="text-red-500">*</span></>}
                  error={errors.phone?.message}
                />
              </div>

              {/* Row 3: Password + Confirm Password */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  {...register(
                    "password",
                    isEdit
                      ? {
                          minLength: { value: 6, message: "Min 6 characters" },
                        }
                      : {
                          required: "Password is required",
                          minLength: { value: 6, message: "Min 6 characters" },
                        }
                  )}
                  type="password"
                  prefix={<KeyIcon className="size-4" />}
                  placeholder="Password"
                  label={
                    <>
                      Password {!isEdit && <span className="text-red-500">*</span>}
                      {isEdit && (
                        <span className="ml-1 text-xs font-normal text-gray-500 dark:text-dark-300">
                          (Optional - leave blank to keep current)
                        </span>
                      )}
                    </>
                  }
                  error={errors.password?.message}
                />
                <Input
                  {...register("confirm_password", {
                    validate: (value) =>
                      !watch("password") ||
                      value === watch("password") ||
                      "Passwords do not match",
                  })}
                  type="password"
                  prefix={<KeyIcon className="size-4" />}
                  placeholder="Confirm Password"
                  label={<>Confirm Password</>}
                  error={errors.confirm_password?.message}
                />
              </div>

              {/* Row 4: Linked Account + Role */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  control={control}
                  name="sundry_debitor_account"
                  render={({ field: { value, onChange, ...rest } }) => (
                    <Controller
                      control={control}
                      name="sundry_creditor_account"
                      render={({ field: { value: credValue, onChange: credOnChange } }) => (
                        <Combobox
                          data={accountOptions}
                          displayField="label"
                          searchFields={["label"]}
                          placeholder="Select Linked Account"
                          value={
                            accountOptions.find(
                              (o) =>
                                String(o.id) === String(value) ||
                                String(o.id) === String(credValue)
                            ) ?? null
                          }
                          onChange={(item: any) => {
                            if (item) {
                              const id = String(item.id);
                              if (item.type === "debitor") {
                                onChange(id);
                                credOnChange("");
                              } else {
                                onChange("");
                                credOnChange(id);
                              }
                            } else {
                              onChange("");
                              credOnChange("");
                            }
                          }}
                          label="Linked Account (Sundry Debitor / Creditor)"
                          {...rest}
                          inputProps={{ className: "h-9 text-sm" }}
                          disabled={loadingAccounts}
                        />
                      )}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="role"
                  rules={{ required: "Role is required" }}
                  render={({ field: { value, onChange, ...rest } }) => (
                    <Combobox
                      data={ROLE_OPTIONS}
                      displayField="label"
                      searchFields={["label"]}
                      placeholder="Select Role"
                      value={ROLE_OPTIONS.find((o) => o.id === value) ?? null}
                      onChange={(item: any) => onChange(item?.id ?? value)}
                      label={<>Account Type / Role <span className="text-red-500">*</span></>}
                      {...rest}
                      inputProps={{ className: "h-9 text-sm" }}
                    />
                  )}
                />
              </div>

              {/* Address */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-dark-500 dark:bg-dark-750 sm:p-5 space-y-4">
                <h4 className="flex items-center gap-2 text-base font-semibold text-primary-600 dark:text-primary-400">
                  <MapPinIcon className="size-5" />
                  Address
                </h4>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-dark-200">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register("address", { required: "Address is required" })}
                    rows={2}
                    placeholder="Full address"
                    className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100"
                  />
                  {errors.address && (
                    <p className="mt-1 text-xs text-error">{errors.address.message}</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Input
                    {...register("country", { required: "Country is required" })}
                    placeholder="Country"
                    label={<>Country <span className="text-red-500">*</span></>}
                    error={errors.country?.message}
                  />
                  <Input
                    {...register("state", { required: "State is required" })}
                    placeholder="State"
                    label={<>State <span className="text-red-500">*</span></>}
                    error={errors.state?.message}
                  />
                  <Input
                    {...register("city", { required: "City is required" })}
                    placeholder="City"
                    label={<>City <span className="text-red-500">*</span></>}
                    error={errors.city?.message}
                  />
                </div>
              </div>

              {/* ✅ GST/PAN - Read Only with Pre-filled Data */}
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-800 dark:bg-indigo-950/30">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-dark-200">
                      GST Number
                    </label>
                    <input
                      type="text"
                      value={myTaxDetails.gst_number || "N/A"}
                      readOnly
                      disabled
                      className="w-full rounded-xl border border-gray-300 bg-gray-100 px-3.5 py-2.5 font-mono text-sm text-gray-700 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-dark-200">
                      PAN Number
                    </label>
                    <input
                      type="text"
                      value={myTaxDetails.pan_number || "N/A"}
                      readOnly
                      disabled
                      className="w-full rounded-xl border border-gray-300 bg-gray-100 px-3.5 py-2.5 font-mono text-sm text-gray-700 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <Controller
                control={control}
                name="status"
                render={({ field: { value, onChange, ...rest } }) => (
                  <Combobox
                    data={BRANCH_STATUS_OPTIONS}
                    displayField="label"
                    searchFields={["label"]}
                    placeholder="Select Status"
                    value={BRANCH_STATUS_OPTIONS.find((o) => o.id === value) ?? null}
                    onChange={(item: any) => onChange(item?.id ?? value)}
                    label="Status"
                    {...rest}
                    inputProps={{ className: "h-9 text-sm" }}
                  />
                )}
              />
            </div>

            {/* Footer */}
            <div className="flex shrink-0 justify-end gap-3 border-t border-gray-200 px-5 py-4 dark:border-dark-500">
              <Button type="button" onClick={handleClose} disabled={saving}>
                Cancel
              </Button>
              <Button
                type="submit"
                color="primary"
                disabled={saving || (isEdit && !isDirty)}
                className="gap-2 min-w-[10rem]"
              >
                {saving && <GhostSpinner variant="soft" className="size-4 border-2" />}
                {isEdit ? "Update Branch" : "Create Branch"}
              </Button>
            </div>
          </form>
        </TransitionChild>
      </Dialog>
    </Transition>
  );
}