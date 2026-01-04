"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api, { API_URL } from "@/lib/api";
import { authService, User } from "@/lib/auth";
import { UserRole, canAssignDevelopers, canCreateProjects } from "@/lib/roles";
import { useToast } from "@/components/ToastProvider";
import { AppShell } from "@/components/AppShell";
import { Upload, X, File, Plus, Trash2, Download, Eye, Clock, MessageSquare, Send, Folder, ChevronRight, FileText, Image as ImageIcon, Film, Music, Box, LayoutGrid, List, Archive } from "lucide-react";
import TaskBoard from "@/components/tasks/TaskBoard";

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
  githubUrl?: string;
  deployUrl?: string;
  serverDetails?: string;
};

type ProjectDocument = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  description?: string;
  isArchived?: boolean;
  isFolder?: boolean;
  parentId?: string;
  version?: number;
};

type ActivityLog = {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  actor: { firstName: string; lastName: string };
};

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: { firstName: string; lastName: string };
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
    githubUrl: "",
    deployUrl: "",
    serverDetails: "",
  });
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "timeline" | "comments" | "tasks" | "documents">("details");
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [visibleLogsCount, setVisibleLogsCount] = useState(10);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docFiles, setDocFiles] = useState<FileList | null>(null);
  const [docDescription, setDocDescription] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    type: "archive" | "unarchive" | "hardDelete" | "removeDeveloper" | null;
    targetId: string | null;
    label: string;
  }>({ type: null, targetId: null, label: "" });
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
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
        githubUrl: response.data.githubUrl || "",
        deployUrl: response.data.deployUrl || "",
        serverDetails: response.data.serverDetails || "",
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

  useEffect(() => {
    if (activeTab === "timeline") {
      loadLogs();
    } else if (activeTab === "comments") {
      loadComments();
    }
  }, [activeTab, params.id]);

  const loadLogs = async () => {
    try {
      const response = await api.get(`/activity/project/${params.id}`);
      setLogs(response.data || []);
    } catch (error) {
      // silent fail or toast
    }
  };

  const loadComments = async () => {
    try {
      setCommentsLoading(true);
      const response = await api.get(`/comments/project/${params.id}`);
      setComments(response.data || []);
    } catch (error) {
      addToast("Failed to load comments.", "error");
    } finally {
      setCommentsLoading(false);
    }
  };

  const createFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      await api.post(`/documents/folder/${project?.id}`, {
        name: newFolderName,
        parentId: currentFolderId,
      });
      addToast("Folder created successfully");
      setNewFolderName("");
      setIsCreatingFolder(false);
      loadDocuments();
    } catch (error) {
      addToast("Failed to create folder", "error");
    }
  };

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await api.post(`/comments/project/${params.id}`, { content: newComment });
      setNewComment("");
      loadComments();
      loadLogs(); // Posting a comment might create a log entry if we implemented that? (We didn't yet, but good practice)
    } catch (error) {
      addToast("Failed to post comment.", "error");
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
      loadLogs();
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
      loadLogs();
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
      for (let i = 0; i < docFiles.length; i++) {
        formData.append("files", docFiles[i]);
      }
      formData.append("description", docDescription);
      if (currentFolderId) {
        formData.append("parentId", currentFolderId);
      }

      await api.post(`/documents/upload-many/${project?.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      addToast("Files uploaded.");
      setDocFiles(null);
      setDocDescription("");
      await loadDocuments();
      loadLogs();
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

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<ProjectDocument | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // ... (existing helper functions)

  const isPreviewable = (mimeType: string) => {
    return (
      mimeType.startsWith("image/") ||
      mimeType === "application/pdf" ||
      mimeType === "text/plain"
    );
  };

  const previewDocument = async (doc: ProjectDocument) => {
    if (!isPreviewable(doc.mimeType)) {
      downloadDocument(doc);
      return;
    }

    try {
      setPreviewLoading(true);
      setPreviewDoc(doc);
      // Fetch blob
      const response = await api.get(`/documents/${doc.id}/download`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: response.headers["content-type"] || doc.mimeType });
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to load preview.";
      addToast(Array.isArray(message) ? message.join(", ") : message, "error");
      setPreviewDoc(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewDoc(null);
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
      githubUrl: project.githubUrl || "",
      deployUrl: project.deployUrl || "",
      serverDetails: project.serverDetails || "",
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
        githubUrl: editForm.githubUrl,
        deployUrl: editForm.deployUrl,
        serverDetails: editForm.serverDetails,
      });
      addToast("Project updated successfully.");
      setEditModalOpen(false);
      await loadProject();
      loadLogs();
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

  const canEdit =
    canCreateProjects(user.role) ||
    [UserRole.DEVOPS].includes(user.role as UserRole) ||
    (project.assignments?.some((a) => a.developerId === user.id) ?? false);
  const canAssign = canAssignDevelopers(user.role);
  const isAssigned = project.assignments?.some((a) => a.developerId === user.id);
  const canManageDocs =
    canEdit ||
    canAssign ||
    [UserRole.BOSS, UserRole.DEVOPS, UserRole.SUPERADMIN].includes(user.role as UserRole) ||
    isAssigned;

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
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("details")}
              className={`${activeTab === "details"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab("tasks")}
              className={`${activeTab === "tasks"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              Tasks
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={`${activeTab === "timeline"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              Timeline
            </button>
            <button
              onClick={() => setActiveTab("comments")}
              className={`${activeTab === "comments"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              Comments
            </button>
            <button
              onClick={() => setActiveTab("documents")}
              className={`${activeTab === "documents"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              Documents
            </button>
          </nav>
        </div>

        <div className="mt-6">
          {activeTab === "tasks" && (
            <TaskBoard
              projectId={project.id}
              projectDevelopers={project.assignments?.map(a => a.developer) || []}
              canCreate={canEdit}
            />
          )}

          {activeTab === "details" && (
            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
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
                  {project.githubUrl && (
                    <div className="col-span-1 sm:col-span-2">
                      <div className="font-semibold text-gray-800">GitHub Repository</div>
                      <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                        {project.githubUrl}
                      </a>
                    </div>
                  )}
                  {project.deployUrl && (
                    <div className="col-span-1 sm:col-span-2">
                      <div className="font-semibold text-gray-800">Live Deployment</div>
                      <a href={project.deployUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                        {project.deployUrl}
                      </a>
                    </div>
                  )}
                  {project.serverDetails && (
                    <div className="col-span-1 sm:col-span-2">
                      <div className="font-semibold text-gray-800">Server Details</div>
                      <pre className="mt-1 bg-gray-50 p-3 rounded text-xs overflow-auto">
                        {project.serverDetails}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Assigned Developers - Now inside Details */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Assigned Developers</h2>
                </div>
                {
                  project.assignments && project.assignments.length > 0 ? (
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
                  )
                }

                {
                  canAssign && (
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
                  )
                }
              </div >
            </div>
          )}

          {activeTab === "documents" && (
            <div className="bg-white shadow rounded-lg p-6 min-h-[500px]">
              {/* Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div className="flex items-center flex-wrap gap-2 text-sm text-gray-600">
                  <button
                    onClick={() => setCurrentFolderId(null)}
                    className={`flex items-center hover:text-blue-600 transition-colors ${!currentFolderId ? 'font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded' : ''}`}
                  >
                    <Folder className="w-4 h-4 mr-1" />
                    Root
                  </button>

                  {(() => {
                    // Build breadcrumbs path
                    const path = [];
                    let curr = currentFolderId;
                    while (curr) {
                      const folder = documents.find(d => d.id === curr);
                      if (folder) {
                        path.unshift(folder);
                        curr = folder.parentId || null;
                      } else {
                        break;
                      }
                    }

                    return path.map((folder, idx) => (
                      <div key={folder.id} className="flex items-center gap-2">
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                        <button
                          onClick={() => setCurrentFolderId(folder.id)}
                          className={`hover:text-blue-600 transition-colors ${idx === path.length - 1 ? 'font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded' : ''}`}
                        >
                          {folder.originalName}
                        </button>
                      </div>
                    ));
                  })()}
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-700 flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
                    Show archived
                  </label>
                  {canManageDocs && (
                    <button
                      onClick={() => setIsCreatingFolder(true)}
                      className="text-sm flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-all shadow-sm font-medium"
                    >
                      <Plus className="w-4 h-4" /> New Folder
                    </button>
                  )}
                </div>
              </div>

              {/* Folder Creation Form */}
              {isCreatingFolder && (
                <form onSubmit={createFolder} className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Folder className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <input
                      autoFocus
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Folder Name"
                      className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium">Create</button>
                    <button type="button" onClick={() => setIsCreatingFolder(false)} className="text-sm bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 font-medium">Cancel</button>
                  </div>
                </form>
              )}

              {/* File List Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Type</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Modified</th>
                      <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {documents.filter(d => (currentFolderId ? d.parentId === currentFolderId : !d.parentId)).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                          <div className="flex flex-col items-center justify-center">
                            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                              <Folder className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="text-base font-medium text-gray-900">This folder is empty</p>
                            <p className="text-sm text-gray-500 mt-1">Upload files or create a subfolder to get started.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      documents
                        .filter(d => (currentFolderId ? d.parentId === currentFolderId : !d.parentId))
                        .sort((a, b) => (Number(b.isFolder || 0) - Number(a.isFolder || 0)))
                        .map((doc) => {
                          const Icon = doc.isFolder ? Folder :
                            doc.mimeType.startsWith('image/') ? ImageIcon :
                              doc.mimeType.startsWith('video/') ? Film :
                                doc.mimeType.startsWith('audio/') ? Music :
                                  doc.mimeType.includes('pdf') ? FileText :
                                    File;

                          return (
                            <tr
                              key={doc.id}
                              className={`hover:bg-gray-50 transition-colors group ${doc.isFolder ? 'cursor-pointer' : ''}`}
                              onClick={() => doc.isFolder && setCurrentFolderId(doc.id)}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className={`flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg ${doc.isFolder ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                    <Icon className="h-5 w-5" />
                                  </div>
                                  <div className="ml-4">
                                    <div className={`text-sm font-medium ${doc.isFolder ? 'text-blue-900' : 'text-gray-900'}`} title={doc.originalName}>
                                      {(() => {
                                        const name = doc.originalName;
                                        if (name.length <= 30) return name;

                                        const lastDotIndex = name.lastIndexOf('.');
                                        if (lastDotIndex > 0 && name.length - lastDotIndex <= 5) {
                                          // Is a file with extension
                                          const ext = name.slice(lastDotIndex);
                                          const part = name.slice(0, 30 - 3 - ext.length);
                                          return `${part}...${ext}`;
                                        }
                                        return `${name.slice(0, 30)}...`;
                                      })()}
                                    </div>
                                    {doc.description && <div className="text-xs text-gray-500 max-w-xs truncate">{doc.description}</div>}
                                    {doc.isArchived && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">Archived</span>}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {doc.isFolder ? '-' : `${(doc.size / 1024).toFixed(1)} KB`}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                                {doc.isFolder ? 'Folder' : (doc.mimeType.split('/').pop()?.toUpperCase() || 'FILE')}
                                {!doc.isFolder && <span className="ml-2 text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">v{doc.version || 1}</span>}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                                {new Date(doc.uploadedAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                  {!doc.isFolder && (
                                    <>
                                      <button onClick={() => previewDocument(doc)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Preview">
                                        <Eye className="h-4 w-4" />
                                      </button>
                                      <button onClick={() => downloadDocument(doc)} className="text-gray-400 hover:text-green-600 transition-colors" title="Download">
                                        <Download className="h-4 w-4" />
                                      </button>
                                    </>
                                  )}

                                  {canManageDocs && (
                                    <>
                                      {doc.isArchived ? (
                                        <>
                                          <button onClick={() => setConfirmModal({ type: "unarchive", targetId: doc.id, label: doc.originalName })} className="text-green-600 hover:text-green-900 text-xs font-semibold">Restore</button>
                                          <button onClick={() => setConfirmModal({ type: "hardDelete", targetId: doc.id, label: doc.originalName })} className="text-red-400 hover:text-red-600 transition-colors" title="Delete Permanently"><Trash2 className="h-4 w-4" /></button>
                                        </>
                                      ) : (
                                        <button onClick={() => setConfirmModal({ type: "archive", targetId: doc.id, label: doc.originalName })} className="text-gray-400 hover:text-amber-600 transition-colors" title="Archive">
                                          <Archive className="h-4 w-4" />
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Upload Section */}
              {canManageDocs && (
                <div className="mt-8">
                  <form onSubmit={uploadDocuments} className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-100 transition-colors relative">
                    <input id="file-upload" type="file" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleDocsChange} />
                    <div className="flex flex-col items-center justify-center pointer-events-none">
                      <Upload className="h-10 w-10 text-gray-400 mb-3" />
                      <p className="text-sm text-gray-900 font-medium">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500 mt-1">Upload files to <span className="font-semibold text-gray-700">{documents.find(d => d.id === currentFolderId)?.originalName || "Root"}</span></p>
                    </div>
                  </form>

                  {docFiles && docFiles.length > 0 && (
                    <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-gray-900">Uploading {docFiles.length} file(s)</h4>
                        <button onClick={() => setDocFiles(null)} className="text-xs text-red-600 hover:text-red-700 font-medium">Cancel All</button>
                      </div>
                      <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                        {Array.from(docFiles).map((file, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
                            <File className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-700 truncate flex-1">{file.name}</span>
                            <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-4 items-end">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Description (Optional)</label>
                          <input
                            type="text"
                            value={docDescription}
                            onChange={(e) => setDocDescription(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2"
                            placeholder="Add a note about these files..."
                          />
                        </div>
                        <button
                          onClick={uploadDocuments}
                          disabled={uploading}
                          className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                        >
                          {uploading ? "Uploading..." : "Start Upload"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {
            activeTab === "timeline" && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h2>
                <div className="flow-root">
                  <ul className="-mb-8">
                    {logs.length > 0 ? (
                      <>
                        {logs.slice(0, visibleLogsCount).map((log, logIdx) => (
                          <li key={log.id}>
                            <div className="relative pb-8">
                              {logIdx !== logs.length - 1 ? (
                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                              ) : null}
                              <div className="relative flex space-x-3">
                                <div>
                                  <span className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center ring-8 ring-white">
                                    <Clock className="h-4 w-4 text-blue-600" aria-hidden="true" />
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                  <div>
                                    <p className="text-sm text-gray-500">
                                      <span className="font-medium text-gray-900">{log.actor?.firstName} {log.actor?.lastName}</span>{" "}
                                      {log.description}
                                    </p>
                                  </div>
                                  <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                    <time dateTime={log.timestamp}>{new Date(log.timestamp).toLocaleString()}</time>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                        {logs.length > 10 && (
                          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-4">
                            {visibleLogsCount < logs.length && (
                              <button
                                onClick={() => setVisibleLogsCount((prev) => Math.min(prev + 10, logs.length))}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                              >
                                Show More
                              </button>
                            )}
                            {visibleLogsCount > 10 && (
                              <button
                                onClick={() => setVisibleLogsCount(10)}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                              >
                                Show Less
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">No activity recorded yet.</p>
                    )}
                  </ul>
                </div>
              </div>
            )
          }

          {
            activeTab === "comments" && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Discussion</h2>

                <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <form onSubmit={postComment} className="relative">
                    <div className="overflow-hidden">
                      <label htmlFor="comment" className="sr-only">Add your comment</label>
                      <textarea
                        rows={4}
                        name="comment"
                        id="comment"
                        className="block w-full py-3 px-4 resize-y border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus:border-blue-500 sm:text-sm shadow-sm transition-all"
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      />
                      <div className="mt-3 flex justify-end">
                        <button
                          type="submit"
                          disabled={!newComment.trim()}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Post Comment
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                <div className="space-y-6">
                  {commentsLoading ? (
                    <p className="text-sm text-gray-500">Loading comments...</p>
                  ) : comments.length > 0 ? (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex space-x-3">
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center justify-center h-10 w-10 mean-w-[2.5rem] rounded-full bg-gray-500">
                            <span className="text-sm font-medium leading-none text-white">
                              {comment.author?.firstName?.[0]}{comment.author?.lastName?.[0]}
                            </span>
                          </span>
                        </div>
                        <div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-900">{comment.author?.firstName} {comment.author?.lastName}</span>
                            <span className="text-gray-500 ml-2">{new Date(comment.createdAt).toLocaleString()}</span>
                          </div>
                          <div className="mt-1 text-sm text-gray-700">
                            <p>{comment.content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No comments yet. Start the conversation!</p>
                  )}
                </div>
              </div>
            )
          }


        </div>
      </main>

      {
        confirmModal.type && confirmModal.targetId && (
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
                  className={`btn ${confirmModal.type === "hardDelete" || confirmModal.type === "removeDeveloper"
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
        )
      }

      {
        editModalOpen && (
          <div className="modal-overlay">
            <div className="modal-card max-w-2xl flex flex-col max-h-[90vh]">
              <div className="modal-header shrink-0">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Edit Project</h3>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>
              <div className="modal-body overflow-y-auto flex-1">
                <form id="edit-project-form" onSubmit={saveProject} className="space-y-4">
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
                    <div className="sm:col-span-2">
                      <label className="label">GitHub Repository URL</label>
                      <input
                        type="url"
                        name="githubUrl"
                        value={editForm.githubUrl}
                        onChange={(e) => setEditForm((p) => ({ ...p, githubUrl: e.target.value }))}
                        placeholder="https://github.com/..."
                        className="input"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="label">Live Deployment URL</label>
                      <input
                        type="url"
                        name="deployUrl"
                        value={editForm.deployUrl}
                        onChange={(e) => setEditForm((p) => ({ ...p, deployUrl: e.target.value }))}
                        placeholder="https://..."
                        className="input"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="label">Server Details</label>
                      <textarea
                        name="serverDetails"
                        value={editForm.serverDetails}
                        onChange={(e) => setEditForm((p) => ({ ...p, serverDetails: e.target.value }))}
                        rows={3}
                        placeholder="IP, credentials info (non-sensitive), or instructions..."
                        className="input"
                      />
                    </div>
                  </div>

                  {/* Visible Documents Section in Edit Modal */}
                  <div className="pt-4 border-t border-[var(--border-subtle)]">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Attached Documents</h4>
                    {documents.length > 0 ? (
                      <ul className="space-y-2 text-sm max-h-40 overflow-y-auto bg-gray-50 p-2 rounded border border-[var(--border-subtle)]">
                        {documents.map((doc) => (
                          <li key={doc.id} className="flex items-center gap-2 text-[var(--text-secondary)]">
                            <File className="h-4 w-4 text-blue-500 shrink-0" />
                            <span className="truncate" title={doc.originalName}>{doc.originalName}</span>
                            <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">{(doc.size / 1024).toFixed(1)} KB</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-[var(--text-secondary)] italic">No documents attached.</p>
                    )}
                  </div>
                </form>
              </div>
              <div className="modal-footer shrink-0">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" form="edit-project-form" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Preview Modal */}
      {/* Preview Modal */}
      {
        (previewDoc || previewLoading) && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/95 backdrop-blur-sm transition-opacity duration-300"
            onClick={closePreview}
          >
            <div
              className="bg-white dark:bg-slate-900 w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/10"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <File className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg line-clamp-1" title={previewDoc?.originalName}>
                      {previewDoc?.originalName || "Loading..."}
                    </h3>
                    {previewDoc && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {(previewDoc.size / 1024).toFixed(1)} KB • {previewDoc.mimeType}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {previewDoc && (
                    <button
                      onClick={() => downloadDocument(previewDoc)}
                      className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                  )}
                  <button
                    onClick={closePreview}
                    className="p-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-all"
                    aria-label="Close preview"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 bg-gray-50 dark:bg-slate-950/50 flex items-center justify-center overflow-auto relative p-4">
                {previewLoading ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Loading preview...</p>
                  </div>
                ) : previewUrl && previewDoc ? (
                  previewDoc.mimeType.startsWith("image/") ? (
                    <img
                      src={previewUrl}
                      alt={previewDoc.originalName}
                      className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                    />
                  ) : previewDoc.mimeType === "application/pdf" ? (
                    <iframe
                      src={previewUrl}
                      className="w-full h-full rounded-lg shadow-lg bg-white"
                      title={previewDoc.originalName}
                    />
                  ) : (
                    <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg border border-gray-100 dark:border-slate-800">
                      <div className="bg-gray-50 dark:bg-slate-800 h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-6">
                        <File className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        Preview functionality not supported
                      </h4>
                      <p className="text-gray-500 dark:text-gray-400 mb-8">
                        This file type cannot be previewed directly in the browser.
                        Please download the file to view it.
                      </p>
                      <button
                        onClick={() => downloadDocument(previewDoc)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold shadow-lg shadow-blue-600/20 transition-all hover:scale-105"
                      >
                        <Download className="h-5 w-5" />
                        Download File
                      </button>
                    </div>
                  )
                ) : (
                  <div className="text-center p-8">
                    <p className="text-red-500 font-medium">Failed to load preview.</p>
                    <button onClick={closePreview} className="mt-4 text-sm underline text-gray-500">Close</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }
    </AppShell >
  );
}

