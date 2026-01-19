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
    Users,
    Search,
    Filter,
    Plus,
    Edit,
    Trash2,
    X,
    Phone,
    Mail,
    MapPin,
    Calendar,
    CheckCircle,
    XCircle,
    MoreVertical,
    Download,
    ArrowRightLeft,
    UserCheck,
    Award,
    Heart,
    Upload,
    LayoutGrid,
    List
} from "lucide-react";

interface Member {
    id: string;
    firstName: string;
    lastName: string;
    membershipNumber: string;
    gender: string;
    dateOfBirth: string;
    phone?: string;
    email?: string;
    address?: string;
    occupations?: string;
    parishId: string;
    communityId?: string;
    status: "ACTIVE" | "INACTIVE" | "DECEASED" | "TRANSFERRED";
    isBaptized: boolean;
    baptismDate?: string;
    isConfirmed: boolean;
    confirmationDate?: string;
    isMarried: boolean;
    marriageDate?: string;
    photoUrl?: string;
    parish?: { name: string };
    community?: { name: string };
}

export default function MembersPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState<Member[]>([]);
    const [parishes, setParishes] = useState<any[]>([]);
    const [communities, setCommunities] = useState<any[]>([]);

    const [searchQuery, setSearchQuery] = useState("");
    const [filterParish, setFilterParish] = useState("");
    const [filterStatus, setFilterStatus] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const { addToast } = useToast();
    const [confirmDelete, setConfirmDelete] = useState<{ id: string; isOpen: boolean }>({ id: "", isOpen: false });
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [viewMode, setViewMode] = useState<"grid" | "list">("list");
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        gender: "MALE",
        dateOfBirth: "",
        phone: "",
        email: "",
        address: "",
        occupations: "",
        parishId: "",
        communityId: "",
        status: "ACTIVE",
        isBaptized: false,
        baptismDate: "",
        isConfirmed: false,
        confirmationDate: "",
        isMarried: false,
        marriageDate: "",
    });

    useEffect(() => {
        const currentUser = authService.getUser();
        if (!currentUser) {
            router.push("/login");
            return;
        }
        setUser(currentUser);
        loadInitialData();
    }, [router]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [membersRes, parishesRes] = await Promise.all([
                api.get("/members"),
                api.get("/parishes"),
            ]);
            setMembers(membersRes.data);
            setParishes(parishesRes.data);
        } catch (error) {
            console.error("Failed to load initial data:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadCommunities = async (parishId: string) => {
        if (!parishId) {
            setCommunities([]);
            return;
        }
        try {
            const res = await api.get(`/communities?parishId=${parishId}`);
            setCommunities(res.data);
        } catch (error) {
            console.error("Failed to load communities:", error);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            loadInitialData();
            return;
        }
        setLoading(true);
        try {
            const res = await api.get(`/members/search?q=${searchQuery}`);
            setMembers(res.data);
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterParish) params.append("parishId", filterParish);
            if (filterStatus) params.append("status", filterStatus);

            const res = await api.get(`/members?${params.toString()}`);
            setMembers(res.data);
        } catch (error) {
            console.error("Filter failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingMember) {
                await api.patch(`/members/${editingMember.id}`, formData);
            } else {
                await api.post("/members", formData);
            }
            setShowModal(false);
            resetForm();
            loadInitialData();
            addToast(`Member ${editingMember ? 'updated' : 'registered'} successfully!`, "success");
        } catch (error: any) {
            addToast(error.response?.data?.message || "Operation failed", "error");
        }
    };

    const resetForm = () => {
        setFormData({
            firstName: "",
            lastName: "",
            gender: "MALE",
            dateOfBirth: "",
            phone: "",
            email: "",
            address: "",
            occupations: "",
            parishId: "",
            communityId: "",
            status: "ACTIVE",
            isBaptized: false,
            baptismDate: "",
            isConfirmed: false,
            confirmationDate: "",
            isMarried: false,
            marriageDate: "",
        });
        setEditingMember(null);
    };

    const handleEdit = (m: Member) => {
        setEditingMember(m);
        setFormData({
            firstName: m.firstName,
            lastName: m.lastName,
            gender: m.gender,
            dateOfBirth: m.dateOfBirth?.split('T')[0] || "",
            phone: m.phone || "",
            email: m.email || "",
            address: m.address || "",
            occupations: m.occupations || "",
            parishId: m.parishId,
            communityId: m.communityId || "",
            status: m.status,
            isBaptized: m.isBaptized,
            baptismDate: m.baptismDate?.split('T')[0] || "",
            isConfirmed: m.isConfirmed,
            confirmationDate: m.confirmationDate?.split('T')[0] || "",
            isMarried: m.isMarried,
            marriageDate: m.marriageDate?.split('T')[0] || "",
        });
        loadCommunities(m.parishId);
        setShowModal(true);
    };

    const handleExport = async () => {
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/data/template/members`;
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setLoading(true);
            const res = await api.post('/data/import/members', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            addToast(`Import Successful! ${res.data.success} members added to registry.`, "success");
            loadInitialData();
        } catch (error: any) {
            addToast(error.response?.data?.message || "Import failed", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            setIsActionLoading(true);
            await api.delete(`/members/${id}`);
            setConfirmDelete({ id: "", isOpen: false });
            loadInitialData();
            addToast("Member record removed from active registry.", "info");
        } catch (error) {
            addToast("Failed to remove member record.", "error");
        } finally {
            setIsActionLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "ACTIVE": return "bg-green-100 text-green-700";
            case "INACTIVE": return "bg-gray-100 text-gray-700";
            case "DECEASED": return "bg-red-100 text-red-700";
            case "TRANSFERRED": return "bg-blue-100 text-blue-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    if (!user) return null;

    return (
        <AppShell
            title="Members Registry"
            subtitle="Comprehensive database of all church members"
            userName={`${user.firstName} ${user.lastName}`}
            userRole={user.role}
            onLogout={() => { authService.logout(); router.push("/login"); }}
        >
            <div className="space-y-6">
                {/* Actions Row */}
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                    <div className="flex flex-1 w-full gap-2">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Search by name or member ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                                className="input-premium pl-10"
                            />
                        </div>
                        <button onClick={handleSearch} className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-sm">
                            Search
                        </button>
                    </div>

                    <div className="flex gap-3 w-full lg:w-auto">
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
                        <label className="p-3 text-gray-400 hover:text-purple-600 hover:bg-purple-50 bg-white border border-gray-200 rounded-xl transition-all cursor-pointer shadow-sm" title="Bulk Import Members">
                            <Upload className="h-5 w-5" />
                            <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleImport} />
                        </label>
                        <button
                            onClick={() => { resetForm(); setShowModal(true); }}
                            className="btn-epr"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Registry Member
                        </button>
                    </div>
                </div>

                {/* Filters Card */}
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 text-gray-900 font-bold">
                        <Filter className="h-5 w-5 text-epr-green-600" />
                        Registry Filters
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Parish</label>
                            <select
                                value={filterParish}
                                onChange={(e) => setFilterParish(e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-epr-green-500/10 focus:border-epr-green-500 transition-all outline-none text-sm font-medium"
                            >
                                <option value="">All Parishes</option>
                                {parishes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Status</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-epr-green-500 transition-all outline-none"
                            >
                                <option value="">All Statuses</option>
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                                <option value="DECEASED">Deceased</option>
                                <option value="TRANSFERRED">Transferred</option>
                            </select>
                        </div>
                        <div className="flex items-end gap-2">
                            <button onClick={handleFilter} className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-sm">Apply</button>
                            <button
                                onClick={() => { setFilterParish(""); setFilterStatus(""); loadInitialData(); }}
                                className="flex-1 py-2.5 bg-gray-100 text-gray-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95 shadow-sm"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>

                {/* Members Content */}
                {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {loading ? (
                            Array(8).fill(0).map((_, i) => (
                                <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 h-64 animate-pulse"></div>
                            ))
                        ) : (
                            members.map((m) => (
                                <div key={m.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all group relative">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="h-12 w-12 rounded-full bg-epr-green-100 flex items-center justify-center text-epr-green-700 font-bold text-lg">
                                            {m.firstName[0]}{m.lastName[0]}
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${getStatusColor(m.status)}`}>
                                            {m.status}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-gray-900 text-lg mb-1">{m.firstName} {m.lastName}</h3>
                                    <p className="text-xs font-mono text-gray-500 mb-4">#{m.membershipNumber}</p>

                                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-gray-400" />
                                            <span className="truncate">{m.parish?.name}</span>
                                        </div>
                                        {m.community && (
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-gray-400" />
                                                <span className="truncate">{m.community.name}</span>
                                            </div>
                                        )}
                                        {m.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-gray-400" />
                                                <span>{m.phone}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                                        <div className="flex gap-1">
                                            <Award className={`h-4 w-4 ${m.isBaptized ? 'text-blue-500' : 'text-gray-200'}`} title="Baptized" />
                                            <UserCheck className={`h-4 w-4 ${m.isConfirmed ? 'text-epr-green-600' : 'text-gray-200'}`} title="Confirmed" />
                                            <Heart className={`h-4 w-4 ${m.isMarried ? 'text-red-500' : 'text-gray-200'}`} title="Married" />
                                        </div>
                                        <div className="flex-1"></div>
                                        <button onClick={() => handleEdit(m)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => setConfirmDelete({ id: m.id, isOpen: true })} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                        {!loading && members.length === 0 && (
                            <div className="col-span-full py-20 text-center flex flex-col items-center">
                                <Users className="h-16 w-16 text-gray-200 mb-4" />
                                <p className="text-gray-500 font-medium">No members found in the registry.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Member Info</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Affiliation</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Sacraments</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Contact</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        Array(5).fill(0).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan={6} className="px-6 py-4 h-20 bg-gray-50/50"></td>
                                            </tr>
                                        ))
                                    ) : members.map((m) => (
                                        <tr key={m.id} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-epr-green-100 flex items-center justify-center text-epr-green-700 font-bold shrink-0">
                                                        {m.firstName[0]}{m.lastName[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 group-hover:text-epr-green-700 transition-colors">{m.firstName} {m.lastName}</p>
                                                        <p className="text-xs font-mono text-gray-500">#{m.membershipNumber}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-semibold text-gray-700">{m.parish?.name}</div>
                                                <div className="text-xs text-gray-500">{m.community?.name || "No Community"}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-1.5">
                                                    <Award className={`h-4 w-4 ${m.isBaptized ? 'text-blue-500' : 'text-gray-200'}`} />
                                                    <UserCheck className={`h-4 w-4 ${m.isConfirmed ? 'text-epr-green-600' : 'text-gray-200'}`} />
                                                    <Heart className={`h-4 w-4 ${m.isMarried ? 'text-red-500' : 'text-gray-200'}`} />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                        <Phone className="h-3 w-3 text-gray-400" />
                                                        {m.phone || "N/A"}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                        <Mail className="h-3 w-3 text-gray-400" />
                                                        {m.email || "N/A"}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${getStatusColor(m.status)}`}>
                                                    {m.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEdit(m)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => setConfirmDelete({ id: m.id, isOpen: true })} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {!loading && members.length === 0 && (
                            <div className="py-20 text-center flex flex-col items-center">
                                <Users className="h-16 w-16 text-gray-200 mb-4" />
                                <p className="text-gray-500 font-medium">No members found in the registry.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Member Registry Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-6 flex justify-between items-center bg-white/90 backdrop-blur-md z-10">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{editingMember ? "Update Record" : "New Registration"}</h2>
                                <p className="text-sm text-gray-500">Official church membership documentation</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)] p-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Personal Information */}
                                <div className="md:col-span-3 space-y-4">
                                    <h3 className="text-xs font-bold text-epr-green-600 uppercase tracking-widest border-b border-epr-green-100 pb-2 flex items-center gap-2">
                                        <UserCheck className="h-4 w-4" />
                                        Personal Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-sm font-semibold text-gray-600">First Name *</label>
                                            <input type="text" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-epr-green-500 transition-all bg-gray-50/50" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-semibold text-gray-600">Last Name *</label>
                                            <input type="text" required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-epr-green-500 transition-all bg-gray-50/50" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-semibold text-gray-600">Gender *</label>
                                            <select required value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-epr-green-500 transition-all bg-gray-50/50">
                                                <option value="MALE">Male</option>
                                                <option value="FEMALE">Female</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-semibold text-gray-600">Birth Date *</label>
                                            <input type="date" required value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-epr-green-500 transition-all bg-gray-50/50" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-semibold text-gray-600">Occupation</label>
                                            <input type="text" value={formData.occupations} onChange={(e) => setFormData({ ...formData, occupations: e.target.value })} placeholder="e.g. Teacher, Merchant" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-epr-green-500 transition-all bg-gray-50/50" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-semibold text-gray-600">Status *</label>
                                            <select required value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-epr-green-500 transition-all bg-gray-50/50">
                                                <option value="ACTIVE">Active</option>
                                                <option value="INACTIVE">Inactive</option>
                                                <option value="DECEASED">Deceased</option>
                                                <option value="TRANSFERRED">Transferred</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact & Location */}
                                <div className="md:col-span-3 space-y-4 pt-4">
                                    <h3 className="text-xs font-bold text-epr-green-600 uppercase tracking-widest border-b border-epr-green-100 pb-2 flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        Contact & Affiliation
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-sm font-semibold text-gray-600">Phone</label>
                                            <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-epr-green-500 transition-all bg-gray-50/50" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-semibold text-gray-600">Email</label>
                                            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-epr-green-500 transition-all bg-gray-50/50" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-semibold text-gray-600">Parish *</label>
                                            <select required value={formData.parishId} onChange={(e) => { setFormData({ ...formData, parishId: e.target.value, communityId: "" }); loadCommunities(e.target.value); }} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-epr-green-500 transition-all bg-gray-50/50">
                                                <option value="">Select Parish</option>
                                                {parishes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-semibold text-gray-600">Community</label>
                                            <select value={formData.communityId} onChange={(e) => setFormData({ ...formData, communityId: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-epr-green-500 transition-all bg-gray-50/50" disabled={!formData.parishId}>
                                                <option value="">Select Community</option>
                                                {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="md:col-span-4 space-y-1">
                                            <label className="text-sm font-semibold text-gray-600">Home Address</label>
                                            <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="District, Sector, Cell, Village" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-epr-green-500 transition-all bg-gray-50/50" />
                                        </div>
                                    </div>
                                </div>

                                {/* Sacraments */}
                                <div className="md:col-span-3 space-y-4 pt-4">
                                    <h3 className="text-xs font-bold text-epr-green-600 uppercase tracking-widest border-b border-epr-green-100 pb-2 flex items-center gap-2">
                                        <Award className="h-4 w-4" />
                                        Sacramental Records
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 bg-epr-green-50/30 rounded-xl border border-epr-green-100">
                                        <div className="space-y-4">
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${formData.isBaptized ? 'bg-epr-green-600 text-white' : 'bg-white border-2 border-gray-200 text-gray-300'}`}>
                                                    <Award className="h-6 w-6" />
                                                </div>
                                                <input type="checkbox" className="hidden" checked={formData.isBaptized} onChange={(e) => setFormData({ ...formData, isBaptized: e.target.checked })} />
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">Baptized</p>
                                                    <p className="text-[10px] text-gray-500 tracking-wider uppercase">Holy Baptism</p>
                                                </div>
                                            </label>
                                            {formData.isBaptized && (
                                                <div className="animate-in slide-in-from-top-2 duration-200">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Baptism Date</label>
                                                    <input type="date" value={formData.baptismDate} onChange={(e) => setFormData({ ...formData, baptismDate: e.target.value })} className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-epr-green-500 outline-none" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4 border-l border-epr-green-100/30 md:pl-8">
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${formData.isConfirmed ? 'bg-epr-green-600 text-white' : 'bg-white border-2 border-gray-200 text-gray-300'}`}>
                                                    <Award className="h-6 w-6" />
                                                </div>
                                                <input type="checkbox" className="hidden" checked={formData.isConfirmed} onChange={(e) => setFormData({ ...formData, isConfirmed: e.target.checked })} />
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">Confirmed</p>
                                                    <p className="text-[10px] text-gray-500 tracking-wider uppercase">Holy Confirmation</p>
                                                </div>
                                            </label>
                                            {formData.isConfirmed && (
                                                <div className="animate-in slide-in-from-top-2 duration-200">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Confirmation Date</label>
                                                    <input type="date" value={formData.confirmationDate} onChange={(e) => setFormData({ ...formData, confirmationDate: e.target.value })} className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-epr-green-500 outline-none" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4 border-l border-epr-green-100/30 md:pl-8">
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${formData.isMarried ? 'bg-epr-green-600 text-white' : 'bg-white border-2 border-gray-200 text-gray-300'}`}>
                                                    <Award className="h-6 w-6" />
                                                </div>
                                                <input type="checkbox" className="hidden" checked={formData.isMarried} onChange={(e) => setFormData({ ...formData, isMarried: e.target.checked })} />
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">Married</p>
                                                    <p className="text-[10px] text-gray-500 tracking-wider uppercase">Holy Matrimony</p>
                                                </div>
                                            </label>
                                            {formData.isMarried && (
                                                <div className="animate-in slide-in-from-top-2 duration-200">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Marriage Date</label>
                                                    <input type="date" value={formData.marriageDate} onChange={(e) => setFormData({ ...formData, marriageDate: e.target.value })} className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-epr-green-500 outline-none" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Form Footer */}
                            <div className="flex gap-4 pt-10 pb-4 border-t border-gray-100 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn-outline flex-1 py-4 text-xs tracking-widest"
                                >
                                    DISCARD
                                </button>
                                <button
                                    type="submit"
                                    className="btn-epr flex-[2] py-4 text-xs tracking-widest"
                                >
                                    {editingMember ? "SAVE CHANGES" : "CONFIRM REGISTRATION"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmDelete.isOpen}
                title="Remove Member Record"
                message="Are you sure you want to remove this member from the active registry? This action will archive their status but historical records will be preserved."
                type="danger"
                onConfirm={() => handleDelete(confirmDelete.id)}
                onCancel={() => setConfirmDelete({ id: "", isOpen: false })}
                confirmText="Remove Record"
                isLoading={isActionLoading}
            />
        </AppShell>
    );
}
