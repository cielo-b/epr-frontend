"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authService, User } from "@/lib/auth";
import { canCreateProjects } from "@/lib/roles";
import api from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { AppShell } from "@/components/AppShell";
import { TableSkeleton, Skeleton } from "@/components/Skeleton";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import Link from "next/link";
import { Box } from "lucide-react";

export default function ProjectsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [servers, setServers] = useState<any[]>([]);
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
    devServerPort: "",
    productionUrl: "",
    isDeployed: false,
    healthCheckEndpoint: "/",
    githubUrl: "",
    deployUrl: "",
    serverDetails: "",
    devServerId: "",
    productionServerId: "",
    envTemplate: "",
  });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const pageSize = 10;

  useEffect(() => {
    const currentUser = authService.getUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);
    loadProjects();
    loadServers();
  }, [router]);

  useEffect(() => {
    setPage(1);
  }, [projects.length]);

  const loadServers = async () => {
    try {
      const response = await api.get("/servers");
      setServers(response.data);
    } catch (error) {
      console.error("Failed to load servers:", error);
    }
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get("/projects");
      setProjects(response.data);
    } catch (error) {
      addToast("Failed to load projects", "error");
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
      devServerPort: "",
      productionUrl: "",
      isDeployed: false,
      healthCheckEndpoint: "/",
      githubUrl: "",
      deployUrl: "",
      serverDetails: "",
      devServerId: "",
      productionServerId: "",
      envTemplate: "",
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
      devServerPort: project.devServerPort || "",
      productionUrl: project.productionUrl || "",
      isDeployed: project.isDeployed || false,
      healthCheckEndpoint: project.healthCheckEndpoint || "/",
      githubUrl: project.githubUrl || "",
      deployUrl: project.deployUrl || "",
      serverDetails: project.serverDetails || "",
      devServerId: project.devServerId || "",
      productionServerId: project.productionServerId || "",
      envTemplate: project.envTemplate || "",
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
      devServerPort: "",
      productionUrl: "",
      isDeployed: false,
      healthCheckEndpoint: "/",
      githubUrl: "",
      deployUrl: "",
      serverDetails: "",
      devServerId: "",
      productionServerId: "",
      envTemplate: "",
    });
    setFiles(null);
    setFileDescription("");
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setForm((prev) => ({ ...prev, [name]: val }));
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
        devServerPort: form.devServerPort ? Number(form.devServerPort) : null,
        productionUrl: form.productionUrl,
        isDeployed: form.isDeployed,
        healthCheckEndpoint: form.healthCheckEndpoint,
        githubUrl: form.githubUrl,
        deployUrl: form.deployUrl,
        serverDetails: form.serverDetails,
        devServerId: form.devServerId || null,
        productionServerId: form.productionServerId || null,
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

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus === "ALL" || p.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [projects, search, filterStatus]);

  if (loading || !user) {
    return (
      <AppShell
        title="Projects"
        subtitle="Manage projects and timelines"
        userName={user ? `${user.firstName} ${user.lastName}` : "Loading..."}
        userRole={user?.role}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <TableSkeleton rows={10} columns={7} />
      </AppShell>
    );
  }

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const paginatedProjects = filteredProjects.slice((page - 1) * pageSize, page * pageSize);

  return (
    <AppShell
      title="Projects"
      subtitle="Manage projects and timelines"
      userName={`${user.firstName} ${user.lastName}`}
      userRole={user.role}
    >
      <>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex flex-col sm:flex-row flex-1 gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search projects..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green-600 transition-all text-sm shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green-600 transition-all text-sm font-medium text-gray-700 shadow-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              {statusOptions.map(opt => (
                <option key={opt} value={opt}>{opt.replace("_", " ")}</option>
              ))}
            </select>
          </div>
          {canCreateProjects(user.role) && (
            <button
              onClick={openCreateModal}
              className="px-6 py-2 bg-brand-green-600 text-white rounded-xl hover:bg-brand-green-700 transition-all shadow-lg shadow-brand-green-600/20 flex items-center justify-center gap-2 font-bold active:scale-95 shrink-0 whitespace-nowrap"
            >
              <svg className="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Project
            </button>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Project Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="hidden md:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Manager</th>
                  <th className="hidden lg:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Team</th>
                  <th className="hidden xl:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Health</th>
                  <th className="hidden lg:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Timeline</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 line-clamp-1 max-w-[150px] sm:max-w-[200px]">{project.name}</span>
                        <span className="text-xs text-gray-500 line-clamp-1 max-w-[150px] sm:max-w-[200px]">{project.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${project.status === 'COMPLETED' ? 'bg-brand-green-100 text-brand-green-700 border-brand-green-200' :
                        project.status === 'IN_PROGRESS' ? 'bg-brand-green-50 text-brand-green-700 border-brand-green-100' :
                          project.status === 'PLANNING' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                            'bg-brand-green-50 text-brand-green-600 border-brand-green-100'
                        }`}>
                        {project.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-brand-green-50 flex items-center justify-center text-brand-green-700 font-bold text-xs capitalize shrink-0">
                          {project.manager?.firstName?.[0] || '—'}
                        </div>
                        <span className="truncate max-w-[120px]">
                          {project.manager ? `${project.manager.firstName} ${project.manager.lastName}` : "No Manager"}
                        </span>
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span className="font-medium">{project._count?.assignments || project.assignments?.length || 0}</span>
                      </div>
                    </td>
                    <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap">
                      {project.isDeployed ? (
                        <div className="flex items-center gap-1.5">
                          <div className={`h-2 w-2 rounded-full animate-pulse ${project.lastHealthCheckStatus === 'UP' ? 'bg-brand-green-500' :
                            project.lastHealthCheckStatus === 'DOWN' ? 'bg-red-500' : 'bg-gray-400'
                            }`} />
                          <span className={`text-xs font-bold leading-none uppercase ${project.lastHealthCheckStatus === 'UP' ? 'text-brand-green-600' :
                            project.lastHealthCheckStatus === 'DOWN' ? 'text-red-600' : 'text-gray-500'
                            }`}>
                            {project.lastHealthCheckStatus || 'UNKNOWN'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Not Deployed</span>
                      )}
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{project.startDate ? new Date(project.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '—'}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">Ends: {project.endDate ? new Date(project.endDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Flexible'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/projects/${project.id}`}
                          className="p-1.5 text-brand-green-600 hover:bg-brand-green-50 rounded-lg transition-colors group"
                          title="View Details"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        {canCreateProjects(user.role) && (
                          <>
                            <button
                              onClick={() => openEditModal(project)}
                              className="p-1.5 text-gray-400 hover:text-brand-green-600 hover:bg-brand-green-50 rounded-lg transition-colors"
                              title="Edit Project"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => confirmDelete(project)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Project"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="w-12 h-12 text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <p className="text-base font-medium text-gray-900">No matching projects</p>
                        <p className="text-sm text-gray-500">
                          {search || filterStatus !== "ALL"
                            ? "Adjust your filters or search terms and try again."
                            : "Try creating a new project or checking back later."}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex items-center justify-between mt-6 px-1">
          <div className="text-sm font-medium text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
            Showing <span className="text-gray-900 font-bold">{paginatedProjects.length}</span> of <span className="text-gray-900 font-bold">{filteredProjects.length}</span> {filteredProjects.length === 1 ? 'project' : 'projects'}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-8 w-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${p === page ? 'bg-brand-green-600 text-white shadow-md shadow-brand-green-600/20' : 'text-gray-500 hover:bg-gray-100'
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {modalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedProject ? "Edit Project" : "Create New Project"}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={saveProject} className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Project Name</label>
                    <input
                      name="name"
                      placeholder="e.g. NextGen MIS Infrastructure"
                      value={form.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:bg-white transition-all text-gray-900"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:bg-white transition-all text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:bg-white transition-all text-gray-900"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={form.startDate}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:bg-white transition-all text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={form.endDate}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:bg-white transition-all text-gray-900"
                    />
                  </div>
                  {['DEVOPS', 'BOSS', 'SUPERADMIN', 'PROJECT_MANAGER'].includes(user?.role || '') && (
                    <>
                      <div className="sm:col-span-2 pt-4 border-t border-gray-100 mt-2">
                        <div className="flex items-center gap-2 text-brand-green-700 font-bold uppercase tracking-wider text-xs">
                          <div className="h-1.5 w-1.5 rounded-full bg-brand-green-600" />
                          Deployment & Infrastructure
                        </div>
                      </div>

                      {/* Server Selection */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Development Server</label>
                        <select
                          name="devServerId"
                          value={form.devServerId}
                          onChange={handleChange}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:bg-white transition-all text-gray-900"
                        >
                          <option value="">-- Select Server --</option>
                          {servers.filter(s => s.status === 'ACTIVE').map(server => (
                            <option key={server.id} value={server.id}>
                              {server.name} ({server.ipAddress})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Production Server</label>
                        <select
                          name="productionServerId"
                          value={form.productionServerId}
                          onChange={handleChange}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:bg-white transition-all text-gray-900"
                        >
                          <option value="">-- Select Server --</option>
                          {servers.filter(s => s.status === 'ACTIVE').map(server => (
                            <option key={server.id} value={server.id}>
                              {server.name} ({server.ipAddress})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dev Server Port</label>
                        <input
                          type="number"
                          name="devServerPort"
                          value={form.devServerPort}
                          onChange={handleChange}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:bg-white transition-all text-gray-900"
                          placeholder="e.g. 3000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Production URL</label>
                        <input
                          type="text"
                          name="productionUrl"
                          value={form.productionUrl}
                          onChange={handleChange}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:bg-white transition-all text-gray-900"
                          placeholder="https://..."
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          name="githubUrl"
                          value={form.githubUrl}
                          onChange={handleChange}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:bg-white transition-all text-gray-900"
                          placeholder="https://github.com/..."
                        />
                      </div>

                      <div className="sm:col-span-2 mt-4 pt-4 border-t border-gray-100">
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                          <Box className="h-4 w-4 text-brand-green-600" />
                          Environment Secret Vault (Template)
                        </label>
                        <textarea
                          name="envTemplate"
                          value={form.envTemplate}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green-600 transition-all text-brand-green-400 font-mono text-sm h-40"
                          placeholder="# DATABASE_URL=postgres://...&#10;# PORT=3000&#10;# Add non-sensitive .env.example templates here..."
                        />
                        <p className="mt-2 text-[10px] text-gray-500 italic">
                          This vault is for technical templates (like .env.example). Never store actual production secrets here.
                        </p>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">CI/CD Deployment Link / Prod CI</label>
                        <input
                          type="text"
                          name="deployUrl"
                          value={form.deployUrl}
                          onChange={handleChange}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:bg-white transition-all text-gray-900"
                          placeholder="https://vercel.com/... or Actions run link"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Health Check Path</label>
                        <input
                          type="text"
                          name="healthCheckEndpoint"
                          value={form.healthCheckEndpoint}
                          onChange={handleChange}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:bg-white transition-all text-gray-900"
                          placeholder="/health or /"
                        />
                      </div>
                      <div className="flex items-center pt-6">
                        <label className="flex items-center space-x-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            name="isDeployed"
                            checked={form.isDeployed}
                            onChange={handleChange}
                            className="h-5 w-5 border-gray-300 text-brand-green-600 rounded-lg focus:ring-brand-green-500 transition-all"
                          />
                          <span className="text-sm font-bold text-gray-700 group-hover:text-brand-green-700 transition-colors">Enable Health Monitoring</span>
                        </label>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Infrastructure Notes</label>
                        <textarea
                          name="serverDetails"
                          value={form.serverDetails}
                          onChange={handleChange}
                          rows={2}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:bg-white transition-all text-gray-900"
                          placeholder="Node versions, Env vars, Nginx configs..."
                        />
                      </div>
                    </>
                  )}
                  <div className="sm:col-span-2 pt-4 border-t border-gray-100 flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Attach Files (optional)</label>
                      <input
                        type="file"
                        multiple
                        onChange={handleFilesChange}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-green-50 file:text-brand-green-700 hover:file:bg-brand-green-100 transition-all cursor-pointer"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        name="fileDescription"
                        value={fileDescription}
                        onChange={(e) => setFileDescription(e.target.value)}
                        placeholder="Description for attached files..."
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:bg-white transition-all text-gray-900"
                      />
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-8 py-2.5 bg-brand-green-600 text-white rounded-xl font-bold hover:bg-brand-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-green-600/20 active:scale-95 flex items-center gap-2"
                  >
                    {saving && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {saving ? "Saving..." : selectedProject ? "Save Changes" : "Create Project"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
        }

        <ConfirmationModal
          isOpen={confirmOpen}
          title="Delete Project"
          message={`Are you sure you want to delete "${confirmProject?.name}"? This action cannot be undone and will remove all associated data.`}
          onConfirm={deleteProject}
          onCancel={() => {
            setConfirmOpen(false);
            setConfirmProject(null);
          }}
          confirmText="Delete Project"
          type="danger"
        />
      </>
    </AppShell >
  );
}
