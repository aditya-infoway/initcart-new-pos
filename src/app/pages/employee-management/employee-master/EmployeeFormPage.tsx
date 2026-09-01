import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";

import { Button, Input } from "@/components/ui";
import { Listbox } from "@/components/shared/form/StyledListbox";
import { Get, Post, Patch, toasterrormsg, toastsuccessmsg } from "@/ApiHelper";
import { Page } from "@/components/shared/Page";

// Icons
import {
  ArrowLeftIcon,
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  MapPinIcon,
  BuildingLibraryIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

interface FormData {
  full_name: string;
  mobile: string;
  email: string;
  password: string;
  city: string;
  address: string;
  department: string;
}

const DEPARTMENT_OPTIONS = [
  { id: "purchase", label: "Purchase Department" },
  { id: "sales", label: "Sales Department" },
  { id: "accounting", label: "Accounting Department" },
];

export default function EmployeeFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id && parseInt(id) > 0);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);

  const validationSchema = Yup.object({
    full_name: Yup.string().required("Full name is required"),
    mobile: Yup.string()
      .matches(/^[0-9]{10}$/, "Mobile must be 10 digits")
      .required("Mobile is required"),
    email: Yup.string()
      .email("Invalid email")
      .required("Login email is required"),
    password: isEditMode
      ? Yup.string().min(6, "Password must be at least 6 characters").default("")
      : Yup.string()
          .min(6, "Password must be at least 6 characters")
          .required("Password is required")
          .default(""),
    city: Yup.string().default(""),
    address: Yup.string().default(""),
    department: Yup.string().required("Department is required"),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      full_name: "",
      mobile: "",
      email: "",
      password: "",
      city: "",
      address: "",
      department: "",
    },
  });

  useEffect(() => {
    if (!isEditMode) {
      reset({
        full_name: "",
        mobile: "",
        email: "",
        password: "",
        city: "",
        address: "",
        department: "",
      });
      setLoading(false);
      return;
    }

    const fetchEmployee = async () => {
      setLoading(true);
      try {
        const res = await Get(`pos/employees/${id}/`) as any;
        const emp = res?.data?.data ?? res?.data ?? res;
        reset({
          full_name: emp?.full_name || "",
          mobile: emp?.mobile || "",
          email: emp?.email || "",
          password: "",
          city: emp?.city || "",
          address: emp?.address || "",
          department: emp?.department || "",
        });
      } catch {
        toasterrormsg("Failed to load employee data");
        navigate("/allEmployees");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id, isEditMode, navigate, reset]);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      if (isEditMode) {
        const payload: any = {
          full_name: data.full_name,
          mobile: data.mobile,
          city: data.city,
          address: data.address,
          department: data.department,
        };
        if (data.password) {
          payload.password = data.password;
        }
        await Patch(`pos/employees/${id}/`, payload);
        toastsuccessmsg("Employee updated successfully");
      } else {
        await Post("pos/employees/", data);
        toastsuccessmsg("Employee created successfully");
      }
      navigate("/allEmployees");
    } catch (err: any) {
      const msg =
        err?.response?.data?.email?.[0] ||
        err?.response?.data?.mobile?.[0] ||
        err?.response?.data?.message ||
        (isEditMode ? "Failed to update employee" : "Failed to create employee");
      toasterrormsg(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Page title={isEditMode ? "Edit Employee" : "Add Employee"}>
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="mt-2 text-sm text-gray-500">Loading employee details...</p>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title={isEditMode ? "Edit Employee" : "Add Employee"}>
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outlined"
              isIcon
              className="size-9 rounded-full"
              onClick={() => navigate("/allEmployees")}
            >
              <ArrowLeftIcon className="size-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isEditMode ? "Edit Employee" : "Add Employee"}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {isEditMode ? "Update employee information" : "Fill in the details to create a new employee"}
              </p>
            </div>
          </div>
          <Button variant="outlined" onClick={() => navigate("/allEmployees")}>
            Back to Employees
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-500 dark:bg-dark-750">
            <h4 className="mb-5 flex items-center gap-2 text-base font-semibold text-primary-600 dark:text-primary-400">
              <UserIcon className="size-5" />
              Basic Information
            </h4>

            <div className="grid gap-5 md:grid-cols-2">
              <Input
                {...register("full_name")}
                prefix={<UserIcon className="size-4" />}
                placeholder="Enter full name"
                label={<>Full Name <span className="text-red-500">*</span></>}
                error={errors.full_name?.message}
              />

              <Controller
                control={control}
                name="department"
                rules={{ required: "Department is required" }}
                render={({ field: { value, onChange, ...rest } }) => (
                  <Listbox
                    data={DEPARTMENT_OPTIONS}
                    placeholder="Select Department *"
                    value={DEPARTMENT_OPTIONS.find((o) => o.id === value) ?? null}
                    onChange={(item: any) => onChange(item?.id ?? "")}
                    label={<>Department <span className="text-red-500">*</span></>}
                    displayField="label"
                    error={errors.department?.message}
                    {...rest}
                  />
                )}
              />
            </div>
          </div>

          {/* Contact Details */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-500 dark:bg-dark-750">
            <h4 className="mb-5 flex items-center gap-2 text-base font-semibold text-primary-600 dark:text-primary-400">
              <DevicePhoneMobileIcon className="size-5" />
              Contact Details
            </h4>

            <div className="grid gap-5 md:grid-cols-2">
              <Input
                {...register("mobile")}
                prefix={<DevicePhoneMobileIcon className="size-4" />}
                placeholder="10 digit mobile"
                label={<>Mobile No. <span className="text-red-500">*</span></>}
                maxLength={10}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setValue("mobile", value);
                }}
                error={errors.mobile?.message}
              />

              <Input
                {...register("email")}
                prefix={<EnvelopeIcon className="size-4" />}
                placeholder="email@gmail.com"
                label={<>Login Email <span className="text-red-500">*</span></>}
                type="email"
                disabled={isEditMode}
                error={errors.email?.message}
                className={isEditMode ? "bg-gray-100 dark:bg-dark-800 cursor-not-allowed" : ""}
              />
            </div>
            {isEditMode && (
              <p className="mt-2 text-xs text-gray-400 dark:text-dark-500">
                Login email cannot be changed
              </p>
            )}

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <Input
                {...register("city")}
                prefix={<MapPinIcon className="size-4" />}
                placeholder="Enter city"
                label="City"
              />
            </div>

            <div className="mt-5">
              <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-dark-200">
                Address
              </label>
              <div className="flex items-start gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2.5 dark:border-dark-500 dark:bg-dark-800 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <MapPinIcon className="mt-0.5 size-4 shrink-0 text-gray-400" />
                <textarea
                  {...register("address")}
                  rows={2}
                  placeholder="Enter full address"
                  className="w-full resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none dark:text-dark-100"
                />
              </div>
            </div>
          </div>

          {/* Login Credentials */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-500 dark:bg-dark-750">
            <h4 className="mb-5 flex items-center gap-2 text-base font-semibold text-primary-600 dark:text-primary-400">
              <BuildingLibraryIcon className="size-5" />
              Login Credentials
            </h4>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-dark-200">
                {isEditMode ? "New Password (optional)" : "Password"}{" "}
                {!isEditMode && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <div className="flex items-start gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2.5 dark:border-dark-500 dark:bg-dark-800 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                  <BuildingLibraryIcon className="mt-0.5 size-4 shrink-0 text-gray-400" />
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder={isEditMode ? "Leave blank to keep current" : "Enter password"}
                    className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none dark:text-dark-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-dark-300"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="size-4" />
                    ) : (
                      <EyeIcon className="size-4" />
                    )}
                  </button>
                </div>
                {errors.password?.message && (
                  <p className="mt-1 text-xs text-error">{errors.password.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-2">
            <Button
              type="submit"
              color="primary"
              className="min-w-[160px] gap-2"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <CheckIcon className="size-4" />
                  {isEditMode ? "Update Employee" : "Create Employee"}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outlined"
              onClick={() => navigate("/allEmployees")}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Page>
  );
}