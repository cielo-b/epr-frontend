export enum UserRole {
  BOSS = "BOSS",
  SUPERADMIN = "SUPERADMIN",
  SECRETARY = "SECRETARY",
  PROJECT_MANAGER = "PROJECT_MANAGER",
  DEVOPS = "DEVOPS",
  DEVELOPER = "DEVELOPER",
  VISITOR = "VISITOR",
  OTHER = "OTHER",
}

export const canCreateUsers = (role: string): boolean => {
  return role === UserRole.BOSS || role === UserRole.SUPERADMIN || role === UserRole.PROJECT_MANAGER;
};

export const canCreateProjects = (role: string): boolean => {
  return [UserRole.PROJECT_MANAGER, UserRole.BOSS, UserRole.SUPERADMIN].includes(
    role as UserRole,
  );
};

export const canAssignDevelopers = (role: string): boolean => {
  return [UserRole.PROJECT_MANAGER, UserRole.BOSS, UserRole.SUPERADMIN].includes(
    role as UserRole,
  );
};

export const canOverseeAllProjects = (role: string): boolean => {
  return [UserRole.BOSS, UserRole.DEVOPS, UserRole.SUPERADMIN, UserRole.PROJECT_MANAGER].includes(
    role as UserRole
  );
};

export const getRoleDisplayName = (role: string): string => {
  const roleMap: Record<string, string> = {
    BOSS: "Boss",
    SUPERADMIN: "Super Admin",
    SECRETARY: "Secretary",
    PROJECT_MANAGER: "Project Manager",
    DEVOPS: "DevOps",
    DEVELOPER: "Developer",
    VISITOR: "Visitor",
    OTHER: "Other",
  };
  return roleMap[role] || role;
};
