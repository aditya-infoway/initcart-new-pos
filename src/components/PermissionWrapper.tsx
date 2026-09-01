import React from "react";
import { usePermission } from "../hooks/usePermissions";

interface PermissionWrapperProps {
  pageKey: string;
  action: "view" | "add" | "edit" | "delete";
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionWrapper: React.FC<PermissionWrapperProps> = ({
  pageKey,
  action,
  children,
  fallback = null,
}) => {
  const permissions = usePermission(pageKey);
  
  const hasPermission = {
    view: permissions.canView,
    add: permissions.canAdd,
    edit: permissions.canEdit,
    delete: permissions.canDelete,
  }[action];

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

interface ConditionalActionProps {
  pageKey: string;
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canView?: boolean;
  children: (permissions: {
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canView: boolean;
  }) => React.ReactNode;
}

export const ConditionalActions: React.FC<ConditionalActionProps> = ({
  pageKey,
  children,
}) => {
  const permissions = usePermission(pageKey);
  return <>{children(permissions)}</>;
};