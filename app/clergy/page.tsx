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
    User as UserIcon,
    Search,
    Filter,
    Plus,
    Edit,
    Trash2,
    X,
    Award,
    MapPin,
    Calendar,
    Mail,
    Phone,
    History,
    ArrowRightLeft,
    CheckCircle2,
    MoreVertical,
    Briefcase,
    Upload,
    Download
} from "lucide-react";

interface PreviousAssignment {
    position: string;
    location: string;
    startDate: string;
    endDate: string;
}

interface Clergy {
    id: string;
    clergyNumber: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    rank: string;
    status: string;
    phone: string;
    email: string;
    parishId?: string;
    presbyteryId?: string;
    currentAssignment?: string;
    ordinationDate: string;
    previousAssignments?: PreviousAssignment[];
    parish?: { name: string };
    presbytery?: { name: string };
}

export default function ClergyPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [clergyList, setClergyList] = useState<Clergy[]>([]);
    const [parishes, setParishes] = useState<any[]>([]);
    const [presbyteries, setPresbyteries] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [filterRank, setFilterRank] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [editingClergy, setEditingClergy] = useState<Clergy | null>(null);
    const [showHistory, setShowHistory] = useState<Clergy | null>(null);
    const { addToast } = useToast();
    const [confirmDelete, setConfirmDelete] = useState<{ id: string; isOpen: boolean }>({ id: "", isOpen: false });
    const [isActionLoading, setIsActionLoading] = useState(false);

    const [formData, setFormData] = useState({
        clergyNumber: "",
        firstName: "",
        lastName: "",
        middleName: "",
        rank: "PASTOR",
        status: "ACTIVE",
        phone: "",
        email: "",
        parishId: "",
        presbyteryId: "",
        ordinationDate: "",
        currentAssignment: "",
        dateOfBirth: "",
    });

    const [transferData, setTransferData] = useState({
        newParishId: "",
        newPresbyteryId: "",
        newAssignment: "",
        transferDate: new Date().toISOString().split('T')[0],
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
            const [clergyRes, parishesRes, presRes, statsRes] = await Promise.all([
                api.get("/clergy"),
                api.get("/parishes"),
                api.get("/presbyteries"),
                api.get("/clergy/statistics"),
            ]);
            setClergyList(clergyRes.data);
            setParishes(parishesRes.data);
            setPresbyteries(presRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error("Load failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setShowModal(false);
            resetForm();
            loadInitialData();
            addToast(`Clergy ${editingClergy ? 'updated' : 'registered'} successfully!`, "success");
        } catch (error: any) {
            addToast(error.response?.data?.message || "Operation failed", "error");
        }
    };

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingClergy) return;
        try {
            setIsActionLoading(true);
            await api.patch(`/clergy/${editingClergy.id}/transfer`, transferData);
            setShowTransferModal(false);
            loadInitialData();
            addToast("Ecclesiastical transfer completed successfully!", "success");
        } catch (error: any) {
            addToast(error.response?.data?.message || "Transfer failed", "error");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/data/template/clergy`;
        } catch (error) {
            console.error("Export failed:", error);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setLoading(true);
            const res = await api.post('/data/import/clergy', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            addToast(`Import Successful! ${res.data.success} records added.`, "success");
            loadInitialData();
        } catch (error: any) {
            addToast(error.response?.data?.message || "Import failed", "error");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            clergyNumber: "",
            firstName: "",
            lastName: "",
            middleName: "",
            rank: "PASTOR",
            status: "ACTIVE",
            phone: "",
            email: "",
            parishId: "",
            presbyteryId: "",
            ordinationDate: "",
            currentAssignment: "",
            dateOfBirth: "",
        });
        setEditingClergy(null);
    };

    const handleEdit = (c: Clergy) => {
        setEditingClergy(c);
        setFormData({
            ...c as any,
            ordinationDate: c.ordinationDate?.substring(0, 10) || "",
            dateOfBirth: (c as any).dateOfBirth?.substring(0, 10) || "",
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        try {
            setIsActionLoading(true);
            await api.delete(`/clergy/${id}`);
            setConfirmDelete({ id: "", isOpen: false });
            loadInitialData();
            addToast("Clergy member deactivated successfully.", "info");
        } catch (error) {
            addToast("Failed to deactivate clergy member.", "error");
        } finally {
            setIsActionLoading(false);
        }
    };

    const getRankBadge = (rank: string) => {
        const styles: any = {
            BISHOP: "bg-purple-100 text-purple-700 border-purple-200",
            REVEREND: "bg-blue-100 text-blue-700 border-blue-200",
            PASTOR: "bg-epr-green-100 text-epr-green-700 border-epr-green-200",
            DEACON: "bg-gray-100 text-gray-700 border-gray-200",
        };
        return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${styles[rank] || styles.PASTOR}`}>{rank}</span>;
    };

    if (!user) return null;

    return (
        <AppShell
            title="Clergy Registry"
            subtitle="Ecclesiastical leadership and ministerial assignments management"
            userName={`${user.firstName} ${user.lastName}`}
            userRole={user.role}
            onLogout={() => { authService.logout(); router.push("/login"); }}
        >
            <div className="space-y-6">
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {stats?.byRank.map((r: any) => (
                        <div key={r.rank} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{r.rank}</p>
                            <p className="text-2xl font-black text-gray-900">{r.count}</p>
                        </div>
                    ))}
                    <div className="bg-epr-green-600 p-4 rounded-xl shadow-lg shadow-epr-green-100 flex flex-col justify-center">
                        <p className="text-[10px] font-bold text-epr-green-100 uppercase tracking-widest text-center">Total Ordained</p>
                        <p className="text-2xl font-black text-white text-center">{stats?.total || 0}</p>
                    </div>
                </div>

                {/* Global Filter Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex-1 relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, number or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-premium pl-10"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        <select
                            value={filterRank}
                            onChange={(e) => setFilterRank(e.target.value)}
                            className="flex-1 md:w-40 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-epr-green-500"
                        >
                            <option value="">All Ranks</option>
                            <option value="BISHOP">Bishop</option>
                            <option value="REVEREND">Reverend</option>
                            <option value="PASTOR">Pastor</option>
                            <option value="DEACON">Deacon</option>
                        </select>
                        <div className="flex gap-2">
                            <button
                                onClick={handleExport}
                                className="p-3 text-gray-400 hover:text-epr-green-600 hover:bg-epr-green-50 bg-white border border-gray-200 rounded-xl transition-all shadow-sm"
                                title="Download Excel Template"
                            >
                                <Download className="h-5 w-5" />
                            </button>
                            <label className="p-3 text-gray-400 hover:text-purple-600 hover:bg-purple-50 bg-white border border-gray-200 rounded-xl transition-all cursor-pointer shadow-sm" title="Bulk Import Excel">
                                <Upload className="h-5 w-5" />
                                <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleImport} />
                            </label>
                        </div>
                        <button
                            onClick={() => { resetForm(); setShowModal(true); }}
                            className="btn-epr"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Join Ministry
                        </button>
                    </div>
                </div>

                {/* Clergy Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {loading ? (
                        Array(6).fill(0).map((_, i) => <div key={i} className="h-64 bg-white border border-gray-100 rounded-xl animate-pulse"></div>)
                    ) : clergyList.filter(c =>
                        `${c.firstName} ${c.lastName} ${c.clergyNumber}`.toLowerCase().includes(searchQuery.toLowerCase()) &&
                        (filterRank === "" || c.rank === filterRank)
                    ).map((clergy) => (
                        <div key={clergy.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="h-16 w-16 bg-gradient-to-br from-epr-green-50 to-epr-green-100 rounded-2xl flex items-center justify-center text-epr-green-700 font-black text-2xl border border-epr-green-200">
                                        {clergy.firstName[0]}{clergy.lastName[0]}
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setEditingClergy(clergy); setShowTransferModal(true); }} title="Transfer" className="p-2 text-gray-400 hover:text-epr-green-600 hover:bg-epr-green-50 rounded-lg">
                                            <ArrowRightLeft className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => setShowHistory(clergy)} title="History" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                            <History className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleEdit(clergy)} title="Edit" className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg">
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleDelete(clergy.id)} title="Deactivate" className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" onClickCapture={(e) => { e.stopPropagation(); setConfirmDelete({ id: clergy.id, isOpen: true }); }}>
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1 mb-4">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-black text-gray-900 leading-tight">{clergy.firstName} {clergy.lastName}</h3>
                                        {getRankBadge(clergy.rank)}
                                    </div>
                                    <p className="text-xs font-mono text-gray-400 tracking-tighter">REF: {clergy.clergyNumber}</p>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-gray-50">
                                    <div className="flex items-center gap-3 text-xs text-gray-600">
                                        <div className="p-1.5 bg-gray-50 rounded-lg"><MapPin className="h-3.5 w-3.5 text-gray-400" /></div>
                                        <span className="font-semibold">{clergy.parish?.name || clergy.presbytery?.name || "Church Administration"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-600">
                                        <div className="p-1.5 bg-gray-50 rounded-lg"><Briefcase className="h-3.5 w-3.5 text-gray-400" /></div>
                                        <span>{clergy.currentAssignment || "Minister without Portfolio"}</span>
                                    </div>
                                    <div className="flex items-center gap-6 pt-2">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                                            <Phone className="h-3 w-3" />
                                            {clergy.phone}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                                            <Mail className="h-3 w-3" />
                                            {clergy.email}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-6 py-3 flex justify-between items-center mt-auto border-t border-gray-100">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3 w-3 text-gray-400" />
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ordination: {new Date(clergy.ordinationDate).getFullYear()}</span>
                                </div>
                                <span className="text-[10px] font-bold text-epr-green-600 flex items-center gap-1 bg-epr-green-50 px-2 py-0.5 rounded-full">
                                    <CheckCircle2 className="h-3 w-3" />
                                    {clergy.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Entry Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 italic">MINISTERIAL ENTRY</h2>
                                <p className="text-xs font-bold text-epr-green-600 uppercase tracking-[0.3em] mt-1">Official Registry Form</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 text-gray-300 hover:text-gray-900 hover:bg-white rounded-full transition-all">
                                <X className="h-8 w-8" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto max-h-[calc(90vh-140px)] space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Clergy ID Number *</label>
                                    <input
                                        type="text" required placeholder="e.g. EPR/CL/2026/001"
                                        value={formData.clergyNumber}
                                        onChange={(e) => setFormData({ ...formData, clergyNumber: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-epr-green-500/10 focus:bg-white focus:border-epr-green-500 outline-none transition-all font-mono"
                                    />
                                </div>
                                <div className="space-y-1.5 flex gap-4">
                                    <div className="flex-1 space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Rank *</label>
                                        <select value={formData.rank} onChange={(e) => setFormData({ ...formData, rank: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none font-bold">
                                            <option value="BISHOP">BISHOP</option>
                                            <option value="REVEREND">REVEREND</option>
                                            <option value="PASTOR">PASTOR</option>
                                            <option value="DEACON">DEACON</option>
                                            <option value="EVANGELIST">EVANGELIST</option>
                                        </select>
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Status</label>
                                        <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none font-bold">
                                            <option value="ACTIVE">ACTIVE</option>
                                            <option value="ON_LEAVE">ON LEAVE</option>
                                            <option value="RETIRED">RETIRED</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">First Name *</label>
                                        <input type="text" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Middle Name</label>
                                        <input type="text" value={formData.middleName} onChange={(e) => setFormData({ ...formData, middleName: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Last Name *</label>
                                        <input type="text" required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Phone *</label>
                                    <input type="text" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email *</label>
                                    <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl" />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Presbytery Assignment</label>
                                    <select value={formData.presbyteryId} onChange={(e) => setFormData({ ...formData, presbyteryId: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none">
                                        <option value="">Select Presbytery</option>
                                        {presbyteries.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Parish Assignment</label>
                                    <select value={formData.parishId} onChange={(e) => setFormData({ ...formData, parishId: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none">
                                        <option value="">Select Parish</option>
                                        {parishes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Ordination Date *</label>
                                    <input type="date" required value={formData.ordinationDate} onChange={(e) => setFormData({ ...formData, ordinationDate: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Birth Date *</label>
                                    <input type="date" required value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl" />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6 mt-6 border-t border-gray-100">
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
                                    CONFIRM ENTRY
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Transfer Modal */}
            {showTransferModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300">
                        <div className="p-10 bg-epr-green-600 text-white relative overflow-hidden">
                            <h2 className="text-3xl font-black italic tracking-tighter">ECCLESIASTICAL TRANSFER</h2>
                            <p className="text-epr-green-100 text-[10px] font-bold uppercase tracking-[0.5em] mt-1">Movement of Ministry Personnel</p>
                            <ArrowRightLeft className="absolute -bottom-10 -right-10 h-48 w-48 text-white/5" />
                        </div>
                        <form onSubmit={handleTransfer} className="p-10 space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Clergy Member</label>
                                <div className="px-4 py-4 bg-gray-50 rounded-2xl font-black text-gray-900 border border-gray-100">
                                    {editingClergy?.firstName} {editingClergy?.lastName}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">New Assignment Location *</label>
                                <select required value={transferData.newParishId} onChange={(e) => setTransferData({ ...transferData, newParishId: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold">
                                    <option value="">Select New Location</option>
                                    {parishes.map(p => <option key={p.id} value={p.id}>{p.name} (Parish)</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Effective Date *</label>
                                <input type="date" required value={transferData.transferDate} onChange={(e) => setTransferData({ ...transferData, transferDate: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl" />
                            </div>
                            <div className="flex gap-4 pt-6 mt-6 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowTransferModal(false)}
                                    className="btn-outline flex-1 py-4 text-xs tracking-widest"
                                >
                                    CANCEL
                                </button>
                                <button
                                    type="submit"
                                    className="btn-epr flex-[2] py-4 text-xs tracking-widest"
                                >
                                    AUTHORIZE TRANSFER
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistory && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Ministerial History</h2>
                            <button onClick={() => setShowHistory(null)} className="p-2 hover:bg-white rounded-full"><X className="h-6 w-6 text-gray-400" /></button>
                        </div>
                        <div className="p-8 space-y-6 overflow-y-auto max-h-[60vh]">
                            {showHistory.previousAssignments?.length === 0 ? (
                                <div className="py-12 text-center text-gray-400">No previous assignments recorded.</div>
                            ) : showHistory.previousAssignments?.map((entry, i) => (
                                <div key={i} className="flex gap-4 relative">
                                    {i !== (showHistory.previousAssignments?.length || 0) - 1 && <div className="absolute left-6 top-8 bottom-0 w-px bg-gray-100" />}
                                    <div className="h-12 w-12 rounded-full bg-epr-green-50 border border-epr-green-100 flex items-center justify-center text-epr-green-600 relative z-10">
                                        <History className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <h4 className="font-black text-gray-900">{entry.location}</h4>
                                        <p className="text-xs font-bold text-epr-green-600 uppercase tracking-widest">{entry.position}</p>
                                        <div className="flex gap-4 mt-2">
                                            <div className="text-[10px] font-bold text-gray-400 uppercase">From: {new Date(entry.startDate).toLocaleDateString()}</div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase">To: {new Date(entry.endDate).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmDelete.isOpen}
                title="Deactivate Ministry Personnel"
                message="Are you sure you want to deactivate this clergy member? This will remove them from active parish assignments but preserve their historical records."
                type="danger"
                onConfirm={() => handleDelete(confirmDelete.id)}
                onCancel={() => setConfirmDelete({ id: "", isOpen: false })}
                confirmText="Deactivate"
                isLoading={isActionLoading}
            />
        </AppShell>
    );
}
