// src/hooks/usePermissions.ts
interface Permission {
  page_key: string;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

function getPermissions(): Permission[] {
  try {
    const raw = localStorage.getItem("permissions");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const usePermission = (pageKey: string) => {
  const role = localStorage.getItem("role");
  const permissions = getPermissions();

  const hasPermission = (action: "view" | "add" | "edit" | "delete") => {
    // superadmin ya branch-admin (non-employee) ko full access
    if (role !== "employee") return true;

    const perm = permissions.find((p) => p.page_key === pageKey);
    if (!perm) return false;

    if (action === "view") return perm.can_view;
    if (action === "add") return perm.can_add;
    if (action === "edit") return perm.can_edit;
    if (action === "delete") return perm.can_delete;
    return false;
  };

  return {
    canView: hasPermission("view"),
    canAdd: hasPermission("add"),
    canEdit: hasPermission("edit"),
    canDelete: hasPermission("delete"),
  };
};