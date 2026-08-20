import { NavigationTree } from "@/@types/navigation";

export const posEmployeeManagement: NavigationTree = {
  id: "posEmployeeManagement",
  type: "collapse",
  path: "/employee-management",
  title: "Employee Management",
  icon: "posEmployeeManagement",
  childs: [
    { id: "posEmployeeManagement.employeeMaster", type: "item", path: "/employee-management/employee-master", title: "Employee Master", icon: "posEmployeeManagement.employeeMaster" },
  ],
};
