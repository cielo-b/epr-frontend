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
    Banknote,
    Search,
    Filter,
    Plus,
    Edit,
    Trash2,
    X,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    DollarSign,
    Calendar,
    User as UserIcon,
    CreditCard,
    FileText,
    PieChart,
    Download,
    Receipt,
    CheckCircle2,
    Clock
} from "lucide-react";

interface Contribution {
    id: string;
    amount: number;
    type: "OFFERING" | "TITHE" | "DONATION" | "SPECIAL_PROJECT" | "OTHER";
    date: string;
    memberId?: string;
    memberName?: string;
    parishId: string;
    description?: string;
    paymentMethod: "CASH" | "MOMO" | "BANK_TRANSFER" | "CHECK" | "OTHER";
    receiptNumber: string;
    isVerified: boolean;
    parish?: { name: string };
}

interface FinancialSummary {
    totalAmount: number;
    byType: Record<string, number>;
    count: number;
}

export default function ContributionsPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [contributions, setContributions] = useState<Contribution[]>([]);
    const [summary, setSummary] = useState<FinancialSummary | null>(null);
    const [parishes, setParishes] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);

    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("");
    const [filterParish, setFilterParish] = useState("");
    const [dateRange, setDateRange] = useState({ start: "", end: "" });

    const [showModal, setShowModal] = useState(false);
    const [editingContribution, setEditingContribution] = useState<Contribution | null>(null);
    const { addToast } = useToast();
    const [confirmDelete, setConfirmDelete] = useState<{ id: string; isOpen: boolean }>({ id: "", isOpen: false });
    const [isActionLoading, setIsActionLoading] = useState(false);

    const [formData, setFormData] = useState({
        amount: 0,
        type: "OFFERING",
        date: new Date().toISOString().split('T')[0],
        memberId: "",
        memberName: "",
        parishId: "",
        description: "",
        paymentMethod: "CASH",
        isVerified: true,
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
            const [contRes, sumRes, parRes, memRes] = await Promise.all([
                api.get("/contributions"),
                api.get("/contributions/summary"),
                api.get("/parishes"),
                api.get("/members"),
            ]);
            setContributions(contRes.data);
            setSummary(sumRes.data);
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
            if (dateRange.start) params.append("startDate", dateRange.start);
            if (dateRange.end) params.append("endDate", dateRange.end);

            const [contRes, sumRes] = await Promise.all([
                api.get(`/contributions?${params.toString()}`),
                api.get(`/contributions/summary?${params.toString()}`),
            ]);
            setContributions(contRes.data);
            setSummary(sumRes.data);
        } catch (error) {
            console.error("Filter failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingContribution) {
                await api.patch(`/contributions/${editingContribution.id}`, formData);
            } else {
                await api.post("/contributions", formData);
            }
            setShowModal(false);
            resetForm();
            loadInitialData();
            addToast(`Contribution record ${editingContribution ? 'updated' : 'recorded'} successfully`, "success");
        } catch (error: any) {
            addToast(error.response?.data?.message || "Operation failed", "error");
        }
    };

    const resetForm = () => {
        setFormData({
            amount: 0,
            type: "OFFERING",
            date: new Date().toISOString().split('T')[0],
            memberId: "",
            memberName: "",
            parishId: "",
            description: "",
            paymentMethod: "CASH",
            isVerified: true,
        });
        setEditingContribution(null);
    };

    const handleEdit = (c: Contribution) => {
        setEditingContribution(c);
        setFormData({
            amount: c.amount,
            type: c.type,
            date: c.date.substring(0, 10),
            memberId: c.memberId || "",
            memberName: c.memberName || "",
            parishId: c.parishId,
            description: c.description || "",
            paymentMethod: c.paymentMethod,
            isVerified: c.isVerified,
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        try {
            setIsActionLoading(true);
            await api.delete(`/contributions/${id}`);
            setConfirmDelete({ id: "", isOpen: false });
            loadInitialData();
            addToast("Financial record removed from system", "success");
        } catch (error) {
            addToast("Failed to delete record", "error");
        } finally {
            setIsActionLoading(false);
        }
    };

    if (!user) return null;

    return (
        <AppShell
            title="Financial Contributions"
            subtitle="Tracking church income, tithes, and special project funds"
            userName={`${user.firstName} ${user.lastName}`}
            userRole={user.role}
            onLogout={() => { authService.logout(); router.push("/login"); }}
        >
            <div className="space-y-6">
                {/* Stats Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-epr-green-50 rounded-xl">
                                <DollarSign className="h-6 w-6 text-epr-green-600" />
                            </div>
                            <span className="flex items-center text-[10px] font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full">
                                <ArrowUpRight className="h-3 w-3 mr-0.5" />
                                12%
                            </span>
                        </div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Total Collected</p>
                        <h3 className="text-2xl font-black text-gray-900 mt-1">
                            RWF {summary?.totalAmount.toLocaleString() || "0"}
                        </h3>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-50 rounded-xl">
                                <Receipt className="h-6 w-6 text-blue-600" />
                            </div>
                            <span className="text-[10px] font-bold text-gray-400">Monthly Target</span>
                        </div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Transaction Count</p>
                        <h3 className="text-2xl font-black text-gray-900 mt-1">
                            {summary?.count || "0"}
                        </h3>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-purple-50 rounded-xl">
                                <TrendingUp className="h-6 w-6 text-purple-600" />
                            </div>
                            <span className="text-[10px] font-bold text-epr-green-500">Highest Category</span>
                        </div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Top Revenue Stream</p>
                        <h3 className="text-2xl font-black text-gray-900 mt-1 uppercase" style={{ fontSize: '1.2rem' }}>
                            {summary ? Object.keys(summary.byType).reduce((a, b) => summary.byType[a] > summary.byType[b] ? a : b, "N/A").replace("_", " ") : "N/A"}
                        </h3>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-center items-center gap-2 border-dashed border-2 hover:bg-epr-green-50/10 cursor-pointer group transition-all" onClick={() => { resetForm(); setShowModal(true); }}>
                        <div className="p-3 bg-epr-green-600 text-white rounded-full group-hover:scale-110 transition-transform">
                            <Plus className="h-6 w-6" />
                        </div>
                        <p className="text-xs font-bold text-epr-green-600 uppercase tracking-widest mt-1">Record Income</p>
                    </div>
                </div>

                {/* Filters/Search Row */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                            <input
                                type="text"
                                placeholder="Search by receipt number..."
                                className="input-premium pl-10"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold">
                                <option value="">Contribution Type</option>
                                <option value="OFFERING">Offering</option>
                                <option value="TITHE">Tithe</option>
                                <option value="DONATION">Donation</option>
                                <option value="SPECIAL_PROJECT">Special Project</option>
                            </select>
                            <select value={filterParish} onChange={(e) => setFilterParish(e.target.value)} className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold">
                                <option value="">Parish</option>
                                {parishes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <button onClick={handleFilter} className="px-6 py-2 bg-gray-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-sm">Filter</button>
                            <button onClick={() => { setFilterType(""); setFilterParish(""); loadInitialData(); }} className="px-6 py-2 bg-gray-100 text-gray-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95 shadow-sm">Reset</button>
                        </div>
                    </div>
                </div>

                {/* Transactions Table */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Transaction Ref</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contributor</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type / Method</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Amount (RWF)</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    Array(5).fill(0).map((_, i) => <tr key={i} className="h-16 animate-pulse bg-gray-50/50"></tr>)
                                ) : contributions.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-mono text-xs text-gray-500">{c.receiptNumber}</div>
                                            <div className="text-[10px] text-gray-400 flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(c.date).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{c.memberName || "General Collection"}</div>
                                            <div className="text-[10px] text-epr-green-600 font-bold">{c.parish?.name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-700">{c.type.replace("_", " ")}</span>
                                                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                    <CreditCard className="h-3 w-3" />
                                                    {c.paymentMethod}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="text-sm font-black text-gray-900">{c.amount.toLocaleString()}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {c.isVerified ? (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-green-600">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    VERIFIED
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-500">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    PENDING
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(c)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => setConfirmDelete({ id: c.id, isOpen: true })} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {!loading && contributions.length === 0 && (
                        <div className="py-20 text-center flex flex-col items-center">
                            <Banknote className="h-16 w-16 text-gray-100 mb-2" />
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No records found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Contribution Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-epr-green-600 px-8 py-10 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <h2 className="text-3xl font-black italic tracking-tighter">FINANCIAL ENTRY</h2>
                                <p className="text-epr-green-100 text-xs font-bold uppercase tracking-[0.4em] mt-1">Income Verification System</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                                <X className="h-6 w-6 text-white" />
                            </button>
                            <DollarSign className="absolute -bottom-10 -right-10 h-48 w-48 text-white/5 rotate-12" />
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Voucher Amount (RWF) *</label>
                                    <input
                                        type="number" required
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-2xl font-black text-gray-900 placeholder:text-gray-200 outline-none focus:ring-4 focus:ring-epr-green-500/10 focus:border-epr-green-500 transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Revenue Category *</label>
                                    <select required value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-epr-green-500/10 font-bold text-gray-700">
                                        <option value="OFFERING">General Offering</option>
                                        <option value="TITHE">Tithe Payment</option>
                                        <option value="DONATION">Charity Donation</option>
                                        <option value="SPECIAL_PROJECT">Special Project</option>
                                        <option value="OTHER">Other Income</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Payment Channel *</label>
                                    <select required value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-epr-green-500/10 font-bold text-gray-700">
                                        <option value="CASH">Liquid Cash</option>
                                        <option value="MOMO">Mobile Money</option>
                                        <option value="BANK_TRANSFER">Bank Wire</option>
                                        <option value="CHECK">Certified Check</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Transaction Date *</label>
                                    <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none" />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Parish Ledger *</label>
                                    <select required value={formData.parishId} onChange={(e) => setFormData({ ...formData, parishId: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none">
                                        <option value="">Select Parish</option>
                                        {parishes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>

                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Member Reference (Optional)</label>
                                    <select value={formData.memberId} onChange={(e) => setFormData({ ...formData, memberId: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none">
                                        <option value="">Guest / General Contributor</option>
                                        {members.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName} (#{m.membershipNumber})</option>)}
                                    </select>
                                </div>

                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Audit Notes</label>
                                    <textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Additional details..." className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none resize-none" />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-gray-100 mt-6">
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
                                    AUTHORIZE ENTRY
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmDelete.isOpen}
                title="Delete Contribution Record"
                message="Are you sure you want to delete this financial record? Financial data is sensitive and removing entries can affect treasury audits. This action is irreversible."
                type="danger"
                onConfirm={() => handleDelete(confirmDelete.id)}
                onCancel={() => setConfirmDelete({ id: "", isOpen: false })}
                confirmText="Confirm Deletion"
                isLoading={isActionLoading}
            />
        </AppShell>
    );
}
