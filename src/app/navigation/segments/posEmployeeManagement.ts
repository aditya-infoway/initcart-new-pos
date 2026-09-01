import { NavigationTree } from "@/@types/navigation";

export const posEmployeeManagement: NavigationTree = {
  id: "posEmployeeManagement",
  type: "collapse",
  path: "/allEmployees",
  title: "Employee Management",
  icon: "posEmployeeManagement",
  superAdminOnly: true,
  childs: [
    { id: "posEmployeeManagement.employeeMaster", type: "item", path: "/allEmployees", title: "Employee Master", icon: "posEmployeeManagement.employeeMaster" },
  ],
};
