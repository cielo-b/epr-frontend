"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService, User } from "@/lib/auth";
import api from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";

interface DeploymentProject {
    id: string;
    name: string;
    description?: string;
    status: string;
    devServerPort?: number;
    productionUrl?: string;
    isDeployed: boolean;
    healthCheckEndpoint?: string;
    lastHealthCheckStatus?: string;
    lastHealthCheckTime?: string;
    githubUrl?: string;
    deployUrl?: string;
    serverDetails?: string;
    devServerId?: string;
    productionServerId?: string;
    devServer?: any;
    productionServer?: any;
    manager?: {
        firstName: string;
        lastName: string;
    };
    _count?: {
        assignments: number;
    };
}

export default function DeploymentsPage() {
    const router = useRouter();
    const { addToast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [projects, setProjects] = useState<DeploymentProject[]>([]);
    const [servers, setServers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<DeploymentProject | null>(null);
    const [saving, setSaving] = useState(false);
    const [filter, setFilter] = useState<"all" | "deployed" | "not-deployed">("all");
    const [healthFilter, setHealthFilter] = useState<"all" | "UP" | "DOWN" | "UNKNOWN">("all");

    const [form, setForm] = useState({
        devServerPort: "",
        productionUrl: "",
        isDeployed: false,
        healthCheckEndpoint: "/",
        githubUrl: "",
        deployUrl: "",
        serverDetails: "",
        devServerId: "",
        productionServerId: "",
    });

    useEffect(() => {
        const currentUser = authService.getUser();
        if (!currentUser) {
            router.push("/login");
            return;
        }
        if (!["DEVOPS", "BOSS", "SUPERADMIN", "PROJECT_MANAGER"].includes(currentUser.role)) {
            addToast("Access denied: DevOps role required", "error");
            router.push("/dashboard");
            return;
        }
        setUser(currentUser);
        loadProjects();
        loadServers();
    }, [router]);

    const loadProjects = async () => {
        try {
            const response = await api.get("/projects");
            setProjects(response.data);
        } catch (error) {
            console.error("Failed to load projects:", error);
            addToast("Failed to load projects", "error");
        } finally {
            setLoading(false);
        }
    };

    const loadServers = async () => {
        try {
            const response = await api.get("/servers");
            setServers(response.data);
        } catch (error) {
            console.error("Failed to load servers:", error);
        }
    };

    const openDeploymentModal = (project: DeploymentProject) => {
        setSelectedProject(project);
        setForm({
            devServerPort: project.devServerPort?.toString() || "",
            productionUrl: project.productionUrl || "",
            isDeployed: project.isDeployed || false,
            healthCheckEndpoint: project.healthCheckEndpoint || "/",
            githubUrl: project.githubUrl || "",
            deployUrl: project.deployUrl || "",
            serverDetails: project.serverDetails || "",
            devServerId: project.devServerId || "",
            productionServerId: project.productionServerId || "",
        });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedProject(null);
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
        setForm((prev) => ({ ...prev, [name]: val }));
    };

    const saveDeployment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProject) return;

        setSaving(true);
        try {
            const payload = {
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

            await api.patch(`/projects/${selectedProject.id}`, payload);
            addToast("Deployment details updated successfully");
            await loadProjects();
            closeModal();
        } catch (error: any) {
            const message =
                error?.response?.data?.message || "Failed to update deployment details";
            addToast(Array.isArray(message) ? message.join(", ") : message, "error");
        } finally {
            setSaving(false);
        }
    };

    const getHealthStatusColor = (status?: string) => {
        switch (status) {
            case "UP":
                return "bg-green-100 text-green-800 border-green-200";
            case "DOWN":
                return "bg-red-100 text-red-800 border-red-200";
            case "MAINTENANCE":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const filteredProjects = projects.filter((project) => {
        if (filter === "deployed" && !project.isDeployed) return false;
        if (filter === "not-deployed" && project.isDeployed) return false;
        if (healthFilter !== "all" && project.lastHealthCheckStatus !== healthFilter)
            return false;
        return true;
    });

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Loading...
            </div>
        );
    }

    return (
        <AppShell
            title="Deployment Management"
            subtitle="Manage project deployments and monitor health"
            userName={`${user.firstName} ${user.lastName}`}
            userRole={user.role}
        >
            <>
                {/* Filters */}
                <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex gap-3">
                        <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">
                                Deployment Status
                            </label>
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value as any)}
                                className="input text-sm"
                            >
                                <option value="all">All Projects</option>
                                <option value="deployed">Deployed Only</option>
                                <option value="not-deployed">Not Deployed</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">
                                Health Status
                            </label>
                            <select
                                value={healthFilter}
                                onChange={(e) => setHealthFilter(e.target.value as any)}
                                className="input text-sm"
                            >
                                <option value="all">All Health Status</option>
                                <option value="UP">UP</option>
                                <option value="DOWN">DOWN</option>
                                <option value="UNKNOWN">UNKNOWN</option>
                            </select>
                        </div>
                    </div>
                    <div className="text-sm text-gray-600">
                        Showing {filteredProjects.length} of {projects.length} projects
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="text-sm font-medium text-gray-600">Total Projects</div>
                        <div className="text-2xl font-bold text-gray-900 mt-1">
                            {projects.length}
                        </div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
                        <div className="text-sm font-medium text-green-700">Deployed</div>
                        <div className="text-2xl font-bold text-green-900 mt-1">
                            {projects.filter((p) => p.isDeployed).length}
                        </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                        <div className="text-sm font-medium text-blue-700">Healthy (UP)</div>
                        <div className="text-2xl font-bold text-blue-900 mt-1">
                            {projects.filter((p) => p.lastHealthCheckStatus === "UP").length}
                        </div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
                        <div className="text-sm font-medium text-red-700">Down</div>
                        <div className="text-2xl font-bold text-red-900 mt-1">
                            {projects.filter((p) => p.lastHealthCheckStatus === "DOWN").length}
                        </div>
                    </div>
                </div>

                {/* Projects Table */}
                <div className="bg-white border border-[var(--border-subtle)] rounded-lg shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Project
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Deployment Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Health Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    URLs
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Last Check
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredProjects.map((project) => (
                                <tr key={project.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{project.name}</div>
                                        <div className="text-xs text-gray-500 line-clamp-1">
                                            {project.description}
                                        </div>
                                        {project.manager && (
                                            <div className="text-xs text-gray-400 mt-1">
                                                PM: {project.manager.firstName} {project.manager.lastName}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {project.isDeployed ? (
                                            <div>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                                    ✓ Deployed
                                                </span>
                                                {project.devServerPort && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Dev Port: {project.devServerPort}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                                Not Deployed
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {project.isDeployed ? (
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getHealthStatusColor(
                                                    project.lastHealthCheckStatus
                                                )}`}
                                            >
                                                {project.lastHealthCheckStatus || "UNKNOWN"}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-400">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            {project.productionUrl && (
                                                <a
                                                    href={project.productionUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 truncate max-w-xs"
                                                >
                                                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                                    </svg>
                                                    {project.productionUrl}
                                                </a>
                                            )}
                                            {project.githubUrl && (
                                                <a
                                                    href={project.githubUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-gray-600 hover:text-gray-800 hover:underline flex items-center gap-1 truncate max-w-xs"
                                                >
                                                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                                                    </svg>
                                                    GitHub
                                                </a>
                                            )}
                                            {!project.productionUrl && !project.githubUrl && (
                                                <span className="text-xs text-gray-400">No URLs</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {project.lastHealthCheckTime ? (
                                            <div className="text-xs text-gray-600">
                                                {new Date(project.lastHealthCheckTime).toLocaleString()}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400">Never</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button
                                            onClick={() => openDeploymentModal(project)}
                                            className="btn btn-primary btn-sm"
                                        >
                                            Manage Deployment
                                        </button>
                                        <Link
                                            href={`/projects/${project.id}`}
                                            className="btn btn-ghost btn-sm"
                                        >
                                            View Project
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {filteredProjects.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-6 py-8 text-center text-sm text-gray-500"
                                    >
                                        No projects found matching the selected filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Deployment Modal */}
                {modalOpen && selectedProject && (
                    <div className="modal-overlay">
                        <div className="modal-card max-w-3xl">
                            <div className="modal-header">
                                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                                    Manage Deployment: {selectedProject.name}
                                </h3>
                                <button
                                    onClick={closeModal}
                                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                    aria-label="Close modal"
                                >
                                    ✕
                                </button>
                            </div>
                            <form onSubmit={saveDeployment} className="modal-body space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Development Server Selection */}
                                    <div>
                                        <label className="label">Development Server</label>
                                        <select
                                            name="devServerId"
                                            value={form.devServerId}
                                            onChange={handleChange}
                                            className="input"
                                        >
                                            <option value="">-- Select Dev Server --</option>
                                            {servers.filter(s => s.status === 'ACTIVE').map(server => (
                                                <option key={server.id} value={server.id}>
                                                    {server.name} ({server.ipAddress}:{server.port})
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Server where the app is deployed for development
                                        </p>
                                    </div>

                                    {/* Production Server Selection */}
                                    <div>
                                        <label className="label">Production Server</label>
                                        <select
                                            name="productionServerId"
                                            value={form.productionServerId}
                                            onChange={handleChange}
                                            className="input"
                                        >
                                            <option value="">-- Select Production Server --</option>
                                            {servers.filter(s => s.status === 'ACTIVE').map(server => (
                                                <option key={server.id} value={server.id}>
                                                    {server.name} ({server.ipAddress}:{server.port})
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Server where the app is deployed for production
                                        </p>
                                    </div>

                                    {/* Dev Server Port */}
                                    <div>
                                        <label className="label">Dev Server Port</label>
                                        <input
                                            type="number"
                                            name="devServerPort"
                                            value={form.devServerPort}
                                            onChange={handleChange}
                                            className="input"
                                            placeholder="e.g., 3000, 5000"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Port number for development server
                                        </p>
                                    </div>

                                    {/* Health Check Endpoint */}
                                    <div>
                                        <label className="label">Health Check Endpoint</label>
                                        <input
                                            type="text"
                                            name="healthCheckEndpoint"
                                            value={form.healthCheckEndpoint}
                                            onChange={handleChange}
                                            className="input"
                                            placeholder="/ or /health"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Endpoint to ping for health checks
                                        </p>
                                    </div>

                                    {/* Production URL */}
                                    <div className="md:col-span-2">
                                        <label className="label">Production URL</label>
                                        <input
                                            type="text"
                                            name="productionUrl"
                                            value={form.productionUrl}
                                            onChange={handleChange}
                                            className="input"
                                            placeholder="https://example.com"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Live production URL (used for health checks)
                                        </p>
                                    </div>

                                    {/* GitHub URL */}
                                    <div className="md:col-span-2">
                                        <label className="label">GitHub Repository URL</label>
                                        <input
                                            type="text"
                                            name="githubUrl"
                                            value={form.githubUrl}
                                            onChange={handleChange}
                                            className="input"
                                            placeholder="https://github.com/username/repo"
                                        />
                                    </div>

                                    {/* Deploy URL */}
                                    <div className="md:col-span-2">
                                        <label className="label">Deployment URL / CI/CD</label>
                                        <input
                                            type="text"
                                            name="deployUrl"
                                            value={form.deployUrl}
                                            onChange={handleChange}
                                            className="input"
                                            placeholder="https://vercel.com/project or CI/CD link"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Link to deployment dashboard or CI/CD pipeline
                                        </p>
                                    </div>

                                    {/* Server Details */}
                                    <div className="md:col-span-2">
                                        <label className="label">Server Details / Notes</label>
                                        <textarea
                                            name="serverDetails"
                                            value={form.serverDetails}
                                            onChange={handleChange}
                                            className="input"
                                            rows={4}
                                            placeholder="Server IP, credentials, deployment notes, environment variables, etc."
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Internal notes about server configuration and deployment
                                        </p>
                                    </div>

                                    {/* Is Deployed Checkbox */}
                                    <div className="md:col-span-2 flex items-center pt-2">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="isDeployed"
                                                checked={form.isDeployed}
                                                onChange={handleChange}
                                                className="checkbox"
                                            />
                                            <span className="text-sm font-medium">
                                                Mark as Deployed (enables health monitoring)
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                <div className="modal-footer pt-4 border-t">
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
                                        {saving ? "Saving..." : "Save Deployment Details"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </>
        </AppShell>
    );
}
