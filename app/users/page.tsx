"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authService, User } from "@/lib/auth";
import { UserRole, canCreateUsers, getRoleDisplayName } from "@/lib/roles";
import api from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { AppShell } from "@/components/AppShell";
import { TableSkeleton, Skeleton } from "@/components/Skeleton";
import PermissionManager from "@/components/PermissionManager";

export default function UsersPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"toggle" | "delete" | null>(null);
  const [confirmUser, setConfirmUser] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "permissions">("details");
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: UserRole.DEVELOPER,
    isActive: true,
    password: "",
  });
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const currentUser = authService.getUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);
    loadUsers();
  }, [router]);

  useEffect(() => {
    setPage(1);
  }, [users.length]);

  const loadUsers = async () => {
    try {
      const response = await api.get("/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = useMemo(() => Object.values(UserRole), []);

  const openModal = (u: any) => {
    setSelectedUser(u);
    setEditForm({
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      email: u.email || "",
      role: u.role || UserRole.DEVELOPER,
      isActive: u.isActive ?? true,
      password: "",
    });
    setActiveTab(u.role === UserRole.VISITOR ? "permissions" : "details");
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedUser(null);
    setEditForm({
      firstName: "",
      lastName: "",
      email: "",
      role: UserRole.DEVELOPER,
      isActive: true,
      password: "",
    });
    setActiveTab("details");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
    setActiveTab("details");
    setEditForm({
      firstName: "",
      lastName: "",
      email: "",
      role: UserRole.DEVELOPER,
      isActive: true,
      password: "",
    });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const nextValue =
      e.target instanceof HTMLInputElement && e.target.type === "checkbox"
        ? e.target.checked
        : value;
    setEditForm((prev) => ({
      ...prev,
      [name]: nextValue,
    }));
  };

  const saveUser = async () => {
    // Password is now optional. If blank, invitation email is sent.
    setSaving(true);
    try {
      const payload: any = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        role: editForm.role,
        isActive: editForm.isActive,
      };
      if (editForm.password) {
        payload.password = editForm.password;
      }
      if (selectedUser) {
        await api.patch(`/users/${selectedUser.id}`, payload);
        addToast("User updated successfully");
      } else {
        const response = await api.post(`/users`, payload);
        addToast("User created successfully");

        // If VISITOR, open permissions tab
        if (editForm.role === UserRole.VISITOR) {
          setSelectedUser(response.data);
          setActiveTab("permissions");
          setModalOpen(true);
        }
      }
      await loadUsers();
      if (editForm.role !== UserRole.VISITOR) {
        closeModal();
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to save user. Please try again.";
      addToast(Array.isArray(message) ? message.join(", ") : message, "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u: any) => {
    try {
      await api.patch(`/users/${u.id}`, { isActive: !u.isActive });
      addToast(`User ${u.isActive ? "deactivated" : "activated"} successfully`);
      await loadUsers();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        `Failed to ${u.isActive ? "deactivate" : "activate"} user.`;
      addToast(Array.isArray(message) ? message.join(", ") : message, "error");
    }
  };

  const deleteUser = async (u: any) => {
    setDeleting(true);
    try {
      await api.delete(`/users/${u.id}`);
      addToast("User deleted successfully");
      await loadUsers();
      if (selectedUser?.id === u.id) {
        closeModal();
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to delete user. Please try again.";
      addToast(Array.isArray(message) ? message.join(", ") : message, "error");
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !user) {
    return (
      <AppShell
        title="User Management"
        subtitle="Manage access and roles"
        userName={user ? `${user.firstName} ${user.lastName}` : "Loading..."}
        userRole={user?.role}
      >
        <div className="flex justify-end mb-4">
          <Skeleton className="h-10 w-32" />
        </div>
        <TableSkeleton rows={10} columns={5} />
      </AppShell>
    );
  }

  const canManageUsers = canCreateUsers(user.role);
  const totalPages = Math.max(1, Math.ceil(users.length / pageSize));
  const paginatedUsers = users.slice((page - 1) * pageSize, page * pageSize);

  return (
    <AppShell
      title="User Management"
      subtitle="Manage access and roles"
      userName={`${user.firstName} ${user.lastName}`}
      userRole={user.role}
    >
      <>
        <div className="flex justify-end mb-4">
          {canManageUsers && (
            <button onClick={openCreateModal} className="btn btn-primary">
              Create User
            </button>
          )}
        </div>
        <div className="bg-white border border-[var(--border-subtle)] rounded-lg shadow-sm">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((u) => (
                <tr key={u.id}>
                  <td className="font-medium">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="text-sm text-gray-700">{u.email}</td>
                  <td>
                    <span className="badge badge-info">{getRoleDisplayName(u.role)}</span>
                    {u.role === UserRole.VISITOR && (
                      <span className="ml-2 text-xs text-gray-500">(Custom Access)</span>
                    )}
                  </td>
                  <td className="text-sm text-gray-700">
                    <span className={u.isActive ? "badge badge-success" : "badge badge-muted"}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="text-right space-x-2">
                    {canManageUsers ? (
                      <>
                        <button
                          onClick={() => openModal(u)}
                          className="btn btn-ghost btn-sm"
                        >
                          {u.role === UserRole.VISITOR ? "Manage Permissions" : "View / Edit"}
                        </button>
                        <button
                          onClick={() => {
                            setConfirmOpen(true);
                            setConfirmAction("toggle");
                            setConfirmUser(u);
                          }}
                          className={`btn btn-sm ${u.isActive ? "btn-warn" : "btn-primary"
                            }`}
                        >
                          {u.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => {
                            setConfirmOpen(true);
                            setConfirmAction("delete");
                            setConfirmUser(u);
                          }}
                          disabled={deleting}
                          className="btn btn-danger btn-sm"
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">View only</span>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-sm text-gray-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {users.length > 0 && (
          <div className="flex items-center justify-between mt-4 text-sm text-gray-700">
            <div>
              Page {page} of {totalPages} ({users.length} users)
            </div>
            <div className="flex gap-2">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Modal with Tabs */}
        {modalOpen && (
          <div className="modal-overlay">
            <div className="modal-card max-w-4xl">
              <div className="modal-header">
                <div className="flex justify-between items-center w-full">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    {selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : "Create User"}
                  </h3>
                  <button
                    onClick={closeModal}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    aria-label="Close modal"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Tabs for VISITOR users */}
              {(selectedUser?.role === UserRole.VISITOR || editForm.role === UserRole.VISITOR) && selectedUser && (
                <div className="border-b border-gray-200">
                  <nav className="flex -mb-px">
                    <button
                      onClick={() => setActiveTab("details")}
                      className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "details"
                        ? "border-brand-green-500 text-brand-green-700"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                    >
                      User Details
                    </button>
                    <button
                      onClick={() => setActiveTab("permissions")}
                      className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "permissions"
                        ? "border-brand-green-500 text-brand-green-700"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                    >
                      Permissions
                    </button>
                  </nav>
                </div>
              )}

              <div className="modal-body">
                {activeTab === "details" ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label">First Name</label>
                        <input
                          name="firstName"
                          value={editForm.firstName}
                          onChange={handleEditChange}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">Last Name</label>
                        <input
                          name="lastName"
                          value={editForm.lastName}
                          onChange={handleEditChange}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={editForm.email}
                          onChange={handleEditChange}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">Role</label>
                        <select
                          name="role"
                          value={editForm.role}
                          onChange={handleEditChange}
                          className="input"
                        >
                          {roleOptions.map((role) => (
                            <option key={role} value={role}>
                              {getRoleDisplayName(role)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center space-x-2 mt-6">
                        <input
                          id="isActiveModal"
                          name="isActive"
                          type="checkbox"
                          checked={editForm.isActive}
                          onChange={handleEditChange}
                          className="h-4 w-4 text-brand-green-600 border-gray-300 rounded"
                        />
                        <label htmlFor="isActiveModal" className="text-sm text-[var(--text-secondary)]">
                          Active
                        </label>
                      </div>
                    </div>
                    {selectedUser?.createdAt && (
                      <div className="text-sm text-gray-500">
                        Created: {new Date(selectedUser.createdAt).toLocaleString()}
                      </div>
                    )}
                    {editForm.role === UserRole.VISITOR && !selectedUser && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                        <p className="text-sm text-blue-800">
                          💡 After creating this visitor user, you'll be able to configure their specific permissions.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  // Permissions Tab
                  selectedUser && (
                    <PermissionManager
                      userId={selectedUser.id}
                      userName={`${selectedUser.firstName} ${selectedUser.lastName}`}
                    />
                  )
                )}
              </div>

              {activeTab === "details" && (
                <div className="modal-footer">
                  {selectedUser && (
                    <button
                      onClick={() => deleteUser(selectedUser)}
                      disabled={deleting}
                      className="btn btn-danger"
                    >
                      {deleting ? "Deleting..." : "Delete"}
                    </button>
                  )}
                  <button
                    onClick={saveUser}
                    disabled={saving}
                    className="btn btn-primary"
                  >
                    {saving ? "Saving..." : selectedUser ? "Save Changes" : "Create"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        {confirmOpen && confirmUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Please Confirm</h3>
              </div>
              <div className="px-6 py-4 space-y-2">
                <p className="text-sm text-gray-700">
                  {confirmAction === "delete"
                    ? `Delete user ${confirmUser.firstName} ${confirmUser.lastName}? This cannot be undone.`
                    : `${confirmUser.isActive ? "Deactivate" : "Activate"} user ${confirmUser.firstName} ${confirmUser.lastName}?`}
                </p>
              </div>
              <div className="px-6 py-4 border-t flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setConfirmOpen(false);
                    setConfirmAction(null);
                    setConfirmUser(null);
                  }}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!confirmUser || !confirmAction) return;
                    setConfirmOpen(false);
                    if (confirmAction === "toggle") {
                      await toggleActive(confirmUser);
                    } else if (confirmAction === "delete") {
                      await deleteUser(confirmUser);
                    }
                    setConfirmAction(null);
                    setConfirmUser(null);
                  }}
                  className={`btn ${confirmAction === "delete" ? "btn-danger" : "btn-primary"
                    }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    </AppShell>
  );
}
