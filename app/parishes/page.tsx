"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService, User } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import api from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { TableSkeleton } from "@/components/Skeleton";
import {
    Church,
    MapPin,
    Phone,
    Mail,
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    X,
    Users,
    LayoutGrid,
    List as ListIcon
} from "lucide-react";

interface Parish {
    id: string;
    name: string;
    code: string;
    description?: string;
    presbyteryId: string;
    location?: string;
    address?: string;
    phone?: string;
    email?: string;
    pastorName?: string;
    totalCommunities: number;
    totalMembers: number;
    isActive: boolean;
    presbytery?: {
        id: string;
        name: string;
    };
}

interface Presbytery {
    id: string;
    name: string;
}

export default function ParishesPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [parishes, setParishes] = useState<Parish[]>([]);
    const [presbyteries, setPresbyteries] = useState<Presbytery[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPresbytery, setSelectedPresbytery] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [editingParish, setEditingParish] = useState<Parish | null>(null);
    const { addToast } = useToast();
    const [confirmDelete, setConfirmDelete] = useState<{ id: string; isOpen: boolean }>({ id: "", isOpen: false });
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        description: "",
        presbyteryId: "",
        location: "",
        address: "",
        phone: "",
        email: "",
        pastorName: "",
    });

    useEffect(() => {
        const currentUser = authService.getUser();
        if (!currentUser) {
            router.push("/login");
            return;
        }
        setUser(currentUser);
        loadData();
    }, [router]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [parishesRes, presbyteriesRes] = await Promise.all([
                api.get("/parishes"),
                api.get("/presbyteries"),
            ]);
            setParishes(parishesRes.data);
            setPresbyteries(presbyteriesRes.data);
        } catch (error) {
            console.error("Failed to load data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            loadData();
            return;
        }
        try {
            const response = await api.get(`/parishes/search?q=${searchQuery}`);
            setParishes(response.data);
        } catch (error) {
            console.error("Search failed:", error);
        }
    };

    const handleFilter = async () => {
        try {
            const params = new URLSearchParams();
            if (selectedPresbytery) params.append("presbyteryId", selectedPresbytery);

            const response = await api.get(`/parishes?${params.toString()}`);
            setParishes(response.data);
        } catch (error) {
            console.error("Filter failed:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingParish) {
                await api.patch(`/parishes/${editingParish.id}`, formData);
            } else {
                await api.post("/parishes", formData);
            }
            setShowModal(false);
            resetForm();
            loadData();
            addToast(`Parish ${editingParish ? 'updated' : 'registered'} successfully!`, "success");
        } catch (error: any) {
            addToast(error.response?.data?.message || "Operation failed", "error");
        }
    };

    const handleEdit = (parish: Parish) => {
        setEditingParish(parish);
        setFormData({
            name: parish.name,
            code: parish.code,
            description: parish.description || "",
            presbyteryId: parish.presbyteryId,
            location: parish.location || "",
            address: parish.address || "",
            phone: parish.phone || "",
            email: parish.email || "",
            pastorName: parish.pastorName || "",
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        try {
            setIsActionLoading(true);
            await api.delete(`/parishes/${id}`);
            setConfirmDelete({ id: "", isOpen: false });
            loadData();
            addToast("Parish records removed successfully", "success");
        } catch (error) {
            addToast("Failed to delete parish", "error");
        } finally {
            setIsActionLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            code: "",
            description: "",
            presbyteryId: "",
            location: "",
            address: "",
            phone: "",
            email: "",
            pastorName: "",
        });
        setEditingParish(null);
    };

    const handleLogout = () => {
        authService.logout();
        router.push("/login");
    };

    if (!user) return null;

    return (
        <AppShell
            title="Parishes Management"
            subtitle={`Overseeing all ${parishes.length} EPR parishes across Rwanda`}
            userName={`${user.firstName} ${user.lastName}`}
            userRole={user.role}
            onLogout={handleLogout}
        >
            <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                    <div className="flex flex-1 w-full gap-2">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Search parishes by name or code..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                                className="input-premium pl-10"
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            className="px-6 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-black transition-all active:scale-95 shadow-sm font-black text-[10px] uppercase tracking-widest"
                        >
                            Search
                        </button>
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
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
                                <ListIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <button
                            onClick={() => {
                                resetForm();
                                setShowModal(true);
                            }}
                            className="btn-epr"
                        >
                            <Plus className="h-5 w-5" />
                            New Parish
                        </button>
                    </div>
                </div>

                {/* Filters & Stats Summary */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    <div className="xl:col-span-3 bg-white border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4">
                        <div className="flex items-center gap-2 text-gray-600 font-medium whitespace-nowrap">
                            <Filter className="h-5 w-5" />
                            Filter by Presbytery:
                        </div>
                        <select
                            value={selectedPresbytery}
                            onChange={(e) => setSelectedPresbytery(e.target.value)}
                            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-epr-green-500"
                        >
                            <option value="">All Presbyteries</option>
                            {presbyteries.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <div className="flex gap-2 w-full md:w-auto">
                            <button
                                onClick={handleFilter}
                                className="flex-1 md:flex-none px-6 py-2 bg-gray-900 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-black transition-all active:scale-95"
                            >
                                Apply
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedPresbytery("");
                                    loadData();
                                }}
                                className="flex-1 md:flex-none px-6 py-2 bg-gray-100 text-gray-500 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all active:scale-95"
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    <div className="bg-epr-green-600 rounded-xl p-4 text-white flex items-center justify-between">
                        <div>
                            <p className="text-epr-green-100 text-sm font-medium">Total Members</p>
                            <p className="text-2xl font-bold">{parishes.reduce((acc, p) => acc + p.totalMembers, 0).toLocaleString()}</p>
                        </div>
                        <Users className="h-10 w-10 text-epr-green-400" />
                    </div>
                </div>

                {/* Main Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-epr-green-100 border-t-epr-green-600 mb-4"></div>
                        <p className="text-gray-500 font-medium">Fetching parishes records...</p>
                    </div>
                ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {parishes.map((parish) => (
                            <div
                                key={parish.id}
                                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 group"
                            >
                                <div className="bg-epr-green-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <Church className="h-6 w-6 text-epr-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 group-hover:text-epr-green-700 transition-colors">{parish.name}</h3>
                                            <p className="text-xs font-mono text-epr-green-600 bg-epr-green-100 px-2 rounded-full inline-block mt-1">
                                                {parish.code}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(parish)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => setConfirmDelete({ id: parish.id, isOpen: true })}
                                            className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Presbytery</p>
                                            <p className="text-sm font-semibold text-gray-900">{parish.presbytery?.name || "N/A"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Pastor In Charge</p>
                                            <p className="text-sm font-semibold text-gray-900 truncate">{parish.pastorName || "Unassigned"}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {parish.location && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                                                <span className="truncate">{parish.location}</span>
                                            </div>
                                        )}
                                        {parish.phone && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                                                <span>{parish.phone}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 flex items-center justify-around border-t border-gray-100">
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-gray-900">{parish.totalCommunities}</p>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Communities</p>
                                        </div>
                                        <div className="h-8 w-[1px] bg-gray-100"></div>
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-epr-green-600">{parish.totalMembers}</p>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Members</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Parish Name</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Presbytery</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Pastor</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Communities</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Members</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {parishes.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{p.name}</div>
                                            <div className="text-xs text-epr-green-600 font-mono">{p.code}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{p.presbytery?.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{p.pastorName || "---"}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-bold text-center">{p.totalCommunities}</td>
                                        <td className="px-6 py-4 text-sm text-epr-green-600 font-bold text-center">{p.totalMembers}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleEdit(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg mr-2"><Edit className="h-4 w-4" /></button>
                                            <button onClick={() => setConfirmDelete({ id: p.id, isOpen: true })} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && parishes.length === 0 && (
                    <div className="text-center py-20 bg-white border border-dashed border-gray-300 rounded-xl">
                        <Church className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900">No parishes found</h3>
                        <p className="text-gray-500">Try adjusting your filters or search query</p>
                    </div>
                )}
            </div>

            {/* Parish Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-6 flex justify-between items-center z-10">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {editingParish ? "Modify Parish" : "Register Parish"}
                                </h2>
                                <p className="text-sm text-gray-500">Enter ecclesiastical details for the parish</p>
                            </div>
                            <button
                                onClick={() => { setShowModal(false); resetForm(); }}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2 space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Base Identity</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-gray-700">Parish Name *</label>
                                            <input
                                                type="text" required
                                                placeholder="e.g. Kigali Central"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-epr-green-500/10 focus:border-epr-green-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-gray-700">Parish Code *</label>
                                            <input
                                                type="text" required
                                                placeholder="e.g. KGL-001"
                                                value={formData.code}
                                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-epr-green-500/10 focus:border-epr-green-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Affiliated Presbytery *</label>
                                    <select
                                        required
                                        value={formData.presbyteryId}
                                        onChange={(e) => setFormData({ ...formData, presbyteryId: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-epr-green-500/10 focus:border-epr-green-500 outline-none transition-all"
                                    >
                                        <option value="">Select Parent Presbytery</option>
                                        {presbyteries.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Pastor in Charge</label>
                                    <input
                                        type="text"
                                        placeholder="Full name of the managing pastor"
                                        value={formData.pastorName}
                                        onChange={(e) => setFormData({ ...formData, pastorName: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-epr-green-500/10 focus:border-epr-green-500 outline-none transition-all"
                                    />
                                </div>

                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Brief History/Description</label>
                                    <textarea
                                        placeholder="Optional details about the parish mission or background"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={2}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-epr-green-500/10 focus:border-epr-green-500 outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">General Location</label>
                                    <input
                                        type="text"
                                        placeholder="Sector / District"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-epr-green-500/10 focus:border-epr-green-500 outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Detailed Address</label>
                                    <input
                                        type="text"
                                        placeholder="Cell / Village / St."
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-epr-green-500/10 focus:border-epr-green-500 outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Official Phone</label>
                                    <input
                                        type="tel"
                                        placeholder="+250..."
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-epr-green-500/10 focus:border-epr-green-500 outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Official Email</label>
                                    <input
                                        type="email"
                                        placeholder="parish@epr.rw"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-epr-green-500/10 focus:border-epr-green-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6 border-t border-gray-100 mt-6">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); resetForm(); }}
                                    className="btn-outline flex-1 py-4 text-xs tracking-widest"
                                >
                                    DISCARD
                                </button>
                                <button
                                    type="submit"
                                    className="btn-epr flex-[2] py-4 text-xs tracking-widest"
                                >
                                    {editingParish ? "APPLY UPDATES" : "COMPLETE REGISTRATION"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmDelete.isOpen}
                title="Delete Parish"
                message="Are you sure you want to delete this parish? This action will permanently remove all associated communities and member records from this parish. This action is irreversible."
                type="danger"
                onConfirm={() => handleDelete(confirmDelete.id)}
                onCancel={() => setConfirmDelete({ id: "", isOpen: false })}
                confirmText="Delete Permanently"
                isLoading={isActionLoading}
            />
        </AppShell>
    );
}
