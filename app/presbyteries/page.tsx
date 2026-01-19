"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService, User } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import api from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { TableSkeleton } from "@/components/Skeleton";
import { Church, MapPin, Users, Plus, Edit, Trash2, BarChart3, X, LayoutGrid, List, Download, Upload } from "lucide-react";

interface Presbytery {
    id: string;
    name: string;
    description?: string;
    location?: string;
    region?: string;
    leaderName?: string;
    leaderPhone?: string;
    leaderEmail?: string;
    officeAddress?: string;
    officePhone?: string;
    officeEmail?: string;
    totalParishes: number;
    totalCommunities: number;
    totalMembers: number;
    isActive: boolean;
}

export default function PresbyteriesPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [presbyteries, setPresbyteries] = useState<Presbytery[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const { addToast } = useToast();
    const [confirmDelete, setConfirmDelete] = useState<{ id: string; isOpen: boolean }>({ id: "", isOpen: false });
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        location: "",
        region: "",
        leaderName: "",
        leaderPhone: "",
        leaderEmail: "",
        officeAddress: "",
        officePhone: "",
        officeEmail: "",
    });

    useEffect(() => {
        const currentUser = authService.getUser();
        if (!currentUser) {
            router.push("/login");
            return;
        }
        setUser(currentUser);
        loadPresbyteries();
    }, [router]);

    // Handle edit query parameter
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const editId = params.get('edit');

        if (editId && presbyteries.length > 0) {
            const presbyteryToEdit = presbyteries.find(p => p.id === editId);
            if (presbyteryToEdit) {
                handleEdit(presbyteryToEdit);
                // Clean up URL
                window.history.replaceState({}, '', '/presbyteries');
            }
        }
    }, [presbyteries]);

    const loadPresbyteries = async () => {
        setLoading(true);
        try {
            const response = await api.get("/presbyteries");
            setPresbyteries(response.data);
        } catch (error) {
            console.error("Failed to load presbyteries:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingId) {
                await api.patch(`/presbyteries/${editingId}`, formData);
                addToast(`Presbytery "${formData.name}" updated successfully!`, "success");
            } else {
                await api.post("/presbyteries", formData);
                addToast(`Presbytery "${formData.name}" created successfully!`, "success");
            }
            setShowModal(false);
            setEditingId(null);
            setFormData({
                name: "",
                description: "",
                location: "",
                region: "",
                leaderName: "",
                leaderPhone: "",
                leaderEmail: "",
                officeAddress: "",
                officePhone: "",
                officeEmail: "",
            });
            loadPresbyteries();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message;
            if (Array.isArray(errorMessage)) {
                addToast(errorMessage.join(", "), "error");
            } else if (errorMessage) {
                addToast(errorMessage, "error");
            } else if (error.response?.status === 409) {
                addToast("A presbytery with this name already exists", "error");
            } else if (error.response?.status === 400) {
                addToast("Please check all required fields and try again", "error");
            } else {
                addToast("Failed to save presbytery. Please try again.", "error");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExport = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/data/template/presbyteries`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to download template');
            }

            // Get the blob from the response
            const blob = await response.blob();

            // Create a download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'presbyteries_template.xlsx';
            document.body.appendChild(a);
            a.click();

            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            addToast("Template downloaded successfully", "success");
        } catch (error) {
            console.error('Download error:', error);
            addToast("Failed to download template", "error");
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setLoading(true);
            const res = await api.post('/data/import/presbyteries', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            addToast(`Import successful! ${res.data.success || res.data.imported || 0} presbyteries imported.`, "success");
            loadPresbyteries();
            e.target.value = '';
        } catch (error: any) {
            const errorMessage = error.response?.data?.message;
            if (Array.isArray(errorMessage)) {
                addToast(`Import failed: ${errorMessage.join(", ")}`, "error");
            } else if (errorMessage) {
                addToast(`Import failed: ${errorMessage}`, "error");
            } else {
                addToast("Import failed. Please check your file format and try again.", "error");
            }
            e.target.value = '';
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (presbytery: Presbytery) => {
        setEditingId(presbytery.id);
        setFormData({
            name: presbytery.name,
            description: presbytery.description || "",
            location: presbytery.location || "",
            region: presbytery.region || "",
            leaderName: presbytery.leaderName || "",
            leaderPhone: presbytery.leaderPhone || "",
            leaderEmail: presbytery.leaderEmail || "",
            officeAddress: presbytery.officeAddress || "",
            officePhone: presbytery.officePhone || "",
            officeEmail: presbytery.officeEmail || "",
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        try {
            setIsActionLoading(true);
            await api.delete(`/presbyteries/${id}`);
            setConfirmDelete({ id: "", isOpen: false });
            loadPresbyteries();
            addToast("Presbytery removed from system", "success");
        } catch (error) {
            addToast("Failed to delete presbytery", "error");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        router.push("/login");
    };

    if (!user) return null;

    return (
        <AppShell
            title="Presbyteries Management"
            subtitle="Manage the 7 Presbyteries of EPR"
            userName={`${user.firstName} ${user.lastName}`}
            userRole={user.role}
            onLogout={handleLogout}
        >
            <div className="max-w-[1600px] mx-auto space-y-6">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">All Presbyteries</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {presbyteries.length} presbyteries registered
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex p-1 bg-gray-100 rounded-lg mr-2">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`p-2 rounded-md ${viewMode === "grid" ? "bg-white shadow-sm text-epr-green-600" : "text-gray-500 hover:text-gray-700"}`}
                            >
                                <LayoutGrid className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`p-2 rounded-md ${viewMode === "list" ? "bg-white shadow-sm text-epr-green-600" : "text-gray-500 hover:text-gray-700"}`}
                            >
                                <List className="h-5 w-5" />
                            </button>
                        </div>
                        <button
                            onClick={handleExport}
                            className="p-3 text-gray-400 hover:text-epr-green-600 hover:bg-epr-green-50 bg-white border border-gray-200 rounded-xl transition-all shadow-sm"
                            title="Download Excel Template"
                        >
                            <Download className="h-5 w-5" />
                        </button>
                        <label className="p-3 text-gray-400 hover:text-purple-600 hover:bg-purple-50 bg-white border border-gray-200 rounded-xl transition-all cursor-pointer shadow-sm" title="Bulk Import Presbyteries">
                            <Upload className="h-5 w-5" />
                            <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleImport} />
                        </label>
                        <button
                            onClick={() => {
                                setEditingId(null);
                                setFormData({
                                    name: "",
                                    description: "",
                                    location: "",
                                    region: "",
                                    leaderName: "",
                                    leaderPhone: "",
                                    leaderEmail: "",
                                    officeAddress: "",
                                    officePhone: "",
                                    officeEmail: "",
                                });
                                setShowModal(true);
                            }}
                            className="btn-epr"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Add Presbytery
                        </button>
                    </div>
                </div>

                {/* Presbyteries Content */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-epr-green-600 border-r-transparent"></div>
                        <p className="mt-4 text-gray-600">Loading presbyteries...</p>
                    </div>
                ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {presbyteries.map((presbytery) => (
                            <div
                                key={presbytery.id}
                                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-epr-green-100 rounded-xl">
                                            <Church className="h-6 w-6 text-epr-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900">
                                                {presbytery.name}
                                            </h3>
                                            {presbytery.location && (
                                                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {presbytery.location}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Statistics */}
                                <div className="grid grid-cols-3 gap-4 mb-4 pt-4 border-t border-gray-100">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-epr-green-600">
                                            {presbytery.totalParishes}
                                        </p>
                                        <p className="text-xs text-gray-600">Parishes</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-epr-gold-600">
                                            {presbytery.totalCommunities}
                                        </p>
                                        <p className="text-xs text-gray-600">Communities</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-blue-600">
                                            {presbytery.totalMembers.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-gray-600">Members</p>
                                    </div>
                                </div>

                                {/* Leader Info */}
                                {presbytery.leaderName && (
                                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-600 mb-1">Leader</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {presbytery.leaderName}
                                        </p>
                                        {presbytery.leaderPhone && (
                                            <p className="text-xs text-gray-600 mt-1">
                                                {presbytery.leaderPhone}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => router.push(`/presbyteries/${presbytery.id}`)}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-epr-green-50 text-epr-green-700 rounded-lg text-sm font-semibold hover:bg-epr-green-100 transition-colors"
                                    >
                                        <BarChart3 className="h-4 w-4" />
                                        View Details
                                    </button>
                                    <button
                                        onClick={() => handleEdit(presbytery)}
                                        className="p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setConfirmDelete({ id: presbytery.id, isOpen: true })}
                                        className="p-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Presbytery Name</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Leader</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Parishes</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Communities</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Members</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {presbyteries.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{p.name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {p.location || "---"}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <div className="font-medium">{p.leaderName || "---"}</div>
                                            <div className="text-xs text-gray-400">{p.leaderPhone}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-bold text-center">{p.totalParishes}</td>
                                        <td className="px-6 py-4 text-sm text-epr-gold-600 font-bold text-center">{p.totalCommunities}</td>
                                        <td className="px-6 py-4 text-sm text-blue-600 font-bold text-center">{p.totalMembers.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => router.push(`/presbyteries/${p.id}`)}
                                                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                                                    title="View Details"
                                                >
                                                    <BarChart3 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(p)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                    title="Edit"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDelete({ id: p.id, isOpen: true })}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur px-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-900">
                                    {editingId ? "Edit Presbytery" : "Add New Presbytery"}
                                </h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Presbytery Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="input-premium"
                                        placeholder="e.g., Gitarama"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description || ""}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="input-premium min-h-[80px]"
                                        placeholder="Brief description of the presbytery..."
                                        rows={3}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Location
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            className="input-premium"
                                            placeholder="City/Region"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Region
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.region}
                                            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                            className="input-premium"
                                            placeholder="Region"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Leader Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.leaderName}
                                        onChange={(e) => setFormData({ ...formData, leaderName: e.target.value })}
                                        className="input-premium"
                                        placeholder="Rev. Name"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Leader Phone
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.leaderPhone}
                                            onChange={(e) => setFormData({ ...formData, leaderPhone: e.target.value })}
                                            className="input-premium"
                                            placeholder="+250..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Leader Email
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.leaderEmail}
                                            onChange={(e) => setFormData({ ...formData, leaderEmail: e.target.value })}
                                            className="input-premium"
                                            placeholder="email@example.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Office Address
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.officeAddress}
                                        onChange={(e) => setFormData({ ...formData, officeAddress: e.target.value })}
                                        className="input-premium"
                                        placeholder="Office location"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Office Phone
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.officePhone}
                                            onChange={(e) => setFormData({ ...formData, officePhone: e.target.value })}
                                            className="input-premium"
                                            placeholder="+250..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Office Email
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.officeEmail}
                                            onChange={(e) => setFormData({ ...formData, officeEmail: e.target.value })}
                                            className="input-premium"
                                            placeholder="office@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 pt-6 border-t border-gray-100 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="btn-outline flex-1 py-4 text-xs tracking-widest"
                                    >
                                        DISCARD
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="btn-epr flex-[2] py-4 text-xs tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? "SAVING..." : (editingId ? "UPDATE PRESBYTERY" : "CREATE PRESBYTERY")}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={confirmDelete.isOpen}
                title="Delete Presbytery"
                message="Are you sure you want to delete this presbytery? This is a high-level administrative action that will affect all linked parishes, communities, and members within this presbytery. This action cannot be undone."
                type="danger"
                onConfirm={() => handleDelete(confirmDelete.id)}
                onCancel={() => setConfirmDelete({ id: "", isOpen: false })}
                confirmText="Delete Presbytery"
                isLoading={isActionLoading}
            />
        </AppShell>
    );
}
