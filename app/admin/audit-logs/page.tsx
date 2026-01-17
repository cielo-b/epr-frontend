"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService, User } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import api from "@/lib/api";
import {
    ShieldAlert,
    Search,
    Filter,
    Clock,
    User as UserIcon,
    Database,
    Activity,
    Eye,
    Calendar,
    Layers,
    FileJson
} from "lucide-react";

interface AuditLog {
    id: string;
    action: string;
    module: string;
    description: string;
    timestamp: string;
    actor: { firstName: string; lastName: string };
    payload: any;
}

export default function AuditLogsPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const [filterModule, setFilterModule] = useState("");
    const [filterAction, setFilterAction] = useState("");

    useEffect(() => {
        const currentUser = authService.getUser();
        if (!currentUser || !['SUPERADMIN', 'SYNOD_ADMIN'].includes(currentUser.role)) {
            router.push("/epr-dashboard");
            return;
        }
        setUser(currentUser);
        loadLogs();
    }, [router, filterModule, filterAction]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterModule) params.append('module', filterModule);
            if (filterAction) params.append('action', filterAction);

            const res = await api.get(`/audit-logs?${params.toString()}`);
            setLogs(res.data);
        } catch (error) {
            console.error("Load failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'IMPORT': return 'text-purple-600 bg-purple-50';
            case 'CREATE': return 'text-epr-green-600 bg-epr-green-50';
            case 'UPDATE': return 'text-blue-600 bg-blue-50';
            case 'DELETE': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    if (!user) return null;

    return (
        <AppShell
            title="System Audit Vault"
            subtitle="Immutable activity tracking and compliance monitoring"
            userName={`${user.firstName} ${user.lastName}`}
            userRole={user.role}
            onLogout={() => { authService.logout(); router.push("/login"); }}
        >
            <div className="space-y-6">

                {/* Filters */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 text-sm font-bold text-gray-400 uppercase tracking-widest px-2">
                        Showing Latest 100 System Events
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={filterModule}
                            onChange={(e) => setFilterModule(e.target.value)}
                            className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none"
                        >
                            <option value="">All Modules</option>
                            <option value="CLERGY">Clergy</option>
                            <option value="MEMBERS">Members</option>
                            <option value="EXPENSES">Expenses</option>
                            <option value="PARISHES">Parishes</option>
                        </select>
                        <select
                            value={filterAction}
                            onChange={(e) => setFilterAction(e.target.value)}
                            className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none"
                        >
                            <option value="">All Actions</option>
                            <option value="CREATE">Create</option>
                            <option value="UPDATE">Update</option>
                            <option value="DELETE">Delete</option>
                            <option value="IMPORT">Import</option>
                        </select>
                        <button
                            onClick={loadLogs}
                            className="p-2 bg-gray-900 text-white rounded-xl hover:bg-black transition-all"
                        >
                            <Activity className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Logs Table */}
                <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Timestamp</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actor</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Module / Action</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                Array(8).fill(0).map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={5} className="px-6 py-5"><div className="h-8 bg-gray-100 rounded-lg"></div></td></tr>)
                            ) : logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                                            <Clock className="h-3.5 w-3.5 text-gray-300" />
                                            {new Date(log.timestamp).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-black text-gray-500">
                                                {log.actor?.firstName[0]}{log.actor?.lastName[0]}
                                            </div>
                                            <span className="text-sm font-black text-gray-700">{log.actor?.firstName} {log.actor?.lastName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{log.module}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getActionColor(log.action)}`}>{log.action}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="text-sm text-gray-500 line-clamp-1 italic">{log.description}</p>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button onClick={() => setSelectedLog(log)} className="p-2 text-gray-300 hover:text-gray-900 transition-all">
                                            <Eye className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Log Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-2">
                                    <ShieldAlert className="h-6 w-6 text-red-600" />
                                    Audit Event Details
                                </h2>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-white rounded-full transition-all">
                                <Activity className="h-6 w-6 text-gray-300" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Module</span>
                                    <p className="font-bold text-gray-900">{selectedLog.module}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Operation</span>
                                    <p className="font-bold text-gray-900">{selectedLog.action}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Timestamp</span>
                                    <p className="text-sm font-bold text-gray-700">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Log Identifier</span>
                                    <p className="text-[10px] font-mono font-bold text-gray-400">{selectedLog.id}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Action Summary</span>
                                <div className="p-4 bg-white border border-gray-100 rounded-2xl text-sm text-gray-600 leading-relaxed">
                                    {selectedLog.description}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payload Data</span>
                                    <FileJson className="h-4 w-4 text-gray-300" />
                                </div>
                                <div className="p-4 bg-gray-900 rounded-2xl overflow-hidden">
                                    <pre className="text-[10px] text-epr-green-400 font-mono overflow-auto max-h-48 custom-scrollbar">
                                        {JSON.stringify(selectedLog.payload, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 pb-8 pt-2">
                            <button onClick={() => setSelectedLog(null)} className="btn-outline w-full py-4 text-xs tracking-widest">ACKNOWLEDGE</button>
                        </div>
                    </div>
                </div>
            )}
        </AppShell>
    );
}
