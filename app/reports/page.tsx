"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authService, User } from "@/lib/auth";
import api from "@/lib/api";
import Link from "next/link";
import { useToast } from "@/components/ToastProvider";
import { AppShell } from "@/components/AppShell";
import { TableSkeleton, Skeleton } from "@/components/Skeleton";

type Report = {
  id: string;
  title: string;
  content: string;
  type: string;
  project?: { id: string; name: string } | null;
  createdById?: string;
  createdBy?: { id?: string; firstName: string; lastName: string } | null;
  createdAt: string;
  confidentiality: "CONFIDENTIAL" | "PUBLIC";
};

export default function ReportsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmReport, setConfirmReport] = useState<Report | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterProject, setFilterProject] = useState<string>("ALL");
  const [form, setForm] = useState({
    title: "",
    content: "",
    type: "PROJECT_REPORT",
    projectId: "",
    confidentiality: "PUBLIC",
  });
  const [files, setFiles] = useState<FileList | null>(null);
  const [fileDescription, setFileDescription] = useState("");

  const typeOptions = useMemo(
    () => ["PROJECT_REPORT", "USER_REPORT", "SYSTEM_REPORT", "OTHER"],
    []
  );

  useEffect(() => {
    const currentUser = authService.getUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);
    loadReports();
    loadProjects();
  }, [router]);

  const loadReports = async () => {
    try {
      const response = await api.get("/reports");
      setReports(response.data);
    } catch (error) {
      addToast("Failed to load reports.", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await api.get("/projects");
      setProjects(response.data || []);
    } catch (error) {
      // ignore silently
    }
  };

  const filteredReports = reports.filter((r) => {
    const matchesType = filterType === "ALL" || r.type === filterType;
    const matchesProject =
      filterProject === "ALL" || r.project?.id === filterProject;
    return matchesType && matchesProject;
  });

  useEffect(() => {
    setPage(1);
  }, [filterType, filterProject, reports.length]);

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / pageSize));
  const paginatedReports = filteredReports.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        title: form.title,
        content: form.content,
        type: form.type,
        projectId: form.projectId || undefined,
        confidentiality: form.confidentiality,
      };
      const res = await api.post("/reports", payload);
      const created = res.data;
      if (files && files.length > 0) {
        const formData = new FormData();
        Array.from(files).forEach((file) => formData.append("files", file));
        if (fileDescription) formData.append("description", fileDescription);
        await api.post(`/documents/upload-many-report/${created.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        addToast("Report created and files uploaded.");
      } else {
        addToast("Report created successfully.");
      }
      setModalOpen(false);
      setForm({ title: "", content: "", type: "PROJECT_REPORT", projectId: "", confidentiality: "PUBLIC" });
      setFiles(null);
      setFileDescription("");
      await loadReports();
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to create report. Please try again.";
      addToast(Array.isArray(message) ? message.join(", ") : message, "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteReport = async (report: Report) => {
    if (!report) return;
    try {
      await api.delete(`/reports/${report.id}`);
      addToast("Report deleted.");
      await loadReports();
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to delete report. Please try again.";
      addToast(Array.isArray(message) ? message.join(", ") : message, "error");
    } finally {
      setConfirmOpen(false);
      setConfirmReport(null);
    }
  };

  if (loading || !user) {
    return (
      <AppShell
        title="Reports"
        subtitle="View and manage reports"
        userName={user ? `${user.firstName} ${user.lastName}` : "Loading..."}
        userRole={user?.role}
      >
        <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Skeleton className="h-8 w-44" />
            <Skeleton className="h-8 w-52" />
          </div>
          <div className="flex justify-end mb-3">
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <TableSkeleton rows={10} columns={6} />
      </AppShell>
    );
  }

  return (
    <>
      <AppShell
        title="Reports"
        subtitle="View and manage reports"
        userName={`${user.firstName} ${user.lastName}`}
        userRole={user.role}
      >
        <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="filter-bar">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="select select-sm w-44"
            >
              <option value="ALL">All types</option>
              {typeOptions.map((t) => (
                <option key={t} value={t}>
                  {t.replace("_", " ")}
                </option>
              ))}
            </select>
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="select select-sm w-52"
            >
              <option value="ALL">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end mb-3">
            <button onClick={() => setModalOpen(true)} className="btn btn-primary">
              Create Report
            </button>
          </div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg shadow-sm">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Project</th>
                <th>Author</th>
                <th>Created</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedReports.map((report) => (
                <tr key={report.id}>
                  <td>
                    <Link href={`/reports/${report.id}`} className="text-brand-green-600 hover:underline">
                      {report.title}
                    </Link>
                    <div className="text-xs text-gray-500 line-clamp-1">{report.content}</div>
                  </td>
                  <td>
                    <div className="flex flex-col gap-1">
                      <span className="badge badge-info w-fit">{report.type}</span>
                      <span className={`badge w-fit text-[10px] px-1.5 py-0.5 ${report.confidentiality === 'CONFIDENTIAL' ? 'bg-red-100 text-red-800 border-red-200' :
                        'bg-green-100 text-green-800 border-green-200'
                        }`}>
                        {report.confidentiality}
                      </span>
                    </div>
                  </td>
                  <td className="text-sm text-gray-700">
                    {report.project ? (
                      <span className="badge badge-muted">{report.project.name}</span>
                    ) : (
                      <span className="badge badge-muted">Unassigned</span>
                    )}
                  </td>
                  <td className="text-sm text-gray-700">
                    {report.createdBy
                      ? `${report.createdBy.firstName} ${report.createdBy.lastName}`
                      : "—"}
                  </td>
                  <td className="text-sm text-gray-700">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/reports/${report.id}`} className="btn-ghost btn-sm text-brand-green-600 hover:text-brand-green-800">
                        View
                      </Link>
                      {user && (["PROJECT_MANAGER", "BOSS", "SUPERADMIN"].includes(user.role) || report.createdById === user.id || report.createdBy?.id === user.id) && (
                        <button
                          onClick={() => {
                            setConfirmReport(report);
                            setConfirmOpen(true);
                          }}
                          className="btn btn-danger btn-sm"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-sm text-gray-500">
                    No reports found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredReports.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm text-gray-700">
            <div>
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setPage(1)}
                disabled={page === 1}
              >
                {"<<"}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              {/* Show first, prev, current, next, last with ellipsis if needed */}
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                // Show current, two before, two after, always first and last with ellipsis
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= page - 1 && pageNum <= page + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      className={`btn btn-ghost btn-sm${pageNum === page ? " btn-active" : ""}`}
                      onClick={() => setPage(pageNum)}
                      disabled={pageNum === page}
                    >
                      {pageNum}
                    </button>
                  );
                }
                // Add ellipsis
                if (
                  (pageNum === page - 2 && page > 3) ||
                  (pageNum === page + 2 && page < totalPages - 2)
                ) {
                  return (
                    <span key={pageNum} className="px-2 select-none">
                      ...
                    </span>
                  );
                }
                return null;
              })}
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
              >
                {">>"}
              </button>
            </div>
            <div>
              <span className="text-xs">
                Showing {(page - 1) * pageSize + 1}
                -
                {Math.min(page * pageSize, filteredReports.length)} of {filteredReports.length} reports
              </span>
            </div>
          </div>
        )}
      </AppShell>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-card max-w-2xl">
            <div className="modal-header">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Create Report</h3>
              <button
                onClick={() => setModalOpen(false)}
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
                  <label className="label">Confidentiality</label>
                  <select
                    name="confidentiality"
                    value={form.confidentiality}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="CONFIDENTIAL">Confidential</option>
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
                <div className="sm:col-span-2">
                  <label className="label">Attach Files (optional)</label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setFiles(e.target.files)}
                    className="file-input"
                  />
                  <input
                    type="text"
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
                  onClick={() => setModalOpen(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? "Saving..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmOpen && confirmReport && (
        <div className="modal-overlay">
          <div className="modal-card max-w-md">
            <div className="modal-header">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Please Confirm</h3>
            </div>
            <div className="modal-body space-y-2">
              <p className="text-sm text-[var(--text-secondary)]">
                Delete report "{confirmReport.title}"? This cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => {
                  setConfirmOpen(false);
                  setConfirmReport(null);
                }}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmReport && deleteReport(confirmReport)}
                className="btn btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
