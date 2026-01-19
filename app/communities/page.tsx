"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService, User } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import api from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { TableSkeleton } from "@/components/Skeleton";
import { Users, MapPin, Phone, Mail, Calendar, Plus, Search, Filter, Edit, Trash2, X, LayoutGrid, List } from "lucide-react";

interface Community {
    id: string;
    name: string;
    code: string;
    description?: string;
    parishId: string;
    location?: string;
    sector?: string;
    cell?: string;
    village?: string;
    leaderId?: string;
    leaderName?: string;
    leaderPhone?: string;
    leaderEmail?: string;
    assistantLeaderId?: string;
    assistantLeaderName?: string;
    totalMembers: number;
    totalFamilies: number;
    meetingSchedule?: Array<{ day: string; time: string; location: string }>;
    isActive: boolean;
    parish?: any;
}

interface Parish {
    id: string;
    name: string;
    code: string;
}

export default function CommunitiesPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [communities, setCommunities] = useState<Community[]>([]);
    const [parishes, setParishes] = useState<Parish[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedParish, setSelectedParish] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingCommunity, setEditingCommunity] = useState<Community | null>(null);
    const { addToast } = useToast();
    const [confirmDelete, setConfirmDelete] = useState<{ id: string; isOpen: boolean }>({ id: "", isOpen: false });
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        description: "",
        parishId: "",
        location: "",
        sector: "",
        cell: "",
        village: "",
        leaderName: "",
        leaderPhone: "",
        leaderEmail: "",
        assistantLeaderName: "",
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
            const [communitiesRes, parishesRes] = await Promise.all([
                api.get("/communities"),
                api.get("/parishes"),
            ]);
            setCommunities(communitiesRes.data);
            setParishes(parishesRes.data);
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
            const response = await api.get(`/communities/search?q=${searchQuery}`);
            setCommunities(response.data);
        } catch (error) {
            console.error("Search failed:", error);
        }
    };

    const handleFilter = async () => {
        try {
            const params = new URLSearchParams();
            if (selectedParish) params.append("parishId", selectedParish);

            const response = await api.get(`/communities?${params.toString()}`);
            setCommunities(response.data);
        } catch (error) {
            console.error("Filter failed:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCommunity) {
                await api.patch(`/communities/${editingCommunity.id}`, formData);
            } else {
                await api.post("/communities", formData);
            }
            setShowModal(false);
            resetForm();
            loadData();
            addToast(`Community ${editingCommunity ? 'updated' : 'created'} successfully!`, "success");
        } catch (error: any) {
            addToast(error.response?.data?.message || "Failed to save community", "error");
        }
    };

    const handleEdit = (community: Community) => {
        setEditingCommunity(community);
        setFormData({
            name: community.name,
            code: community.code,
            description: community.description || "",
            parishId: community.parishId,
            location: community.location || "",
            sector: community.sector || "",
            cell: community.cell || "",
            village: community.village || "",
            leaderName: community.leaderName || "",
            leaderPhone: community.leaderPhone || "",
            leaderEmail: community.leaderEmail || "",
            assistantLeaderName: community.assistantLeaderName || "",
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        try {
            setIsActionLoading(true);
            await api.delete(`/communities/${id}`);
            setConfirmDelete({ id: "", isOpen: false });
            loadData();
            addToast("Community deleted successfully", "success");
        } catch (error) {
            addToast("Failed to delete community", "error");
        } finally {
            setIsActionLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            code: "",
            description: "",
            parishId: "",
            location: "",
            sector: "",
            cell: "",
            village: "",
            leaderName: "",
            leaderPhone: "",
            leaderEmail: "",
            assistantLeaderName: "",
        });
        setEditingCommunity(null);
    };

    const handleLogout = () => {
        authService.logout();
        router.push("/login");
    };

    const filteredCommunities = communities;

    if (!user) return null;

    return (
        <AppShell
            title="Communities Management"
            subtitle={`Manage ${communities.length.toLocaleString()} grassroots communities`}
            userName={`${user.firstName} ${user.lastName}`}
            userRole={user.role}
            onLogout={handleLogout}
        >
            <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="flex-1 w-full sm:w-auto">
                        <div className="flex gap-2">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type="text"
                                    placeholder="Search communities..."
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
                    </div>
                    <div className="flex gap-2">
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
                            onClick={() => {
                                resetForm();
                                setShowModal(true);
                            }}
                            className="btn-epr"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Add Community
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 text-gray-900 font-bold">
                        <Filter className="h-5 w-5 text-epr-green-600" />
                        Community Filters
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <select
                            value={selectedParish}
                            onChange={(e) => setSelectedParish(e.target.value)}
                            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-epr-green-500/10 focus:border-epr-green-500 transition-all outline-none text-sm font-medium"
                        >
                            <option value="">All Parishes</option>
                            {parishes.map((parish) => (
                                <option key={parish.id} value={parish.id}>
                                    {parish.name}
                                </option>
                            ))}
                        </select>
                        <div className="flex gap-2">
                            <button
                                onClick={handleFilter}
                                className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all active:scale-95"
                            >
                                Apply
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedParish("");
                                    loadData();
                                }}
                                className="px-6 py-2.5 bg-gray-100 text-gray-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="h-8 w-8 text-epr-green-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{communities.length}</p>
                        <p className="text-sm text-gray-600">Total Communities</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                            <MapPin className="h-8 w-8 text-blue-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                            {communities.reduce((sum, c) => sum + c.totalMembers, 0).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">Total Members</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="h-8 w-8 text-purple-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                            {communities.filter((c) => c.isActive).length}
                        </p>
                        <p className="text-sm text-gray-600">Active Communities</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="h-8 w-8 text-orange-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                            {communities.filter((c) => c.leaderName).length}
                        </p>
                        <p className="text-sm text-gray-600">With Leaders</p>
                    </div>
                </div>

                {/* Communities Content */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-epr-green-600"></div>
                        <p className="mt-4 text-gray-600">Loading communities...</p>
                    </div>
                ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCommunities.map((community) => (
                            <div
                                key={community.id}
                                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{community.name}</h3>
                                        <p className="text-sm text-gray-600">Code: {community.code}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(community)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => setConfirmDelete({ id: community.id, isOpen: true })}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {community.parish && (
                                    <div className="mb-3 pb-3 border-b border-gray-200">
                                        <p className="text-sm text-gray-600">
                                            <MapPin className="inline h-4 w-4 mr-1" />
                                            {community.parish.name}
                                        </p>
                                    </div>
                                )}

                                {community.location && (
                                    <p className="text-sm text-gray-600 mb-2">
                                        <MapPin className="inline h-4 w-4 mr-1" />
                                        {community.location}
                                    </p>
                                )}

                                {community.leaderName && (
                                    <div className="mb-3">
                                        <p className="text-sm font-semibold text-gray-900">Leader:</p>
                                        <p className="text-sm text-gray-700">{community.leaderName}</p>
                                        {community.leaderPhone && (
                                            <p className="text-sm text-gray-600">
                                                <Phone className="inline h-3 w-3 mr-1" />
                                                {community.leaderPhone}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-epr-green-600">{community.totalMembers}</p>
                                        <p className="text-xs text-gray-600">Members</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-blue-600">{community.totalFamilies}</p>
                                        <p className="text-xs text-gray-600">Families</p>
                                    </div>
                                    <div>
                                        <span
                                            className={`px-2 py-1 text-xs rounded-full ${community.isActive
                                                ? "bg-green-100 text-green-800"
                                                : "bg-gray-100 text-gray-800"
                                                }`}
                                        >
                                            {community.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Community Name</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Parish</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Leader</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Members</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Families</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredCommunities.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{c.name}</div>
                                            <div className="text-xs text-epr-green-600 font-mono">{c.code}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{c.parish?.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <div className="font-medium">{c.leaderName || "---"}</div>
                                            <div className="text-xs text-gray-400">{c.leaderPhone}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-epr-green-600 font-bold text-center">{c.totalMembers}</td>
                                        <td className="px-6 py-4 text-sm text-blue-600 font-bold text-center">{c.totalFamilies}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span
                                                className={`px-2 py-1 text-xs rounded-full font-semibold ${c.isActive
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-gray-100 text-gray-800"
                                                    }`}
                                            >
                                                {c.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleEdit(c)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg mr-2"><Edit className="h-4 w-4" /></button>
                                            <button onClick={() => setConfirmDelete({ id: c.id, isOpen: true })} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && filteredCommunities.length === 0 && (
                    <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
                        <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No communities found</p>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingCommunity ? "Edit Community" : "Add New Community"}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    resetForm();
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Community Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-epr-green-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Community Code *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-epr-green-500"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Parish *
                                    </label>
                                    <select
                                        required
                                        value={formData.parishId}
                                        onChange={(e) => setFormData({ ...formData, parishId: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-epr-green-500"
                                    >
                                        <option value="">Select Parish</option>
                                        {parishes.map((parish) => (
                                            <option key={parish.id} value={parish.id}>
                                                {parish.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-epr-green-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Location
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-epr-green-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Sector
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.sector}
                                        onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-epr-green-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Cell
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.cell}
                                        onChange={(e) => setFormData({ ...formData, cell: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-epr-green-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Village
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.village}
                                        onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-epr-green-500"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-4 mt-4">
                                <h3 className="font-semibold text-gray-900 mb-4">Leader Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Leader Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.leaderName}
                                            onChange={(e) => setFormData({ ...formData, leaderName: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-epr-green-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Leader Phone
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.leaderPhone}
                                            onChange={(e) => setFormData({ ...formData, leaderPhone: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-epr-green-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Leader Email
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.leaderEmail}
                                            onChange={(e) => setFormData({ ...formData, leaderEmail: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-epr-green-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Assistant Leader Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.assistantLeaderName}
                                            onChange={(e) =>
                                                setFormData({ ...formData, assistantLeaderName: e.target.value })
                                            }
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-epr-green-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6 mt-6 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                    className="btn-outline flex-1 py-4 text-xs tracking-widest"
                                >
                                    DISCARD
                                </button>
                                <button
                                    type="submit"
                                    className="btn-epr flex-[2] py-4 text-xs tracking-widest"
                                >
                                    {editingCommunity ? "UPDATE COMMUNITY" : "CONFIRM REGISTRATION"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmDelete.isOpen}
                title="Delete Community"
                message="Are you sure you want to delete this community? This action will remove all associations with members in this community."
                type="danger"
                onConfirm={() => handleDelete(confirmDelete.id)}
                onCancel={() => setConfirmDelete({ id: "", isOpen: false })}
                confirmText="Delete"
                isLoading={isActionLoading}
            />
        </AppShell>
    );
}
