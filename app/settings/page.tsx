"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService, User } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import api from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import {
    Settings,
    Save,
    Info,
    ShieldCheck,
    Building2,
    Globe,
    Mail,
    Phone,
    MapPin,
    CreditCard,
    Activity,
    Database,
    Cpu,
    RefreshCcw,
    CheckCircle2,
    AlertCircle,
    Plus,
    X,
    Trash2,
    Edit
} from "lucide-react";

export default function SettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<any[]>([]);
    const [health, setHealth] = useState<any>(null);
    const { addToast } = useToast();
    const [confirmInit, setConfirmInit] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"identity" | "financial" | "roles" | "infrastructure">("identity");

    // Dynamic Roles state
    const [roles, setRoles] = useState<any[]>([]);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [editingRole, setEditingRole] = useState<any>(null);
    const [roleForm, setRoleForm] = useState({
        name: "",
        description: "",
        level: "SYNOD",
        targetId: "",
        permissions: [] as any[],
    });

    const [presbyteries, setPresbyteries] = useState<any[]>([]);
    const [parishes, setParishes] = useState<any[]>([]);
    const [communities, setCommunities] = useState<any[]>([]);
    const [confirmDeleteRole, setConfirmDeleteRole] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<any>(null);

    // Local state for organized settings
    const [churchInfo, setChurchInfo] = useState({
        CHURCH_NAME: "",
        CHURCH_ADDRESS: "",
        CHURCH_EMAIL: "",
        CHURCH_PHONE: "",
    });

    const [financialSettings, setFinancialSettings] = useState({
        FINANCIAL_YEAR_START: "1",
        CURRENCY: "RWF",
    });

    useEffect(() => {
        const currentUser = authService.getUser();
        if (!currentUser) {
            router.push("/login");
            return;
        }
        // Only admins should see this
        if (!['SUPERADMIN', 'CHURCH_PRESIDENT', 'SYNOD_ADMIN'].includes(currentUser.role)) {
            router.push("/epr-dashboard");
            return;
        }
        setUser(currentUser);
        loadData();
    }, [router]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [settingsRes, healthRes] = await Promise.all([
                api.get("/settings"),
                api.get("/admin/system-health"),
            ]);

            const setArray = settingsRes.data;
            setSettings(setArray);
            setHealth(healthRes.data);

            // Map array to local state
            const info: any = {};
            const fin: any = {};

            setArray.forEach((s: any) => {
                if (s.group === 'CHURCH_INFO') info[s.key] = s.value;
                if (s.group === 'FINANCIAL') fin[s.key] = s.value;
            });

            setChurchInfo(prev => ({ ...prev, ...info }));
            setFinancialSettings(prev => ({ ...prev, ...fin }));

            // Load Roles and Orgs
            const [rolesRes, presRes, parRes, comRes] = await Promise.all([
                api.get("/roles"),
                api.get("/presbyteries"),
                api.get("/parishes"),
                api.get("/communities"),
            ]);
            setRoles(rolesRes.data);
            setPresbyteries(presRes.data);
            setParishes(parRes.data);
            setCommunities(comRes.data);
        } catch (error) {
            console.error("Load failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post("/settings", {
                ...churchInfo,
                ...financialSettings
            });
            addToast("Global settings synchronized successfully", "success");
        } catch (error) {
            addToast("Failed to propagate setting changes", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleInitialize = async () => {
        try {
            setIsActionLoading(true);
            await api.post("/settings/initialize");
            setConfirmInit(false);
            loadData();
            addToast("System parameters reset to defaults", "success");
        } catch (error) {
            addToast("Parameters initialization failed", "error");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleSaveRole = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsActionLoading(true);
            if (editingRole) {
                await api.patch(`/roles/${editingRole.id}`, roleForm);
                addToast("Role updated", "success");
            } else {
                await api.post("/roles", roleForm);
                addToast("New dynamic role established", "success");
            }
            setShowRoleModal(false);
            loadData();
        } catch (error) {
            addToast("Failed to preserve role configuration", "error");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleDeleteRole = async () => {
        if (!roleToDelete) return;
        try {
            setIsActionLoading(true);
            await api.delete(`/roles/${roleToDelete.id}`);
            addToast("Role configuration purged", "success");
            setConfirmDeleteRole(false);
            setRoleToDelete(null);
            loadData();
        } catch (error) {
            addToast("Failed to purge role configuration", "error");
        } finally {
            setIsActionLoading(false);
        }
    };

    const togglePermission = (resource: string, action: string) => {
        const current = [...roleForm.permissions];
        const resourceIdx = current.findIndex(p => p.resource === resource);

        if (resourceIdx === -1) {
            current.push({ resource, actions: [action] });
        } else {
            const actions = [...current[resourceIdx].actions];
            const actionIdx = actions.indexOf(action);
            if (actionIdx === -1) {
                actions.push(action);
            } else {
                actions.splice(actionIdx, 1);
            }
            if (actions.length === 0) {
                current.splice(resourceIdx, 1);
            } else {
                current[resourceIdx] = { ...current[resourceIdx], actions };
            }
        }
        setRoleForm({ ...roleForm, permissions: current });
    };

    if (!user) return null;

    return (
        <AppShell
            title="System Settings"
            subtitle="Global church configuration and infrastructure control"
            userName={`${user.firstName} ${user.lastName}`}
            userRole={user.role}
            onLogout={() => { authService.logout(); router.push("/login"); }}
        >
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header Actions */}
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                        <button
                            onClick={loadData}
                            className="p-2 text-gray-400 hover:text-epr-green-600 hover:bg-epr-green-50 rounded-lg transition-all"
                        >
                            <RefreshCcw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setConfirmInit(true)}
                            className="bg-gray-100 text-gray-400 hover:text-gray-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm"
                        >
                            RESET TO DEFAULTS
                        </button>
                        <button
                            disabled={saving}
                            onClick={handleSave}
                            className="btn-epr px-8"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {saving ? "SAVING..." : "SAVE CHANGES"}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Navigation Column */}
                    <div className="space-y-4">
                        <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm space-y-1">
                            <button
                                onClick={() => setActiveTab("identity")}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-black text-sm transition-all ${activeTab === "identity" ? "bg-epr-green-50 text-epr-green-700" : "text-gray-400 hover:bg-gray-50"}`}
                            >
                                <Building2 className="h-5 w-5" /> Church Identity
                            </button>
                            <button
                                onClick={() => setActiveTab("financial")}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-black text-sm transition-all ${activeTab === "financial" ? "bg-epr-green-50 text-epr-green-700" : "text-gray-400 hover:bg-gray-50"}`}
                            >
                                <CreditCard className="h-5 w-5" /> Financial Params
                            </button>
                            <button
                                onClick={() => setActiveTab("roles")}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-black text-sm transition-all ${activeTab === "roles" ? "bg-epr-green-50 text-epr-green-700" : "text-gray-400 hover:bg-gray-50"}`}
                            >
                                <ShieldCheck className="h-5 w-5" /> Roles & Permissions
                            </button>
                            <button
                                onClick={() => setActiveTab("infrastructure")}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-black text-sm transition-all ${activeTab === "infrastructure" ? "bg-epr-green-50 text-epr-green-700" : "text-gray-400 hover:bg-gray-50"}`}
                            >
                                <Globe className="h-5 w-5" /> Infrastructure
                            </button>
                        </div>

                        {/* System Health Card */}
                        <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden">
                            <div className="relative z-10 space-y-4">
                                <div className="flex justify-between items-center">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">System Health</p>
                                    <div className="h-2 w-2 bg-epr-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(0,135,81,1)]"></div>
                                </div>
                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Database className="h-4 w-4 text-gray-500" />
                                            <span className="text-xs font-bold">Database</span>
                                        </div>
                                        <span className="text-[10px] font-black text-epr-green-400 uppercase tracking-widest">{health?.database || "CONNECTED"}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Activity className="h-4 w-4 text-gray-500" />
                                            <span className="text-xs font-bold">Latency</span>
                                        </div>
                                        <span className="text-[10px] font-black text-epr-green-400 uppercase tracking-widest">24ms</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Cpu className="h-4 w-4 text-gray-500" />
                                            <span className="text-xs font-bold">Uptime</span>
                                        </div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{Math.floor((health?.uptime || 0) / 3600)} HRS</span>
                                    </div>
                                </div>
                            </div>
                            <Activity className="absolute -bottom-10 -right-10 h-32 w-32 text-white/5" />
                        </div>
                    </div>

                    {/* Content Column */}
                    <div className="lg:col-span-2 space-y-8">

                        {activeTab === "identity" && (
                            <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="p-8 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
                                    <div className="h-10 w-10 bg-epr-green-600 rounded-xl flex items-center justify-center text-white">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-gray-900 tracking-tighter">CHURCH IDENTITY</h3>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Official Branding & Contact Data</p>
                                    </div>
                                </div>
                                <div className="p-8 space-y-6">
                                    <div className="space-y-1.5 font-bold uppercase tracking-widest">
                                        <label className="text-[10px] text-gray-400 ml-1">Official Name</label>
                                        <input
                                            type="text"
                                            value={churchInfo.CHURCH_NAME}
                                            onChange={(e) => setChurchInfo({ ...churchInfo, CHURCH_NAME: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-epr-green-500/10 focus:bg-white focus:border-epr-green-500 transition-all"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5 font-bold uppercase tracking-widest">
                                            <label className="text-[10px] text-gray-400 ml-1">Public Email</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                                                <input
                                                    type="email"
                                                    value={churchInfo.CHURCH_EMAIL}
                                                    onChange={(e) => setChurchInfo({ ...churchInfo, CHURCH_EMAIL: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-epr-green-500/10"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5 font-bold uppercase tracking-widest">
                                            <label className="text-[10px] text-gray-400 ml-1">Phone String</label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                                                <input
                                                    type="text"
                                                    value={churchInfo.CHURCH_PHONE}
                                                    onChange={(e) => setChurchInfo({ ...churchInfo, CHURCH_PHONE: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-epr-green-500/10"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 font-bold uppercase tracking-widest">
                                        <label className="text-[10px] text-gray-400 ml-1">Headquarters Physical Address</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-gray-300" />
                                            <textarea
                                                value={churchInfo.CHURCH_ADDRESS}
                                                onChange={(e) => setChurchInfo({ ...churchInfo, CHURCH_ADDRESS: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl h-24 resize-none outline-none focus:ring-4 focus:ring-epr-green-500/10"
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {activeTab === "financial" && (
                            <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="p-8 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
                                    <div className="h-10 w-10 bg-epr-green-600 rounded-xl flex items-center justify-center text-white">
                                        <CreditCard className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-gray-900 tracking-tighter">FINANCIAL CORE</h3>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Accounting & Fiscal parameters</p>
                                    </div>
                                </div>
                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Base Currency</label>
                                        <select
                                            value={financialSettings.CURRENCY}
                                            onChange={(e) => setFinancialSettings({ ...financialSettings, CURRENCY: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-black text-gray-900"
                                        >
                                            <option value="RWF">Rwandan Franc (RWF)</option>
                                            <option value="USD">US Dollar (USD)</option>
                                            <option value="EUR">Euro (EUR)</option>
                                        </select>
                                        <p className="text-[10px] text-gray-400 italic mt-1">Note: All bookkeeping will use this currency.</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Fiscal Year Start Month</label>
                                        <select
                                            value={financialSettings.FINANCIAL_YEAR_START}
                                            onChange={(e) => setFinancialSettings({ ...financialSettings, FINANCIAL_YEAR_START: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-black text-gray-900"
                                        >
                                            <option value="1">January</option>
                                            <option value="7">July</option>
                                            <option value="9">September</option>
                                        </select>
                                    </div>
                                </div>
                            </section>
                        )}

                        {activeTab === "roles" && (
                            <section className="space-y-6">
                                <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                    <div>
                                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Dynamic RBAC</h3>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Custom Role Definitions & Scope</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setEditingRole(null);
                                            setRoleForm({ name: "", description: "", level: "SYNOD", targetId: "", permissions: [] });
                                            setShowRoleModal(true);
                                        }}
                                        className="btn-epr"
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> CREATE ROLE
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {roles.map(role => (
                                        <div key={role.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-3 bg-epr-green-50 rounded-2xl">
                                                    <ShieldCheck className="h-6 w-6 text-epr-green-600" />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => { setEditingRole(role); setRoleForm(role); setShowRoleModal(true); }} className="p-2 text-gray-400 hover:text-epr-green-600 transition-all opacity-0 group-hover:opacity-100">
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={async () => { if (confirm("Delete this role?")) { await api.delete(`/roles/${role.id}`); loadData(); addToast("Role removed", "success"); } }} className="p-2 text-gray-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <h4 className="font-black text-gray-900 uppercase tracking-tighter">{role.name}</h4>
                                            <p className="text-xs text-gray-400 mb-4">{role.description || "No description provided"}</p>
                                            <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
                                                <span className="px-2 py-0.5 bg-gray-100 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-widest">{role.level}</span>
                                                {role.targetId && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">RESTRICTED SCOPE</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {activeTab === "infrastructure" && (
                            <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="p-8 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
                                    <div className="h-10 w-10 bg-epr-green-600 rounded-xl flex items-center justify-center text-white">
                                        <Globe className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-gray-900 tracking-tighter">INFRASTRUCTURE</h3>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">System Performance & Audit Logs</p>
                                    </div>
                                </div>
                                <div className="p-8 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <Activity className="h-4 w-4" />
                                                <span className="text-[10px] uppercase tracking-widest font-bold">System Uptime</span>
                                            </div>
                                            <p className="text-2xl font-black text-gray-900">{Math.floor((health?.uptime || 0) / 3600)} HRS</p>
                                        </div>
                                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <Cpu className="h-4 w-4" />
                                                <span className="text-[10px] uppercase tracking-widest font-bold">API Latency</span>
                                            </div>
                                            <p className="text-2xl font-black text-gray-900">24ms</p>
                                        </div>
                                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <Database className="h-4 w-4" />
                                                <span className="text-[10px] uppercase tracking-widest font-bold">Database Health</span>
                                            </div>
                                            <p className="text-2xl font-black text-epr-green-600">OPTIMAL</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Recent Audit Logs</h4>
                                            <button className="text-[10px] font-bold text-epr-green-600 uppercase tracking-widest hover:underline">View All Logs</button>
                                        </div>
                                        <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                                            <div className="p-8 text-center text-gray-400 text-sm italic">
                                                Audit logs feature coming soon in the next release.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                    </div>
                </div>

                {/* Security Alert */}
                <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl flex gap-6 items-center">
                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-black text-blue-900 uppercase tracking-tighter">Administrative Safeguard</p>
                        <p className="text-xs text-blue-700 font-medium">Any changes made here affect the entire Synod infrastructure including parish portals and financial auditing reports. Ensure accuracy before saving.</p>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={confirmInit}
                title="Initialize System Settings"
                message="Are you sure you want to initialize default settings? This high-level administrative action will overwrite any existing global configuration keys with factory defaults. This action is irreversible."
                type="danger"
                onConfirm={handleInitialize}
                onCancel={() => setConfirmInit(false)}
                confirmText="Reset Now"
                isLoading={isActionLoading}
            />

            <ConfirmationModal
                isOpen={confirmDeleteRole}
                title="Purge Role Configuration"
                message={`Are you sure you want to permanently delete the "${roleToDelete?.name}" role? This will immediately revoke access for all users assigned to this role and cannot be undone.`}
                type="danger"
                onConfirm={handleDeleteRole}
                onCancel={() => { setConfirmDeleteRole(false); setRoleToDelete(null); }}
                confirmText="Purge Role"
                isLoading={isActionLoading}
            />

            {/* Role Modal */}
            {showRoleModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">{editingRole ? "Reconfigure Role" : "Define Dynamic Role"}</h2>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Establish permissions and operational scope</p>
                            </div>
                            <button onClick={() => setShowRoleModal(false)} className="p-2 hover:bg-white rounded-full transition-all">
                                <X className="h-6 w-6 text-gray-300" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveRole} className="p-8 space-y-8 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Role Name</label>
                                    <input
                                        type="text" required
                                        placeholder="e.g. Presbytery Accountant Assistant"
                                        value={roleForm.name}
                                        onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-epr-green-500/10 transition-all font-bold"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Scope Level</label>
                                    <select
                                        value={roleForm.level}
                                        onChange={(e) => setRoleForm({ ...roleForm, level: e.target.value, targetId: "" })}
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-epr-green-500/10 transition-all font-bold"
                                    >
                                        <option value="SYNOD">National (General Synod)</option>
                                        <option value="PRESBYTERY">Presbytery Level</option>
                                        <option value="PARISH">Parish Level</option>
                                        <option value="COMMUNITY">Community Level</option>
                                    </select>
                                </div>
                            </div>

                            {roleForm.level !== "SYNOD" && (
                                <div className="space-y-1.5 animate-in slide-in-from-top-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Target Organization</label>
                                    <select
                                        required
                                        value={roleForm.targetId}
                                        onChange={(e) => setRoleForm({ ...roleForm, targetId: e.target.value })}
                                        className="w-full px-5 py-3 bg-gray-50 border border-epr-green-100 rounded-2xl outline-none focus:ring-4 focus:ring-epr-green-500/10 transition-all font-bold text-epr-green-700"
                                    >
                                        <option value="">Select Target Organ...</option>
                                        {roleForm.level === "PRESBYTERY" && presbyteries.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        {roleForm.level === "PARISH" && parishes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        {roleForm.level === "COMMUNITY" && communities.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                            )}

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Granular Permissions Matrix</label>
                                <div className="bg-gray-50 rounded-3xl border border-gray-100 overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-gray-100/50">
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Module</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">View</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Create</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Update</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Delete</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {["CLERGY", "MEMBERS", "EXPENSES", "EVENTS", "CONTRIBUTIONS", "SACRAMENTS", "PRESBYTERIES", "PARISHES", "COMMUNITIES"].map(module => (
                                                <tr key={module} className="hover:bg-white transition-colors">
                                                    <td className="px-6 py-4 text-xs font-black text-gray-700 uppercase tracking-tighter">{module}</td>
                                                    {["VIEW", "CREATE", "UPDATE", "DELETE"].map(action => {
                                                        const isChecked = roleForm.permissions.find(p => p.resource === module)?.actions.includes(action);
                                                        return (
                                                            <td key={action} className="px-6 py-4 text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => togglePermission(module, action)}
                                                                    className={`h-6 w-6 rounded-lg border-2 transition-all flex items-center justify-center mx-auto ${isChecked ? "bg-epr-green-600 border-epr-green-600 text-white" : "bg-white border-gray-200"}`}
                                                                >
                                                                    {isChecked && <CheckCircle2 className="h-4 w-4" />}
                                                                </button>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowRoleModal(false)} className="btn-outline flex-1 py-4 text-xs tracking-widest">DISCARD</button>
                                <button type="submit" disabled={isActionLoading} className="btn-epr flex-[2] py-4 text-xs tracking-widest">
                                    {isActionLoading ? "PRESERVING..." : (editingRole ? "UPDATE CONFIGURATION" : "ESTABLISH ROLE")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppShell>
    );
}
