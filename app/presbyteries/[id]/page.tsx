"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { authService, User } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import api from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import {
    Church,
    MapPin,
    Users,
    Phone,
    Mail,
    Building,
    ArrowLeft,
    Edit,
    TrendingUp,
    BarChart3,
    UserCheck,
    Home
} from "lucide-react";

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
    createdAt: string;
    updatedAt: string;
}

interface Parish {
    id: string;
    name: string;
    code: string;
    location?: string;
    totalCommunities: number;
    totalMembers: number;
}

interface Statistics {
    totalParishes: number;
    totalCommunities: number;
    totalMembers: number;
    totalFamilies: number;
    activeParishes: number;
    activeCommunities: number;
    baptizedMembers: number;
    confirmedMembers: number;
}

export default function PresbyterDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [presbytery, setPresbytery] = useState<Presbytery | null>(null);
    const [parishes, setParishes] = useState<Parish[]>([]);
    const [statistics, setStatistics] = useState<Statistics | null>(null);
    const { addToast } = useToast();

    useEffect(() => {
        const currentUser = authService.getUser();
        if (!currentUser) {
            router.push("/login");
            return;
        }
        setUser(currentUser);
        loadData();
    }, [id, router]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [presbyteryRes, statisticsRes] = await Promise.all([
                api.get(`/presbyteries/${id}`),
                api.get(`/presbyteries/${id}/statistics`),
            ]);
            setPresbytery(presbyteryRes.data);
            setStatistics(statisticsRes.data);

            // Load parishes for this presbytery
            const parishesRes = await api.get(`/parishes?presbyteryId=${id}`);
            setParishes(parishesRes.data);
        } catch (error: any) {
            console.error("Failed to load presbytery details:", error);
            if (error.response?.status === 404) {
                addToast("Presbytery not found", "error");
                router.push("/presbyteries");
            } else {
                addToast("Failed to load presbytery details", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        router.push("/login");
    };

    if (!user) return null;

    return (
        <AppShell
            title={presbytery?.name || "Presbytery Details"}
            subtitle="Detailed information and statistics"
            userName={`${user.firstName} ${user.lastName}`}
            userRole={user.role}
            onLogout={handleLogout}
        >
            <div className="max-w-[1600px] mx-auto space-y-6">
                {/* Back Button */}
                <button
                    onClick={() => router.push("/presbyteries")}
                    className="flex items-center gap-2 text-gray-600 hover:text-epr-green-600 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="font-medium">Back to Presbyteries</span>
                </button>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-epr-green-600 border-r-transparent"></div>
                        <p className="mt-4 text-gray-600">Loading presbytery details...</p>
                    </div>
                ) : presbytery ? (
                    <>
                        {/* Header Card */}
                        <div className="bg-gradient-to-r from-epr-green-600 to-epr-green-700 rounded-2xl p-8 text-white shadow-xl">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                                        <Church className="h-12 w-12" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-bold mb-2">{presbytery.name}</h1>
                                        {presbytery.location && (
                                            <p className="flex items-center gap-2 text-epr-green-100">
                                                <MapPin className="h-4 w-4" />
                                                {presbytery.location}
                                            </p>
                                        )}
                                        {presbytery.description && (
                                            <p className="mt-2 text-epr-green-100">{presbytery.description}</p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => router.push(`/presbyteries?edit=${id}`)}
                                    className="px-6 py-3 bg-white text-epr-green-600 rounded-xl font-bold hover:bg-epr-green-50 transition-all flex items-center gap-2"
                                >
                                    <Edit className="h-5 w-5" />
                                    Edit Details
                                </button>
                            </div>
                        </div>

                        {/* Statistics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-epr-green-100 rounded-xl">
                                        <Church className="h-6 w-6 text-epr-green-600" />
                                    </div>
                                    <TrendingUp className="h-5 w-5 text-green-500" />
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{statistics?.totalParishes || presbytery.totalParishes}</p>
                                <p className="text-sm text-gray-600 mt-1">Total Parishes</p>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-blue-100 rounded-xl">
                                        <Home className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <TrendingUp className="h-5 w-5 text-green-500" />
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{statistics?.totalCommunities || presbytery.totalCommunities}</p>
                                <p className="text-sm text-gray-600 mt-1">Total Communities</p>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-purple-100 rounded-xl">
                                        <Users className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <TrendingUp className="h-5 w-5 text-green-500" />
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{(statistics?.totalMembers || presbytery.totalMembers).toLocaleString()}</p>
                                <p className="text-sm text-gray-600 mt-1">Total Members</p>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-orange-100 rounded-xl">
                                        <UserCheck className="h-6 w-6 text-orange-600" />
                                    </div>
                                    <BarChart3 className="h-5 w-5 text-gray-400" />
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{statistics?.totalFamilies || 0}</p>
                                <p className="text-sm text-gray-600 mt-1">Total Families</p>
                            </div>
                        </div>

                        {/* Leadership & Contact Information */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Leadership Info */}
                            <div className="bg-white border border-gray-200 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <UserCheck className="h-5 w-5 text-epr-green-600" />
                                    Leadership Information
                                </h3>
                                <div className="space-y-4">
                                    {presbytery.leaderName ? (
                                        <>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Leader Name</p>
                                                <p className="text-gray-900 font-semibold">{presbytery.leaderName}</p>
                                            </div>
                                            {presbytery.leaderPhone && (
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Leader Phone</p>
                                                    <p className="text-gray-900 flex items-center gap-2">
                                                        <Phone className="h-4 w-4 text-gray-400" />
                                                        {presbytery.leaderPhone}
                                                    </p>
                                                </div>
                                            )}
                                            {presbytery.leaderEmail && (
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Leader Email</p>
                                                    <p className="text-gray-900 flex items-center gap-2">
                                                        <Mail className="h-4 w-4 text-gray-400" />
                                                        {presbytery.leaderEmail}
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-gray-500 italic">No leader assigned</p>
                                    )}
                                </div>
                            </div>

                            {/* Office Contact Info */}
                            <div className="bg-white border border-gray-200 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Building className="h-5 w-5 text-epr-green-600" />
                                    Office Information
                                </h3>
                                <div className="space-y-4">
                                    {presbytery.officeAddress && (
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Office Address</p>
                                            <p className="text-gray-900 flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-gray-400" />
                                                {presbytery.officeAddress}
                                            </p>
                                        </div>
                                    )}
                                    {presbytery.officePhone && (
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Office Phone</p>
                                            <p className="text-gray-900 flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-gray-400" />
                                                {presbytery.officePhone}
                                            </p>
                                        </div>
                                    )}
                                    {presbytery.officeEmail && (
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Office Email</p>
                                            <p className="text-gray-900 flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-gray-400" />
                                                {presbytery.officeEmail}
                                            </p>
                                        </div>
                                    )}
                                    {!presbytery.officeAddress && !presbytery.officePhone && !presbytery.officeEmail && (
                                        <p className="text-gray-500 italic">No office information available</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Parishes List */}
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Church className="h-5 w-5 text-epr-green-600" />
                                    Parishes ({parishes.length})
                                </h3>
                            </div>
                            {parishes.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Parish Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Code</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Communities</th>
                                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Members</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {parishes.map((parish) => (
                                                <tr key={parish.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="font-semibold text-gray-900">{parish.name}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs font-mono bg-epr-green-100 text-epr-green-700 px-2 py-1 rounded">{parish.code}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{parish.location || "—"}</td>
                                                    <td className="px-6 py-4 text-center font-semibold text-gray-900">{parish.totalCommunities}</td>
                                                    <td className="px-6 py-4 text-center font-semibold text-epr-green-600">{parish.totalMembers.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="px-6 py-12 text-center">
                                    <Church className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">No parishes registered under this presbytery yet</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-gray-500">Presbytery not found</p>
                    </div>
                )}
            </div>
        </AppShell>
    );
}
