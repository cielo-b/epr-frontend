"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authService, User } from "@/lib/auth";
import { canCreateProjects } from "@/lib/roles";
import api from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";

export default function ProjectsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmProject, setConfirmProject] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [files, setFiles] = useState<FileList | null>(null);
  const [fileDescription, setFileDescription] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "PLANNING",
    startDate: "",
    endDate: "",
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
    loadProjects();
  }, [router]);

  useEffect(() => {
    setPage(1);
  }, [projects.length]);

  const loadProjects = async () => {
    try {
      const response = await api.get("/projects");
      setProjects(response.data);
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = useMemo(
    () => ["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"],
    []
  );

  const openCreateModal = () => {
    setSelectedProject(null);
    setForm({
      name: "",
      description: "",
      status: "PLANNING",
      startDate: "",
      endDate: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (project: any) => {
    setSelectedProject(project);
    setForm({
      name: project.name || "",
      description: project.description || "",
      status: project.status || "PLANNING",
      startDate: project.startDate ? project.startDate.slice(0, 10) : "",
      endDate: project.endDate ? project.endDate.slice(0, 10) : "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedProject(null);
    setForm({
      name: "",
      description: "",
      status: "PLANNING",
      startDate: "",
      endDate: "",
    });
    setFiles(null);
    setFileDescription("");
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const saveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        name: form.name,
        description: form.description,
        status: form.status,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      };

      if (selectedProject) {
        await api.patch(`/projects/${selectedProject.id}`, payload);
        addToast("Project updated successfully");
      } else {
        const res = await api.post("/projects", payload);
        const created = res.data;
        addToast("Project created successfully");

        if (files && files.length > 0) {
          const formData = new FormData();
          Array.from(files).forEach((file) => formData.append("files", file));
          if (fileDescription) formData.append("description", fileDescription);
          await api.post(`/documents/upload-many/${created.id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          addToast("Files uploaded");
        }
      }

      await loadProjects();
      closeModal();
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to save project. Please try again.";
      addToast(Array.isArray(message) ? message.join(", ") : message, "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (project: any) => {
    setConfirmProject(project);
    setConfirmOpen(true);
  };

  const deleteProject = async () => {
    if (!confirmProject) return;
    try {
      await api.delete(`/projects/${confirmProject.id}`);
      addToast("Project deleted successfully");
      await loadProjects();
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to delete project. Please try again.";
      addToast(Array.isArray(message) ? message.join(", ") : message, "error");
    } finally {
      setConfirmOpen(false);
      setConfirmProject(null);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(projects.length / pageSize));
  const paginatedProjects = projects.slice((page - 1) * pageSize, page * pageSize);

  return (
    <AppShell
      title="Projects"
      subtitle="Manage projects and timelines"
      userName={`${user.firstName} ${user.lastName}`}
    >
      <>
        <div className="flex justify-end mb-4">
          {canCreateProjects(user.role) && (
            <button onClick={openCreateModal} className="btn btn-primary">
              Create Project
            </button>
          )}
        </div>
        <div className="bg-white border border-[var(--border-subtle)] rounded-lg shadow-sm">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Manager</th>
                <th>Developers</th>
                <th>Dates</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProjects.map((project) => (
                <tr key={project.id}>
                  <td className="font-medium">
                    {project.name}
                    <div className="text-xs text-gray-500 line-clamp-1">
                      {project.description}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-success">{project.status}</span>
                  </td>
                  <td className="text-sm text-gray-700">
                    {project.manager
                      ? `${project.manager.firstName} ${project.manager.lastName}`
                      : "—"}
                  </td>
                  <td className="text-sm text-gray-700">
                    {project._count?.assignments || project.assignments?.length || 0}
                  </td>
                  <td className="text-sm text-gray-700">
                    {project.startDate
                      ? new Date(project.startDate).toLocaleDateString()
                      : "No start"}{" "}
                    –{" "}
                    {project.endDate
                      ? new Date(project.endDate).toLocaleDateString()
                      : "No end"}
                  </td>
                  <td className="text-right space-x-2">
                    <Link href={`/projects/${project.id}`} className="btn btn-ghost btn-sm">
                      View
                    </Link>
                    {canCreateProjects(user.role) && (
                      <>
                        <button
                          onClick={() => openEditModal(project)}
                          className="btn btn-primary btn-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => confirmDelete(project)}
                          className="btn btn-danger btn-sm"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-sm text-gray-500">
                    No projects found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {projects.length > 0 && (
          <div className="flex items-center justify-between mt-4 text-sm text-gray-700">
            <div>
              Page {page} of {totalPages} ({projects.length} projects)
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

        {modalOpen && (
          <div className="modal-overlay">
            <div className="modal-card max-w-2xl">
              <div className="modal-header">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  {selectedProject ? "Edit Project" : "Create Project"}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={saveProject} className="modal-body space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="label">Name</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      className="input"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Description</label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      rows={3}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Status</label>
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className="input"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={form.startDate}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={form.endDate}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Attach Files (optional)</label>
                    <input
                      type="file"
                      multiple
                      onChange={handleFilesChange}
                      className="file-input"
                    />
                    <input
                      type="text"
                      name="fileDescription"
                      value={fileDescription}
                      onChange={(e) => setFileDescription(e.target.value)}
                      placeholder="Description for attached files (optional)"
                      className="input mt-2"
                    />
                  </div>
                </div>
                <div className="modal-footer pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                    className="btn btn-ghost"
                >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary"
                  >
                    {saving ? "Saving..." : selectedProject ? "Save Changes" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {confirmOpen && confirmProject && (
          <div className="modal-overlay">
            <div className="modal-card max-w-md">
              <div className="modal-header">
                <h3 className="text-lg font-semibold text-gray-900">Delete Project</h3>
              </div>
              <div className="modal-body space-y-2">
                <p className="text-sm text-gray-700">
                  Are you sure you want to delete "{confirmProject.name}"? This action cannot be undone.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  onClick={() => {
                    setConfirmOpen(false);
                    setConfirmProject(null);
                  }}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button onClick={deleteProject} className="btn btn-danger">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    </AppShell>
  );
}
