"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api, { API_URL } from "@/lib/api";
import { authService, User } from "@/lib/auth";
import { UserRole, canAssignDevelopers, canCreateProjects } from "@/lib/roles";
import { useToast } from "@/components/ToastProvider";
import { AppShell } from "@/components/AppShell";

type Project = {
  id: string;
  name: string;
  description?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  manager?: { firstName: string; lastName: string };
  creator?: { firstName: string; lastName: string };
  assignments?: {
    id: string;
    developerId: string;
    developer: { id: string; firstName: string; lastName: string; email: string };
  }[];
};

type ProjectDocument = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  description?: string;
  isArchived?: boolean;
};

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [developers, setDevelopers] = useState<any[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [assignForm, setAssignForm] = useState({
    developerId: "",
    notes: "",
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    status: "PLANNING",
    startDate: "",
    endDate: "",
  });
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docFiles, setDocFiles] = useState<FileList | null>(null);
  const [docDescription, setDocDescription] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    type: "archive" | "unarchive" | "hardDelete" | "removeDeveloper" | null;
    targetId: string | null;
    label: string;
  }>({ type: null, targetId: null, label: "" });
  const statusOptions = useMemo(
    () => ["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"],
    []
  );

  useEffect(() => {
    const current = authService.getUser();
    if (!current) {
      router.push("/login");
      return;
    }
    setUser(current);
    loadProject();
    // preload developers if user can assign
    if (canAssignDevelopers(current.role)) {
      loadDevelopers();
    }
    loadDocuments();
  }, [params.id, router, showArchived]);

  const loadProject = async () => {
    try {
      const response = await api.get(`/projects/${params.id}`);
      setProject(response.data);
      setEditForm({
        name: response.data.name || "",
        description: response.data.description || "",
        status: response.data.status || "PLANNING",
        startDate: response.data.startDate ? response.data.startDate.slice(0, 10) : "",
        endDate: response.data.endDate ? response.data.endDate.slice(0, 10) : "",
      });
    } catch (error) {
      addToast("Failed to load project details.", "error");
      router.push("/projects");
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      const response = await api.get(`/documents/project/${params.id}`, {
        params: { includeArchived: showArchived },
      });
      setDocuments(response.data || []);
    } catch (error) {
      // surface via toast only if necessary
    }
  };

  const loadDevelopers = async () => {
    try {
      const response = await api.get("/users/role/DEVELOPER");
      setDevelopers(response.data || []);
    } catch (error) {
      addToast("Failed to load developers list.", "error");
    }
  };

  const handleAssignChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setAssignForm((prev) => ({ ...prev, [name]: value }));
  };

  const assignDeveloper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.developerId) {
      addToast("Please select a developer.", "error");
      return;
    }
    setAssigning(true);
    try {
      await api.post(`/projects/${params.id}/assign-developer`, {
        developerId: assignForm.developerId,
        notes: assignForm.notes || undefined,
      });
      addToast("Developer assigned successfully.");
      setAssignForm({ developerId: "", notes: "" });
      await loadProject();
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to assign developer.";
      addToast(Array.isArray(message) ? message.join(", ") : message, "error");
    } finally {
      setAssigning(false);
    }
  };

  const removeDeveloper = async (developerId: string) => {
    setRemoving(developerId);
    try {
      await api.delete(`/projects/${params.id}/developers/${developerId}`);
      addToast("Developer removed successfully.");
      await loadProject();
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to remove developer.";
      addToast(Array.isArray(message) ? message.join(", ") : message, "error");
    } finally {
      setRemoving(null);
    }
  };

  const handleDocsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocFiles(e.target.files);
  };

  const uploadDocuments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFiles || docFiles.length === 0) {
      addToast("Please select at least one file.", "error");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(docFiles).forEach((file) => formData.append("files", file));
      if (docDescription) formData.append("description", docDescription);
      await api.post(`/documents/upload-many/${params.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      addToast("Files uploaded.");
      setDocFiles(null);
      setDocDescription("");
      await loadDocuments();
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to upload files.";
      addToast(Array.isArray(message) ? message.join(", ") : message, "error");
    } finally {
      setUploading(false);
    }
  };

  const archiveDocument = async (id: string) => {
    try {
      await api.delete(`/documents/${id}`);
      addToast("Document archived.");
      await loadDocuments();
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to archive document.";
      addToast(Array.isArray(message) ? message.join(", ") : message, "error");
    }
  };

  const unarchiveDocument = async (id: string) => {
    try {
      await api.patch(`/documents/${id}/unarchive`);
      addToast("Document unarchived.");
      await loadDocuments();
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to unarchive document.";
      addToast(Array.isArray(message) ? message.join(", ") : message, "error");
    }
  };

  const hardDeleteDocument = async (id: string) => {
    try {
      await api.delete(`/documents/${id}/hard`);
      addToast("Document permanently deleted.");
      await loadDocuments();
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to delete document.";
      addToast(Array.isArray(message) ? message.join(", ") : message, "error");
    }
  };

  const downloadDocument = async (doc: ProjectDocument) => {
    try {
      setDownloadingId(doc.id);
      const response = await api.get(`/documents/${doc.id}/download`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: response.headers["content-type"] || "application/octet-stream" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const disposition = response.headers["content-disposition"];
      let filename = doc.originalName || "file";
      if (disposition) {
        const match = disposition.match(/filename="?(.+?)"?($|;)/);
        if (match && match[1]) filename = match[1];
      }
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to download document.";
      addToast(Array.isArray(message) ? message.join(", ") : message, "error");
    } finally {
      setDownloadingId(null);
    }
  };

  const openEditModal = () => {
    if (!project) return;
    setEditForm({
      name: project.name || "",
      description: project.description || "",
      status: project.status || "PLANNING",
      startDate: project.startDate ? project.startDate.slice(0, 10) : "",
      endDate: project.endDate ? project.endDate.slice(0, 10) : "",
    });
    setEditModalOpen(true);
  };

  const saveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch(`/projects/${params.id}`, {
        name: editForm.name,
        description: editForm.description,
        status: editForm.status,
        startDate: editForm.startDate ? new Date(editForm.startDate).toISOString() : undefined,
        endDate: editForm.endDate ? new Date(editForm.endDate).toISOString() : undefined,
      });
      addToast("Project updated successfully.");
      setEditModalOpen(false);
      await loadProject();
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to save project.";
      addToast(Array.isArray(message) ? message.join(", ") : message, "error");
    }
  };

  if (loading || !user || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const canEdit = canCreateProjects(user.role);
  const canAssign = canAssignDevelopers(user.role);
  const canManageDocs =
    canEdit || canAssign || [UserRole.BOSS, UserRole.DEVOPS, UserRole.SUPERADMIN].includes(user.role as UserRole);

  return (
    <AppShell title="Project Details" subtitle={project.name} userName={`${user.firstName} ${user.lastName}`}>
      <main className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Link href="/projects" className="text-brand-green-600 hover:text-brand-green-800 text-sm">
            ← Back to Projects
          </Link>
          <span className="text-sm text-[var(--text-secondary)]">
            {user.firstName} {user.lastName}
          </span>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">
                {project.description || "No description provided."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="badge badge-success">{project.status}</span>
              {canEdit && (
                <button onClick={openEditModal} className="btn btn-primary btn-sm">
                  Edit
                </button>
              )}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <div className="font-semibold text-gray-800">Manager</div>
              <div>
                {project.manager ? `${project.manager.firstName} ${project.manager.lastName}` : "N/A"}
              </div>
            </div>
            <div>
              <div className="font-semibold text-gray-800">Creator</div>
              <div>
                {project.creator ? `${project.creator.firstName} ${project.creator.lastName}` : "N/A"}
              </div>
            </div>
            <div>
              <div className="font-semibold text-gray-800">Start / End</div>
              <div>
                {project.startDate ? new Date(project.startDate).toLocaleDateString() : "No start"} –{" "}
                {project.endDate ? new Date(project.endDate).toLocaleDateString() : "No end"}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Assigned Developers</h2>
          </div>
          {project.assignments && project.assignments.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {project.assignments.map((a) => (
                <li key={a.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {a.developer?.firstName} {a.developer?.lastName}
                    </p>
                    <p className="text-xs text-gray-600">{a.developer?.email}</p>
                  </div>
                  {canAssign && (
                    <button
                      onClick={() =>
                        setConfirmModal({
                          type: "removeDeveloper",
                          targetId: a.developerId,
                          label: `${a.developer?.firstName || ""} ${a.developer?.lastName || ""}`.trim(),
                        })
                      }
                      disabled={removing === a.developerId}
                      className="px-3 py-1 text-xs rounded-md bg-brand-red-100 text-brand-red-800 hover:bg-brand-red-200 disabled:opacity-60"
                    >
                      {removing === a.developerId ? "Removing..." : "Remove"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-600">No developers assigned.</p>
          )}

          {canAssign && (
            <form onSubmit={assignDeveloper} className="mt-6 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Select Developer</label>
                  <select
                    name="developerId"
                    value={assignForm.developerId}
                    onChange={handleAssignChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-green-500 focus:ring-brand-green-500"
                    required
                  >
                    <option value="">-- Choose developer --</option>
                    {developers.map((dev) => (
                      <option key={dev.id} value={dev.id}>
                        {dev.firstName} {dev.lastName} ({dev.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
                  <input
                    name="notes"
                    value={assignForm.notes}
                    onChange={handleAssignChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-green-500 focus:ring-brand-green-500"
                    placeholder="e.g., scope or responsibilities"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={assigning} className="btn btn-primary">
                  {assigning ? "Assigning..." : "Assign Developer"}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-700 flex items-center gap-2">
                <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
                Show archived
              </label>
            </div>
          </div>
          {documents.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {documents.map((doc) => (
                <li key={doc.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.originalName}</p>
                    <p className="text-xs text-gray-600">
                      {(doc.size / 1024).toFixed(1)} KB • {doc.mimeType}
                    </p>
                    {doc.description && <p className="text-xs text-gray-500 mt-1">{doc.description}</p>}
                    {doc.isArchived && <p className="text-xs text-yellow-700 mt-1">Archived</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        downloadDocument(doc);
                      }}
                      className="text-xs text-brand-green-700 hover:underline"
                    >
                      {downloadingId === doc.id ? "Downloading..." : "Download"}
                    </Link>
                    {canManageDocs && (
                      <div className="flex items-center gap-2">
                        {doc.isArchived ? (
                          <>
                            <button
                              onClick={() =>
                                setConfirmModal({
                                  type: "unarchive",
                                  targetId: doc.id,
                                  label: doc.originalName,
                                })
                              }
                              className="text-xs px-3 py-1 rounded-md bg-brand-green-100 text-brand-green-800 hover:bg-brand-green-200"
                            >
                              Unarchive
                            </button>
                            <button
                              onClick={() =>
                                setConfirmModal({
                                  type: "hardDelete",
                                  targetId: doc.id,
                                  label: doc.originalName,
                                })
                              }
                              className="text-xs px-3 py-1 rounded-md bg-brand-red-100 text-brand-red-800 hover:bg-brand-red-200"
                            >
                              Delete permanently
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() =>
                              setConfirmModal({
                                type: "archive",
                                targetId: doc.id,
                                label: doc.originalName,
                              })
                            }
                            className="text-xs px-3 py-1 rounded-md bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          >
                            Archive
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-600">No documents uploaded.</p>
          )}

          {canManageDocs && (
            <form onSubmit={uploadDocuments} className="mt-6 space-y-3">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Upload Files</label>
                <input
                  type="file"
                  multiple
                  onChange={handleDocsChange}
                  className="mt-1 block w-full text-sm text-gray-700"
                />
                <div className="text-xs text-gray-500">
                  Accepted: any file. Tip: select multiple to batch upload.
                </div>
                {docFiles && docFiles.length > 0 && (
                  <div className="text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-md p-2 space-y-1">
                    <div className="font-medium">Selected files ({docFiles.length}):</div>
                    <ul className="list-disc list-inside space-y-0.5">
                      {Array.from(docFiles).slice(0, 5).map((file) => (
                        <li key={file.name}>
                          {file.name} <span className="text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                        </li>
                      ))}
                      {docFiles.length > 5 && <li className="text-gray-500">+{docFiles.length - 5} more</li>}
                    </ul>
                    <button
                      type="button"
                      onClick={() => setDocFiles(null)}
                      className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline"
                    >
                      Clear selection
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description (optional)</label>
                <input
                  type="text"
                  value={docDescription}
                  onChange={(e) => setDocDescription(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-green-500 focus:ring-brand-green-500"
                  placeholder="Applies to all uploaded files"
                />
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={uploading || !docFiles || docFiles.length === 0} className="btn btn-primary">
                  {uploading ? "Uploading..." : "Upload Files"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {confirmModal.type && confirmModal.targetId && (
        <div className="modal-overlay">
          <div className="modal-card max-w-md">
            <div className="modal-header">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Please Confirm</h3>
            </div>
            <div className="modal-body space-y-2">
              <p className="text-sm text-[var(--text-secondary)]">
                {confirmModal.type === "archive" &&
                  `Archive "${confirmModal.label}"? It will be hidden but not deleted.`}
                {confirmModal.type === "unarchive" &&
                  `Unarchive "${confirmModal.label}"? It will become visible again.`}
                {confirmModal.type === "hardDelete" &&
                  `Permanently delete "${confirmModal.label}"? This cannot be undone.`}
                {confirmModal.type === "removeDeveloper" &&
                  `Remove ${confirmModal.label || "this developer"} from the project?`}
              </p>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setConfirmModal({ type: null, targetId: null, label: "" })}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const { type, targetId } = confirmModal;
                  if (!type || !targetId) return;
                  setConfirmModal({ type: null, targetId: null, label: "" });
                  if (type === "archive") {
                    await archiveDocument(targetId);
                  } else if (type === "unarchive") {
                    await unarchiveDocument(targetId);
                  } else if (type === "hardDelete") {
                    await hardDeleteDocument(targetId);
                  } else if (type === "removeDeveloper") {
                    await removeDeveloper(targetId);
                  }
                }}
                className={`btn ${
                  confirmModal.type === "hardDelete" || confirmModal.type === "removeDeveloper"
                    ? "btn-danger"
                    : confirmModal.type === "unarchive"
                    ? "btn-primary"
                    : "btn-warn"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {editModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card max-w-2xl">
            <div className="modal-header">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Edit Project</h3>
              <button
                onClick={() => setEditModalOpen(false)}
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
                    value={editForm.name}
                    onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                    required
                    className="input"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Description</label>
                  <textarea
                    name="description"
                    value={editForm.description}
                    onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                    rows={3}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select
                    name="status"
                    value={editForm.status}
                    onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
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
                    value={editForm.startDate}
                    onChange={(e) => setEditForm((p) => ({ ...p, startDate: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={editForm.endDate}
                    onChange={(e) => setEditForm((p) => ({ ...p, endDate: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>
              <div className="modal-footer pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

