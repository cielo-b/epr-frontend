"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService, User } from "@/lib/auth";
import api from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { AppShell } from "@/components/AppShell";

export default function ServersPage() {
    const router = useRouter();
    const { addToast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [servers, setServers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmServer, setConfirmServer] = useState<any | null>(null);
    const [saving, setSaving] = useState(false);
    const [selectedServer, setSelectedServer] = useState<any | null>(null);

    const [form, setForm] = useState({
        name: "",
        ipAddress: "",
        port: 22,
        username: "",
        type: "OTHER",
        status: "ACTIVE",
        description: "",
        sshKeyPath: "",
        monitoringUrl: "",
        cpuCores: "",
        ramGB: "",
        diskGB: "",
        notes: "",
    });

    useEffect(() => {
        const currentUser = authService.getUser();
        if (!currentUser) {
            router.push("/login");
            return;
        }
        // Check role
        if (!['DEVOPS', 'BOSS', 'SUPERADMIN', 'PROJECT_MANAGER'].includes(currentUser.role)) {
            addToast("Access denied: DevOps role required", "error");
            router.push("/dashboard");
            return;
        }
        setUser(currentUser);
        loadServers();
    }, [router]);

    const loadServers = async () => {
        try {
            const response = await api.get("/servers");
            setServers(response.data);
        } catch (error) {
            console.error("Failed to load servers:", error);
            addToast("Failed to load servers", "error");
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setSelectedServer(null);
        setForm({
            name: "",
            ipAddress: "",
            port: 22,
            username: "",
            type: "OTHER",
            status: "ACTIVE",
            description: "",
            sshKeyPath: "",
            monitoringUrl: "",
            cpuCores: "",
            ramGB: "",
            diskGB: "",
            notes: "",
        });
        setModalOpen(true);
    };

    const openEditModal = (server: any) => {
        setSelectedServer(server);
        setForm({
            name: server.name,
            ipAddress: server.ipAddress,
            port: server.port || 22,
            username: server.username || "",
            type: server.type || "OTHER",
            status: server.status || "ACTIVE",
            description: server.description || "",
            sshKeyPath: server.sshKeyPath || "",
            monitoringUrl: server.monitoringUrl || "",
            cpuCores: server.cpuCores?.toString() || "",
            ramGB: server.ramGB?.toString() || "",
            diskGB: server.diskGB?.toString() || "",
            notes: server.notes || "",
        });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedServer(null);
    };

    const copyToClipboard = async (text: string, label: string = "Text") => {
        try {
            await navigator.clipboard.writeText(text);
            addToast(`${label} copied to clipboard!`);
        } catch (error) {
            addToast("Failed to copy to clipboard", "error");
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const saveServer = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload: any = {
                name: form.name,
                ipAddress: form.ipAddress,
                port: Number(form.port),
                username: form.username,
                type: form.type,
                description: form.description,
                sshKeyPath: form.sshKeyPath,
                monitoringUrl: form.monitoringUrl,
                cpuCores: form.cpuCores ? Number(form.cpuCores) : null,
                ramGB: form.ramGB ? Number(form.ramGB) : null,
                diskGB: form.diskGB ? Number(form.diskGB) : null,
                notes: form.notes,
            };

            // Only include status when updating an existing server
            if (selectedServer) {
                payload.status = form.status;
                await api.patch(`/servers/${selectedServer.id}`, payload);
                addToast("Server updated");
            } else {
                // Don't send status when creating - it will default to ACTIVE
                await api.post("/servers", payload);
                addToast("Server created");
            }
            await loadServers();
            closeModal();
        } catch (error: any) {
            addToast(error?.response?.data?.message || "Failed to save server", "error");
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = (server: any) => {
        setConfirmServer(server);
        setConfirmOpen(true);
    };

    const deleteServer = async () => {
        if (!confirmServer) return;
        try {
            await api.delete(`/servers/${confirmServer.id}`);
            addToast("Server deleted");
            await loadServers();
        } catch (error: any) {
            addToast(error?.response?.data?.message || "Failed to delete server", "error");
        } finally {
            setConfirmOpen(false);
            setConfirmServer(null);
        }
    };

    if (loading || !user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <AppShell title="Servers" subtitle="Manage Infrastructure" userName={`${user.firstName} ${user.lastName}`} userRole={user.role}>
            <div className="flex justify-end mb-4">
                <button onClick={openCreateModal} className="btn btn-primary">Add Server</button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-[var(--border-subtle)] overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-[var(--border-subtle)]">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Server</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Connection</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resources</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[var(--border-subtle)]">
                        {servers.map(server => (
                            <tr key={server.id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900">{server.name}</div>
                                    <div className="text-sm text-gray-500">{server.description}</div>
                                    {server.monitoringUrl && (
                                        <a href={server.monitoringUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-flex items-center gap-1">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                            Monitoring
                                        </a>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900">{server.ipAddress}:{server.port}</div>
                                    {server.username && (
                                        <div className="text-xs text-gray-500">User: {server.username}</div>
                                    )}
                                    {server.username && (
                                        <button
                                            onClick={() => copyToClipboard(
                                                `ssh ${server.username}@${server.ipAddress} -p ${server.port}`,
                                                "SSH command"
                                            )}
                                            className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition"
                                            title="Copy SSH command"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            Copy SSH
                                        </button>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {(server.cpuCores || server.ramGB || server.diskGB) ? (
                                        <div className="text-xs space-y-0.5">
                                            {server.cpuCores && (
                                                <div className="text-gray-700 flex items-center gap-1.5">
                                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                                    </svg>
                                                    {server.cpuCores} Cores
                                                </div>
                                            )}
                                            {server.ramGB && (
                                                <div className="text-gray-700 flex items-center gap-1.5">
                                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                    </svg>
                                                    {server.ramGB} GB RAM
                                                </div>
                                            )}
                                            {server.diskGB && (
                                                <div className="text-gray-700 flex items-center gap-1.5">
                                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                                                    </svg>
                                                    {server.diskGB} GB Disk
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400">Not specified</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm text-gray-700">{server.type}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${server.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : server.status === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                        {server.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button onClick={() => openEditModal(server)} className="btn btn-primary btn-sm">Edit</button>
                                    <button onClick={() => confirmDelete(server)} className="btn btn-danger btn-sm">Delete</button>
                                </td>
                            </tr>
                        ))}
                        {servers.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">No servers found. Add your first server to get started.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal for Create/Edit */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4 text-gray-900">{selectedServer ? 'Edit Server' : 'Add Server'}</h2>
                        <form onSubmit={saveServer} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input name="name" value={form.name} onChange={handleChange} required className="input w-full" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">IP Address</label>
                                    <input name="ipAddress" value={form.ipAddress} onChange={handleChange} required className="input w-full" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Port</label>
                                    <input type="number" name="port" value={form.port} onChange={handleChange} className="input w-full" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Username</label>
                                <input name="username" value={form.username} onChange={handleChange} className="input w-full" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">SSH Key Path (optional)</label>
                                <input name="sshKeyPath" value={form.sshKeyPath} onChange={handleChange} className="input w-full" placeholder="/path/to/key.pem" />
                                <p className="text-xs text-gray-500 mt-1">Path to SSH private key file</p>
                            </div>
                            <div className={`grid ${selectedServer ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Type</label>
                                    <select name="type" value={form.type} onChange={handleChange} className="input w-full">
                                        <option value="DEVELOPMENT">Development</option>
                                        <option value="PRODUCTION">Production</option>
                                        <option value="DATABASE">Database</option>
                                        <option value="STAGING">Staging</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                {selectedServer && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Status</label>
                                        <select name="status" value={form.status} onChange={handleChange} className="input w-full">
                                            <option value="ACTIVE">Active</option>
                                            <option value="INACTIVE">Inactive</option>
                                            <option value="MAINTENANCE">Maintenance</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Resource Specifications */}
                            <div className="border-t pt-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">Resource Specifications</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">CPU Cores</label>
                                        <input type="number" name="cpuCores" value={form.cpuCores} onChange={handleChange} className="input w-full" placeholder="4" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">RAM (GB)</label>
                                        <input type="number" name="ramGB" value={form.ramGB} onChange={handleChange} className="input w-full" placeholder="16" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Disk (GB)</label>
                                        <input type="number" name="diskGB" value={form.diskGB} onChange={handleChange} className="input w-full" placeholder="500" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Monitoring URL (optional)</label>
                                <input name="monitoringUrl" value={form.monitoringUrl} onChange={handleChange} className="input w-full" placeholder="https://monitoring.example.com" />
                                <p className="text-xs text-gray-500 mt-1">Link to server monitoring dashboard</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea name="description" value={form.description} onChange={handleChange} className="input w-full" rows={2} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Notes</label>
                                <textarea name="notes" value={form.notes} onChange={handleChange} className="input w-full" rows={3} placeholder="Additional notes, configurations, or important information..." />
                            </div>

                            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                                <button type="button" onClick={closeModal} className="btn btn-ghost">Cancel</button>
                                <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Saving...' : 'Save'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal for Delete Confirm */}
            {confirmOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                        <h3 className="text-lg font-bold text-gray-900">Delete Server?</h3>
                        <p className="text-gray-500 my-4">Are you sure you want to delete {confirmServer?.name}?</p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setConfirmOpen(false)} className="btn btn-ghost">Cancel</button>
                            <button onClick={deleteServer} className="btn btn-danger">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </AppShell>
    );
}
