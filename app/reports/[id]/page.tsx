"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { authService, User } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import { AppShell } from "@/components/AppShell";

type Report = {
  id: string;
  title: string;
  content: string;
  type: string;
  project?: { id: string; name: string } | null;
  createdBy?: { firstName: string; lastName: string } | null;
  createdAt: string;
};

type ReportDocument = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  description?: string;
  isArchived?: boolean;
};

export default function ReportDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: "",
    content: "",
    type: "PROJECT_REPORT",
    projectId: "",
  });
  const [documents, setDocuments] = useState<ReportDocument[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docFiles, setDocFiles] = useState<FileList | null>(null);
  const [docDescription, setDocDescription] = useState("");
  const [docModal, setDocModal] = useState<{
    type: "archive" | "unarchive" | "hardDelete" | null;
    targetId: string | null;
    label: string;
  }>({ type: null, targetId: null, label: "" });
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const typeOptions = ["PROJECT_REPORT", "USER_REPORT", "SYSTEM_REPORT", "OTHER"];

  useEffect(() => {
    const current = authService.getUser();
    if (!current) {
      router.push("/login");
      return;
    }
    setUser(current);
    loadReport();
    loadProjects();
    loadDocuments(showArchived);
  }, [params.id, router, showArchived]);

  const loadReport = async () => {
    try {
      const response = await api.get(`/reports/${params.id}`);
      setReport(response.data);
      setForm({
        title: response.data.title,
        content: response.data.content,
        type: response.data.type,
        projectId: response.data.project?.id || "",
      });
    } catch (error) {
      addToast("Failed to load report.", "error");
      router.push("/reports");
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async (includeArchived: boolean) => {
    try {
      const response = await api.get(`/documents/report/${params.id}`, {
        params: { includeArchived },
      });
      setDocuments(response.data || []);
    } catch {
      // ignore
    }
  };

  const loadProjects = async () => {
    try {
      const response = await api.get("/projects");
      setProjects(response.data || []);
    } catch {
      // ignore
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report) return;
    setSaving(true);
    try {
      await api.patch(`/reports/${report.id}`, {
        title: form.title,
        content: form.content,
        type: form.type,
        projectId: form.projectId || undefined,
      });
      addToast("Report updated.");
      setEditing(false);
      await loadReport();
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to update report. Please try again.";
      addToast(Array.isArray(message) ? message.join(", ") : message, "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteReport = async () => {
    if (!report) return;
    try {
      await api.delete(`/reports/${report.id}`);
      addToast("Report deleted.");
      router.push("/reports");
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to delete report.";
      addToast(Array.isArray(message) ? message.join(", ") : message, "error");
    } finally {
      setConfirmOpen(false);
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
      await api.post(`/documents/upload-many-report/${params.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      addToast("Files uploaded.");
      setDocFiles(null);
      setDocDescription("");
      await loadDocuments(showArchived);
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
      await loadDocuments(showArchived);
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to archive document.";
      addToast(Array.isArray(message) ? message.join(", ") : message, "error");
    }
  };

  const unarchiveDocument = async (id: string) => {
    try {
      await api.patch(`/documents/${id}/unarchive`);
      addToast("Document unarchived.");
      await loadDocuments(showArchived);
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to unarchive document.";
      addToast(Array.isArray(message) ? message.join(", ") : message, "error");
    }
  };

  const hardDeleteDocument = async (id: string) => {
    try {
      await api.delete(`/documents/${id}/hard`);
      addToast("Document permanently deleted.");
      await loadDocuments(showArchived);
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to delete document.";
      addToast(Array.isArray(message) ? message.join(", ") : message, "error");
    }
  };

  const downloadDocument = async (doc: ReportDocument) => {
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

  if (loading || !user || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <AppShell
      title="Report Details"
      subtitle={report.title}
      userName={`${user.firstName} ${user.lastName}`}
    >
      <main className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Link href="/reports" className="text-brand-green-600 hover:text-brand-green-800 text-sm">
            ← Back to Reports
          </Link>
          <span className="text-sm text-[var(--text-secondary)]">
            {user.firstName} {user.lastName}
          </span>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
                <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">
                  {report.content}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                  {report.type}
                </span>
                <button
                  onClick={() => setEditing(true)}
                  className="btn btn-primary btn-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => setConfirmOpen(true)}
                  className="btn btn-danger btn-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <div className="font-semibold text-gray-800">Created by</div>
              <div>
                {report.createdBy
                  ? `${report.createdBy.firstName} ${report.createdBy.lastName}`
                  : "Unknown"}
              </div>
            </div>
            <div>
              <div className="font-semibold text-gray-800">Created at</div>
              <div>{new Date(report.createdAt).toLocaleString()}</div>
            </div>
            <div className="sm:col-span-2">
              <div className="font-semibold text-gray-800">Project</div>
              <div>
                {report.project ? (
                  <span className="badge badge-muted">{report.project.name}</span>
                ) : (
                  <span className="badge badge-muted">Unassigned</span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Attachments</h2>
              <label className="text-sm text-gray-700 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                />
                Show archived
              </label>
            </div>
            {documents.length > 0 ? (
              <ul className="divide-y divide-[var(--border-subtle)]">
                {documents.map((doc) => (
                  <li key={doc.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.originalName}</p>
                      <p className="text-xs text-gray-600">
                        {(doc.size / 1024).toFixed(1)} KB • {doc.mimeType}
                      </p>
                      {doc.description && (
                        <p className="text-xs text-gray-500 mt-1">{doc.description}</p>
                      )}
                      {doc.isArchived && (
                        <p className="text-xs text-yellow-700 mt-1">Archived</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => downloadDocument(doc)}
                        className="text-xs text-brand-green-700 hover:underline"
                      >
                        {downloadingId === doc.id ? "Downloading..." : "Download"}
                      </button>
                      {!doc.isArchived ? (
                        <button
                          onClick={() =>
                            setDocModal({
                              type: "archive",
                              targetId: doc.id,
                              label: doc.originalName,
                            })
                          }
                            className="btn btn-warn btn-sm"
                        >
                          Archive
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() =>
                              setDocModal({
                                type: "unarchive",
                                targetId: doc.id,
                                label: doc.originalName,
                              })
                            }
                            className="btn btn-primary btn-sm"
                          >
                            Unarchive
                          </button>
                          <button
                            onClick={() =>
                              setDocModal({
                                type: "hardDelete",
                                targetId: doc.id,
                                label: doc.originalName,
                              })
                            }
                            className="btn btn-danger btn-sm"
                          >
                            Delete permanently
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--text-secondary)]">No attachments.</p>
            )}

            <form onSubmit={uploadDocuments} className="mt-6 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Upload Files
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleDocsChange}
                  className="file-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={docDescription}
                  onChange={(e) => setDocDescription(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-green-500 focus:ring-brand-green-500"
                  placeholder="Applies to all uploaded files"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={uploading}
                  className="btn btn-primary"
                >
                  {uploading ? "Uploading..." : "Upload Files"}
                </button>
              </div>
            </form>
          </div>
        </main>

      {docModal.type && docModal.targetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Please Confirm</h3>
            </div>
            <div className="px-6 py-4 space-y-2">
              <p className="text-sm text-gray-700">
                {docModal.type === "archive" &&
                  `Archive "${docModal.label}"? It will be hidden but not deleted.`}
                {docModal.type === "unarchive" &&
                  `Unarchive "${docModal.label}"? It will become visible again.`}
                {docModal.type === "hardDelete" &&
                  `Permanently delete "${docModal.label}"? This cannot be undone.`}
              </p>
            </div>
            <div className="px-6 py-4 border-t flex justify-end space-x-3">
              <button
                onClick={() => setDocModal({ type: null, targetId: null, label: "" })}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const { type, targetId } = docModal;
                  if (!type || !targetId) return;
                  setDocModal({ type: null, targetId: null, label: "" });
                  if (type === "archive") {
                    await archiveDocument(targetId);
                  } else if (type === "unarchive") {
                    await unarchiveDocument(targetId);
                  } else if (type === "hardDelete") {
                    await hardDeleteDocument(targetId);
                  }
                }}
                className={`btn ${
                  docModal.type === "hardDelete"
                    ? "btn-danger"
                    : docModal.type === "unarchive"
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
      {editing && (
        <div className="modal-overlay">
          <div className="modal-card max-w-2xl">
            <div className="modal-header">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Edit Report</h3>
              <button
                onClick={() => setEditing(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <form onSubmit={saveReport} className="modal-body space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">Title</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    required
                    className="input"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Content</label>
                  <textarea
                    name="content"
                    value={form.content}
                    onChange={handleChange}
                    rows={4}
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Type</label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="input"
                  >
                    {typeOptions.map((t) => (
                      <option key={t} value={t}>
                        {t.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Project (optional)</label>
                  <select
                    name="projectId"
                    value={form.projectId}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="">Unassigned</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer pt-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                  className="btn btn-ghost"
              >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmOpen && (
        <div className="modal-overlay">
          <div className="modal-card max-w-md">
            <div className="modal-header">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Please Confirm</h3>
            </div>
            <div className="modal-body space-y-2">
              <p className="text-sm text-[var(--text-secondary)]">
                Delete report "{report.title}"? This cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setConfirmOpen(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button onClick={deleteReport} className="btn btn-danger">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

