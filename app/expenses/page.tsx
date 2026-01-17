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
    DollarSign,
    Search,
    Filter,
    Plus,
    Eye,
    CheckCircle,
    XCircle,
    CreditCard,
    FileText,
    Clock,
    ArrowUpRight,
    TrendingDown,
    Tag,
    Calendar,
    Layers,
    MoreHorizontal,
    Download,
    Receipt,
    CheckCircle2,
    X,
    Upload
} from "lucide-react";

interface Expense {
    id: string;
    voucherNumber: string;
    category: string;
    description: string;
    amount: number;
    date: string;
    status: string;
    payeeName: string;
    paymentMethod?: string;
    parish?: { name: string };
    approvedByName?: string;
    paidByName?: string;
}

export default function ExpensesPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [parishes, setParishes] = useState<any[]>([]);

    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [filterStatus, setFilterStatus] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [showPayModal, setShowPayModal] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const { addToast } = useToast();
    const [confirmApprove, setConfirmApprove] = useState<{ id: string; isOpen: boolean }>({ id: "", isOpen: false });
    const [isActionLoading, setIsActionLoading] = useState(false);

    const [formData, setFormData] = useState({
        voucherNumber: "",
        category: "SUPPLIES",
        description: "",
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        payeeName: "",
        parishId: "",
    });

    const [paymentData, setPaymentData] = useState({
        method: "MOBILE_MONEY",
        reference: "",
    });

    const categories = [
        "SALARIES", "UTILITIES", "MAINTENANCE", "SUPPLIES", "PROGRAMS",
        "MISSIONS", "CONSTRUCTION", "TRANSPORTATION", "OTHER"
    ];

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
            const [expRes, statsRes, parishRes] = await Promise.all([
                api.get("/expenses"),
                api.get("/expenses/statistics"),
                api.get("/parishes"),
            ]);
            setExpenses(expRes.data);
            setStats(statsRes.data);
            setParishes(parishRes.data);

            // Auto-generate voucher number for form
            const voucherRes = await api.get("/expenses/generate-voucher");
            setFormData(prev => ({ ...prev, voucherNumber: voucherRes.data.voucherNumber }));
        } catch (error) {
            console.error("Load failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post("/expenses", {
                ...formData,
                requestedBy: user?.id,
                requestedByName: `${user?.firstName} ${user?.lastName}`,
            });
            setShowModal(false);
            loadInitialData();
            addToast("Expenditure voucher filed successfully!", "success");
        } catch (error: any) {
            addToast(error.response?.data?.message || "Operation failed", "error");
        }
    };

    const handleApprove = async (id: string) => {
        try {
            setIsActionLoading(true);
            await api.patch(`/expenses/${id}/approve`, {
                userId: user?.id,
                userName: `${user?.firstName} ${user?.lastName}`,
            });
            setConfirmApprove({ id: "", isOpen: false });
            loadInitialData();
            addToast("Expense voucher approved for disbursement.", "success");
        } catch (error) {
            addToast("Failed to approve expense voucher.", "error");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedExpense) return;
        try {
            await api.patch(`/expenses/${selectedExpense.id}/pay`, {
                userId: user?.id,
                userName: `${user?.firstName} ${user?.lastName}`,
                ...paymentData
            });
            setShowPayModal(false);
            loadInitialData();
            addToast("Expense marked as paid and disbursed.", "success");
        } catch (error) {
            addToast("Failed to process payment.", "error");
        }
    };

    const handleExport = async () => {
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/data/template/expenses`;
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setLoading(true);
            const res = await api.post('/data/import/expenses', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            addToast(`Import Successful! ${res.data.success} expenses recorded.`, "success");
            loadInitialData();
        } catch (error: any) {
            addToast(error.response?.data?.message || "Import failed", "error");
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: any = {
            PENDING: "bg-amber-100 text-amber-700 border-amber-200",
            APPROVED: "bg-blue-100 text-blue-700 border-blue-200",
            PAID: "bg-epr-green-100 text-epr-green-700 border-epr-green-200",
            REJECTED: "bg-red-100 text-red-700 border-red-200",
        };
        return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${styles[status]}`}>{status}</span>;
    };

    if (!user) return null;

    return (
        <AppShell
            title="Expense Management"
            subtitle="Financial tracking, voucher auditing and disbursements"
            userName={`${user.firstName} ${user.lastName}`}
            userRole={user.role}
            onLogout={() => { authService.logout(); router.push("/login"); }}
        >
            <div className="space-y-6">
                {/* Statistics Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-6">
                        <div className="h-14 w-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 shadow-inner">
                            <TrendingDown className="h-7 w-7" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Expenses</p>
                            <div className="flex items-baseline gap-1">
                                <p className="text-2xl font-black text-gray-900">{stats?.totalAmount.toLocaleString()} <span className="text-sm font-bold text-gray-400">RWF</span></p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-6">
                        <div className="h-14 w-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner">
                            <Clock className="h-7 w-7" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pending Vouchers</p>
                            <p className="text-2xl font-black text-gray-900">{stats?.byStatus.find((s: any) => s.status === 'pending')?.count || 0}</p>
                        </div>
                    </div>
                    <div className="bg-epr-green-600 p-6 rounded-2xl shadow-xl shadow-epr-green-100 flex items-center gap-6 group">
                        <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-md">
                            <Download className="h-7 w-7" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-bold text-epr-green-100 uppercase tracking-widest">Reports</p>
                            <button className="text-white font-black hover:underline underline-offset-4 flex items-center gap-2">
                                Download Audit Log <ArrowUpRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by payee, voucher or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-premium pl-10"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold"
                        >
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
                        </select>
                        <div className="flex gap-2">
                            <button
                                onClick={handleExport}
                                className="p-2.5 text-gray-400 hover:text-epr-green-600 hover:bg-epr-green-50 bg-white border border-gray-200 rounded-xl transition-all shadow-sm"
                                title="Download Excel Template"
                            >
                                <Download className="h-5 w-5" />
                            </button>
                            <label className="p-2.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 bg-white border border-gray-200 rounded-xl transition-all cursor-pointer shadow-sm" title="Bulk Import Vouchers">
                                <Upload className="h-5 w-5" />
                                <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleImport} />
                            </label>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg active:scale-95"
                        >
                            <Plus className="h-5 w-5" />
                            File Voucher
                        </button>
                    </div>
                </div>

                {/* Expenses List */}
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Transaction / Date</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Payee / Parish</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Purpose</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Amount</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={6} className="px-6 py-4"><div className="h-10 bg-gray-100 rounded-lg"></div></td></tr>)
                            ) : expenses.filter(e =>
                                `${e.payeeName} ${e.voucherNumber} ${e.description}`.toLowerCase().includes(searchQuery.toLowerCase()) &&
                                (filterCategory === "" || e.category === filterCategory)
                            ).map((exp) => (
                                <tr key={exp.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-mono font-bold text-gray-900">{exp.voucherNumber}</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(exp.date).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-gray-900">{exp.payeeName}</span>
                                            <span className="text-[10px] font-bold text-epr-green-600 uppercase tracking-tighter">{exp.parish?.name || "Global Office"}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-gray-600 line-clamp-1">{exp.description}</span>
                                            <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                                <Tag className="h-3 w-3" /> {exp.category.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-base font-black text-gray-900">{exp.amount.toLocaleString()} <span className="text-[10px] text-gray-400 font-bold">RWF</span></span>
                                    </td>
                                    <td className="px-6 py-5">
                                        {getStatusBadge(exp.status)}
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {exp.status === 'PENDING' && (
                                                <button onClick={() => setConfirmApprove({ id: exp.id, isOpen: true })} title="Approve" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                                    <CheckCircle className="h-5 w-5" />
                                                </button>
                                            )}
                                            {exp.status === 'APPROVED' && (
                                                <button onClick={() => { setSelectedExpense(exp); setShowPayModal(true); }} className="px-4 py-1.5 bg-epr-green-600 text-white rounded-lg text-xs font-black shadow-lg shadow-epr-green-100">
                                                    PAY NOW
                                                </button>
                                            )}
                                            <button className="p-2 text-gray-400 hover:text-gray-900 rounded-lg">
                                                <Receipt className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Entry Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900">EXPENDITURE VOUCHER</h2>
                                <p className="text-[10px] font-bold text-red-600 uppercase tracking-[0.2em] mt-1">Financial Disbursement Request</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-full"><X className="h-8 w-8 text-gray-300" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Voucher #</label>
                                    <input readOnly value={formData.voucherNumber} className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl font-mono text-gray-500" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Category *</label>
                                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold">
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Payee Name (Person/Organization) *</label>
                                <input required value={formData.payeeName} onChange={(e) => setFormData({ ...formData, payeeName: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl" placeholder="Who is receiving the payment?" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Amount (RWF) *</label>
                                    <input type="number" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-black text-lg" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Date *</label>
                                    <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Assign to Parish (Optional)</label>
                                <select value={formData.parishId} onChange={(e) => setFormData({ ...formData, parishId: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl">
                                    <option value="">Global Synod / Miscellaneous</option>
                                    {parishes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Detailed Description *</label>
                                <textarea required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl h-24 resize-none" placeholder="Purpose of funds..."></textarea>
                            </div>

                            <div className="flex gap-4 pt-10 border-t border-gray-100 mt-6">
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
                                    AUTHORIZE & FILE VOUCHER
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPayModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="p-8 bg-epr-green-600 text-white">
                            <h2 className="text-xl font-black italic">DISBURSE FUNDS</h2>
                            <p className="text-[10px] font-bold uppercase mt-1 tracking-widest opacity-80">Finalizing Transfer for {selectedExpense?.voucherNumber}</p>
                        </div>
                        <form onSubmit={handlePayment} className="p-8 space-y-6">
                            <div className="flex flex-col items-center py-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <span className="text-sm font-bold text-gray-400 uppercase">Payable Amount</span>
                                <span className="text-3xl font-black text-gray-900">{selectedExpense?.amount.toLocaleString()} RWF</span>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payment Method</label>
                                <select value={paymentData.method} onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold">
                                    <option value="CASH">CASH</option>
                                    <option value="BANK_TRANSFER">BANK TRANSFER</option>
                                    <option value="MOBILE_MONEY">MOBILE MONEY</option>
                                    <option value="CHEQUE">CHEQUE</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Transaction Reference</label>
                                <input required value={paymentData.reference} onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-mono" placeholder="M-Pesa Ref / Bank Doc ID" />
                            </div>
                            <div className="flex gap-4 pt-6 border-t border-gray-100 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowPayModal(false)}
                                    className="btn-outline flex-1 py-4 text-xs tracking-widest"
                                >
                                    HOLD
                                </button>
                                <button
                                    type="submit"
                                    className="btn-epr flex-[2] py-4 text-xs tracking-widest"
                                >
                                    MARK AS PAID
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ApprovalModal
                isOpen={confirmApprove.isOpen}
                onConfirm={() => handleApprove(confirmApprove.id)}
                onCancel={() => setConfirmApprove({ id: "", isOpen: false })}
                isLoading={isActionLoading}
            />
        </AppShell>
    );
}

function ApprovalModal({ isOpen, onConfirm, onCancel, isLoading }: { isOpen: boolean, onConfirm: () => void, onCancel: () => void, isLoading: boolean }) {
    return (
        <ConfirmationModal
            isOpen={isOpen}
            title="Approve Expenditure"
            message="Are you sure you want to approve this expense voucher? Once approved, the funds can be disbursed by the treasurer."
            type="info"
            onConfirm={onConfirm}
            onCancel={onCancel}
            confirmText="Approve Voucher"
            isLoading={isLoading}
        />
    );
}
