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
    Award,
    Search,
    Filter,
    Plus,
    Edit,
    Trash2,
    X,
    Calendar,
    User as UserIcon,
    Church,
    FileText,
    Download,
    Users,
    Heart,
    UserCheck,
    CheckCircle2,
    Printer,
    ChevronRight
} from "lucide-react";

interface Sacrament {
    id: string;
    type: "BAPTISM" | "CONFIRMATION" | "MARRIAGE" | "HOLY_COMMUNION";
    date: string;
    memberId: string;
    parishId: string;
    officiantName?: string;
    certificateNumber: string;
    fatherName?: string;
    motherName?: string;
    godparents?: string[];
    sponsorName?: string;
    confirmationName?: string;
    spouseName?: string;
    witnesses?: string[];
    notes?: string;
    member?: { firstName: string; lastName: string };
    parish?: { name: string };
}

export default function SacramentsPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [sacraments, setSacraments] = useState<Sacrament[]>([]);
    const [parishes, setParishes] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);

    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("");
    const [filterParish, setFilterParish] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [editingSacrament, setEditingSacrament] = useState<Sacrament | null>(null);
    const [selectedForPrint, setSelectedForPrint] = useState<Sacrament | null>(null);
    const { addToast } = useToast();
    const [confirmDelete, setConfirmDelete] = useState<{ id: string; isOpen: boolean }>({ id: "", isOpen: false });
    const [isActionLoading, setIsActionLoading] = useState(false);

    const [formData, setFormData] = useState<any>({
        type: "BAPTISM",
        date: "",
        memberId: "",
        parishId: "",
        officiantName: "",
        certificateNumber: "",
        fatherName: "",
        motherName: "",
        godparents: "",
        sponsorName: "",
        confirmationName: "",
        spouseName: "",
        witnesses: "",
        notes: "",
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
            const [sacRes, parRes, memRes] = await Promise.all([
                api.get("/sacraments"),
                api.get("/parishes"),
                api.get("/members"),
            ]);
            setSacraments(sacRes.data);
            setParishes(parRes.data);
            setMembers(memRes.data);
        } catch (error) {
            console.error("Load failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterType) params.append("type", filterType);
            if (filterParish) params.append("parishId", filterParish);
            const res = await api.get(`/sacraments?${params.toString()}`);
            setSacraments(res.data);
        } catch (error) {
            console.error("Filter failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                godparents: typeof formData.godparents === "string" ? formData.godparents.split(",").map((s: string) => s.trim()) : formData.godparents,
                witnesses: typeof formData.witnesses === "string" ? formData.witnesses.split(",").map((s: string) => s.trim()) : formData.witnesses,
            };

            if (editingSacrament) {
                await api.patch(`/sacraments/${editingSacrament.id}`, payload);
            } else {
                await api.post("/sacraments", payload);
            }
            setShowModal(false);
            resetForm();
            loadInitialData();
            addToast(`Sacrament record ${editingSacrament ? 'updated' : 'archived'} successfully`, "success");
        } catch (error: any) {
            addToast(error.response?.data?.message || "Operation failed", "error");
        }
    };

    const resetForm = () => {
        setFormData({
            type: "BAPTISM",
            date: "",
            memberId: "",
            parishId: "",
            officiantName: "",
            certificateNumber: "",
            fatherName: "",
            motherName: "",
            godparents: "",
            sponsorName: "",
            confirmationName: "",
            spouseName: "",
            witnesses: "",
            notes: "",
        });
        setEditingSacrament(null);
    };

    const handleEdit = (s: Sacrament) => {
        setEditingSacrament(s);
        setFormData({
            ...s,
            date: s.date.substring(0, 10),
            godparents: s.godparents?.join(", ") || "",
            witnesses: s.witnesses?.join(", ") || "",
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        try {
            setIsActionLoading(true);
            await api.delete(`/sacraments/${id}`);
            setConfirmDelete({ id: "", isOpen: false });
            loadInitialData();
            addToast("Record permanently removed from archives", "success");
        } catch (error) {
            addToast("Failed to delete record", "error");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handlePrint = async (s: Sacrament) => {
        setSelectedForPrint(s);
        setShowPrintModal(true);
    };

    const getSacramentIcon = (type: string) => {
        switch (type) {
            case "BAPTISM": return <Award className="h-6 w-6 text-blue-600" />;
            case "CONFIRMATION": return <UserCheck className="h-6 w-6 text-epr-green-600" />;
            case "MARRIAGE": return <Heart className="h-6 w-6 text-red-600" />;
            case "HOLY_COMMUNION": return <FileText className="h-6 w-6 text-purple-600" />;
            default: return <Award className="h-6 w-6 text-gray-600" />;
        }
    };

    if (!user) return null;

    return (
        <AppShell
            title="Sacramental Records"
            subtitle="Official registry of holy sacraments performed within the EPR"
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
                                placeholder="Search by certificate number..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input-premium pl-10"
                            />
                        </div>
                        <button className="px-6 py-2 bg-gray-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-sm">Search</button>
                    </div>

                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="btn-epr"
                    >
                        <Plus className="h-5 w-5" />
                        New Record
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-end">
                    <div className="space-y-1.5 flex-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Sacrament Type</label>
                        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                            <option value="">All Types</option>
                            <option value="BAPTISM">Baptism</option>
                            <option value="CONFIRMATION">Confirmation</option>
                            <option value="MARRIAGE">Marriage</option>
                            <option value="HOLY_COMMUNION">Holy Communion</option>
                        </select>
                    </div>
                    <div className="space-y-1.5 flex-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Parish</label>
                        <select value={filterParish} onChange={(e) => setFilterParish(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                            <option value="">All Parishes</option>
                            {parishes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleFilter} className="px-8 py-2.5 bg-gray-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all active:scale-95">Apply</button>
                        <button onClick={() => { setFilterType(""); setFilterParish(""); loadInitialData(); }} className="px-8 py-2.5 bg-gray-100 text-gray-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95">Reset</button>
                    </div>
                </div>

                {/* List Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {loading ? (
                        Array(6).fill(0).map((_, i) => (
                            <div key={i} className="h-48 bg-white border border-gray-100 rounded-xl animate-pulse"></div>
                        ))
                    ) : sacraments.map((s) => (
                        <div key={s.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-gray-50 rounded-xl">
                                        {getSacramentIcon(s.type)}
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handlePrint(s)} className="p-2 text-gray-400 hover:text-epr-green-600 hover:bg-epr-green-50 rounded-lg">
                                            <Printer className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleEdit(s)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => setConfirmDelete({ id: s.id, isOpen: true })} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1 mb-4">
                                    <h3 className="text-xs font-bold text-epr-green-600 uppercase tracking-widest">{s.type.replace("_", " ")}</h3>
                                    <p className="text-lg font-bold text-gray-900">{s.member?.firstName} {s.member?.lastName}</p>
                                    <p className="text-xs font-mono text-gray-500">{s.certificateNumber}</p>
                                </div>

                                <div className="space-y-2 pt-4 border-t border-gray-50">
                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                        {new Date(s.date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                        <Church className="h-3.5 w-3.5 text-gray-400" />
                                        {s.parish?.name}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                        <UserIcon className="h-3.5 w-3.5 text-gray-400" />
                                        Officiated by: {s.officiantName || "N/A"}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => handleEdit(s)} className="w-full py-3 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] hover:bg-epr-green-600 hover:text-white transition-all flex items-center justify-center gap-2">
                                View Full Document
                                <ChevronRight className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sacrament Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="sticky top-0 bg-white/90 backdrop-blur-sm px-10 py-8 border-b border-gray-100 flex justify-between items-center z-10">
                            <div>
                                <h2 className="text-3xl font-black text-gray-900 italic tracking-tight">Sacred Record</h2>
                                <p className="text-sm font-medium text-gray-400 uppercase tracking-[0.3em] mt-1">Ecclesiastical Documentation</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-3 text-gray-300 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all">
                                <X className="h-8 w-8" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-160px)] p-10 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Core Record Info */}
                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Sacrament Type *</label>
                                        <select required value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-epr-green-500/10 focus:border-epr-green-500 outline-none transition-all font-bold text-gray-700">
                                            <option value="BAPTISM">BAPTISM</option>
                                            <option value="CONFIRMATION">CONFIRMATION</option>
                                            <option value="MARRIAGE">MARRIAGE</option>
                                            <option value="HOLY_COMMUNION">HOLY COMMUNION</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Event Date *</label>
                                        <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-epr-green-500/10 focus:border-epr-green-500 outline-none transition-all font-bold text-gray-700" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Certificate #</label>
                                        <input type="text" placeholder="Auto-generated" value={formData.certificateNumber} readOnly className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-400 cursor-not-allowed font-mono text-sm" />
                                    </div>
                                </div>

                                {/* Participants */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Recipient Member *</label>
                                    <select required value={formData.memberId} onChange={(e) => setFormData({ ...formData, memberId: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-epr-green-500/10 focus:bg-white focus:border-epr-green-500 outline-none transition-all">
                                        <option value="">Select Member</option>
                                        {members.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName} (#{m.membershipNumber})</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Performing Parish *</label>
                                    <select required value={formData.parishId} onChange={(e) => setFormData({ ...formData, parishId: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-epr-green-500/10 focus:bg-white focus:border-epr-green-500 outline-none transition-all">
                                        <option value="">Select Parish</option>
                                        {parishes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Officiating Clergy</label>
                                    <input type="text" placeholder="Rev. Father Name" value={formData.officiantName} onChange={(e) => setFormData({ ...formData, officiantName: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-epr-green-500/10 focus:bg-white focus:border-epr-green-500 outline-none transition-all" />
                                </div>

                                {/* Sub-form for specific types */}
                                <div className="md:col-span-2 p-8 bg-epr-green-50/20 rounded-2xl border border-epr-green-100/50 space-y-6">
                                    <h4 className="font-bold text-epr-green-700 flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Type-Specific Details
                                    </h4>

                                    {formData.type === "BAPTISM" && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Father's Name</label>
                                                <input type="text" value={formData.fatherName} onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl outline-none" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Mother's Name</label>
                                                <input type="text" value={formData.motherName} onChange={(e) => setFormData({ ...formData, motherName: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl outline-none" />
                                            </div>
                                            <div className="md:col-span-2 space-y-1.5">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Godparents (comma separated)</label>
                                                <input type="text" value={formData.godparents} onChange={(e) => setFormData({ ...formData, godparents: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl outline-none" />
                                            </div>
                                        </div>
                                    )}

                                    {formData.type === "CONFIRMATION" && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Sponsor's Name</label>
                                                <input type="text" value={formData.sponsorName} onChange={(e) => setFormData({ ...formData, sponsorName: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl outline-none" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Confirmation (Saint) Name</label>
                                                <input type="text" value={formData.confirmationName} onChange={(e) => setFormData({ ...formData, confirmationName: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl outline-none" />
                                            </div>
                                        </div>
                                    )}

                                    {formData.type === "MARRIAGE" && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Spouse's Name</label>
                                                <input type="text" value={formData.spouseName} onChange={(e) => setFormData({ ...formData, spouseName: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl outline-none" />
                                            </div>
                                            <div className="md:col-span-2 space-y-1.5">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Witnesses (comma separated)</label>
                                                <input type="text" value={formData.witnesses} onChange={(e) => setFormData({ ...formData, witnesses: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl outline-none" />
                                            </div>
                                        </div>
                                    )}
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
                                    RECORD IN ARCHIVES
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Certificate Print Modal */}
            {showPrintModal && selectedForPrint && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
                    <div className="bg-white rounded-none w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl relative">
                        {/* Print UI Specific Header (Not in the actual certificate) */}
                        <div className="sticky top-0 bg-gray-900 text-white p-4 flex justify-between items-center print:hidden">
                            <span className="text-xs font-bold uppercase tracking-widest">Certificate Preview</span>
                            <div className="flex gap-4">
                                <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-1 bg-epr-green-600 text-white rounded text-xs font-bold">
                                    <Printer className="h-4 w-4" /> PRINT PDF
                                </button>
                                <button onClick={() => setShowPrintModal(false)} className="p-1 hover:bg-gray-800 rounded">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        {/* ACTUAL COLLECTIBLE CERTIFICATE - EPR STYLING */}
                        <div className="p-16 border-[20px] border-double border-epr-green-600/20 m-8 min-h-[800px] flex flex-col items-center text-center font-serif relative">
                            {/* Watermark/Background Decoration */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                                <Award className="h-[500px] w-[500px] text-epr-green-950" />
                            </div>

                            <div className="relative z-10 w-full flex flex-col items-center">
                                <div className="w-24 h-24 bg-epr-green-700 rounded-full mb-6 flex items-center justify-center text-white shadow-xl shadow-epr-green-100">
                                    <Award className="h-12 w-12" />
                                </div>
                                <h1 className="text-2xl font-black text-epr-green-900 mb-1 tracking-widest">EGLISE PRESBYTERIENNE AU RWANDA (EPR)</h1>
                                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-[0.4em] mb-12">Synod Council of Administration</h2>

                                <div className="h-px w-64 bg-epr-green-600/30 mb-12"></div>

                                <h3 className="text-5xl font-black text-gray-900 mb-4 italic">Certificate of {selectedForPrint.type.replace("_", " ")}</h3>
                                <p className="text-lg text-gray-600 italic mb-12">This is to certify that</p>

                                <p className="text-4xl font-black text-gray-900 border-b-2 border-dotted border-gray-900 px-12 py-2 mb-12 min-w-[400px]">
                                    {selectedForPrint.member?.firstName} {selectedForPrint.member?.lastName}
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12 w-full text-left p-12 bg-gray-50/50 rounded-3xl border border-gray-100 mb-12">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-epr-green-700 uppercase tracking-widest">Ceremony Conducted On</span>
                                        <p className="text-xl font-bold text-gray-900">{new Date(selectedForPrint.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-epr-green-700 uppercase tracking-widest">At the Parish Of</span>
                                        <p className="text-xl font-bold text-gray-900">{selectedForPrint.parish?.name || "Church Administration"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-epr-green-700 uppercase tracking-widest">Officiating Minister</span>
                                        <p className="text-lg font-bold text-gray-800">{selectedForPrint.officiantName || "Administrative Clergy"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-epr-green-700 uppercase tracking-widest">Certificate Reference</span>
                                        <p className="text-lg font-mono font-bold text-gray-500">{selectedForPrint.certificateNumber}</p>
                                    </div>
                                </div>

                                <div className="flex justify-between w-full mt-12 px-12">
                                    <div className="flex flex-col items-center">
                                        <div className="w-48 h-px bg-gray-400 mb-2"></div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Parish Pastor</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="w-48 h-px bg-gray-400 mb-2"></div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Synod President</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmDelete.isOpen}
                title="Delete Sacrament Record"
                message="Are you sure you want to remove this sacred record from the official registry? This action is considered an administrative error correction and will permanently delete the documentation. This cannot be undone."
                type="danger"
                onConfirm={() => handleDelete(confirmDelete.id)}
                onCancel={() => setConfirmDelete({ id: "", isOpen: false })}
                confirmText="Delete Record"
                isLoading={isActionLoading}
            />
        </AppShell>
    );
}
