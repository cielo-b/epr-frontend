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
    Home,
    Calendar,
    User as UserIcon
} from "lucide-react";

interface Parish {
    id: string;
    name: string;
    code: string;
    description?: string;
    presbyteryId: string;
    location?: string;
    district?: string;
    sector?: string;
    pastorName?: string;
    pastorEmail?: string;
    pastorPhone?: string;
    administratorName?: string;
    churchAddress?: string;
    churchPhone?: string;
    churchEmail?: string;
    foundedDate?: string;
    totalCommunities: number;
    totalMembers: number;
    isActive: boolean;
    presbytery?: {
        id: string;
        name: string;
    };
}

interface Community {
    id: string;
    name: string;
    code: string;
    location?: string;
    totalMembers: number;
    totalFamilies: number;
}

interface Statistics {
    totalCommunities: number;
    totalMembers: number;
    totalBaptisms: number;
    totalConfirmations: number;
    totalMarriages: number;
}

export default function ParishDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [parish, setParish] = useState<Parish | null>(null);
    const [communities, setCommunities] = useState<Community[]>([]);
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
            const [parishRes, statisticsRes] = await Promise.all([
                api.get(`/parishes/${id}`),
                api.get(`/parishes/${id}/statistics`),
            ]);
            setParish(parishRes.data);
            setStatistics(statisticsRes.data);

            // Load communities for this parish
            const communitiesRes = await api.get(`/communities?parishId=${id}`);
            setCommunities(communitiesRes.data);
        } catch (error: any) {
            console.error("Failed to load parish details:", error);
            if (error.response?.status === 404) {
                addToast("Parish not found", "error");
                router.push("/parishes");
            } else {
                addToast("Failed to load parish details", "error");
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
            title={parish?.name || "Parish Details"}
            subtitle="Detailed information and statistics"
            userName={`${user.firstName} ${user.lastName}`}
            userRole={user.role}
            onLogout={handleLogout}
        >
            <div className="max-w-[1600px] mx-auto space-y-6">
                {/* Back Button */}
                <button
                    onClick={() => router.push("/parishes")}
                    className="flex items-center gap-2 text-gray-600 hover:text-epr-green-600 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="font-medium">Back to Parishes</span>
                </button>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-epr-green-600 border-r-transparent"></div>
                        <p className="mt-4 text-gray-600">Loading parish details...</p>
                    </div>
                ) : parish ? (
                    <>
                        {/* Header Card */}
                        <div className="bg-gradient-to-r from-epr-green-600 to-epr-green-700 rounded-2xl p-8 text-white shadow-xl">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                                        <Church className="h-12 w-12" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h1 className="text-3xl font-bold">{parish.name}</h1>
                                            <span className="px-3 py-1 bg-white/20 rounded-lg text-sm font-mono backdrop-blur-sm">
                                                {parish.code}
                                            </span>
                                        </div>
                                        {parish.location && (
                                            <p className="flex items-center gap-2 text-epr-green-100">
                                                <MapPin className="h-4 w-4" />
                                                {parish.location}
                                                {parish.district && `, ${parish.district}`}
                                                {parish.sector && `, ${parish.sector}`}
                                            </p>
                                        )}
                                        {parish.description && (
                                            <p className="mt-2 text-epr-green-100">{parish.description}</p>
                                        )}
                                        {parish.presbytery && (
                                            <p className="mt-2 text-epr-green-100 text-sm">
                                                Presbytery: <span className="font-semibold">{parish.presbytery.name}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => router.push(`/parishes?edit=${id}`)}
                                    className="px-6 py-3 bg-white text-epr-green-600 rounded-xl font-bold hover:bg-epr-green-50 transition-all flex items-center gap-2"
                                >
                                    <Edit className="h-5 w-5" />
                                    Edit Details
                                </button>
                            </div>
                        </div>

                        {/* Statistics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-blue-100 rounded-xl">
                                        <Home className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <TrendingUp className="h-5 w-5 text-green-500" />
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{statistics?.totalCommunities || parish.totalCommunities}</p>
                                <p className="text-sm text-gray-600 mt-1">Total Communities</p>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-purple-100 rounded-xl">
                                        <Users className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <TrendingUp className="h-5 w-5 text-green-500" />
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{(statistics?.totalMembers || parish.totalMembers).toLocaleString()}</p>
                                <p className="text-sm text-gray-600 mt-1">Total Members</p>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-green-100 rounded-xl">
                                        <UserCheck className="h-6 w-6 text-green-600" />
                                    </div>
                                    <BarChart3 className="h-5 w-5 text-gray-400" />
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{statistics?.totalBaptisms || 0}</p>
                                <p className="text-sm text-gray-600 mt-1">Total Baptisms</p>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-orange-100 rounded-xl">
                                        <UserCheck className="h-6 w-6 text-orange-600" />
                                    </div>
                                    <BarChart3 className="h-5 w-5 text-gray-400" />
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{statistics?.totalConfirmations || 0}</p>
                                <p className="text-sm text-gray-600 mt-1">Confirmations</p>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-pink-100 rounded-xl">
                                        <UserCheck className="h-6 w-6 text-pink-600" />
                                    </div>
                                    <BarChart3 className="h-5 w-5 text-gray-400" />
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{statistics?.totalMarriages || 0}</p>
                                <p className="text-sm text-gray-600 mt-1">Marriages</p>
                            </div>
                        </div>

                        {/* Leadership & Contact Information */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Pastor Information */}
                            <div className="bg-white border border-gray-200 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <UserIcon className="h-5 w-5 text-epr-green-600" />
                                    Pastor Information
                                </h3>
                                <div className="space-y-4">
                                    {parish.pastorName ? (
                                        <>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Pastor Name</p>
                                                <p className="text-gray-900 font-semibold">{parish.pastorName}</p>
                                            </div>
                                            {parish.pastorPhone && (
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Pastor Phone</p>
                                                    <p className="text-gray-900 flex items-center gap-2">
                                                        <Phone className="h-4 w-4 text-gray-400" />
                                                        {parish.pastorPhone}
                                                    </p>
                                                </div>
                                            )}
                                            {parish.pastorEmail && (
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Pastor Email</p>
                                                    <p className="text-gray-900 flex items-center gap-2">
                                                        <Mail className="h-4 w-4 text-gray-400" />
                                                        {parish.pastorEmail}
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-gray-500 italic">No pastor assigned</p>
                                    )}
                                </div>
                            </div>

                            {/* Church Contact Info */}
                            <div className="bg-white border border-gray-200 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Building className="h-5 w-5 text-epr-green-600" />
                                    Church Contact Information
                                </h3>
                                <div className="space-y-4">
                                    {parish.churchAddress && (
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Church Address</p>
                                            <p className="text-gray-900 flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-gray-400" />
                                                {parish.churchAddress}
                                            </p>
                                        </div>
                                    )}
                                    {parish.churchPhone && (
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Church Phone</p>
                                            <p className="text-gray-900 flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-gray-400" />
                                                {parish.churchPhone}
                                            </p>
                                        </div>
                                    )}
                                    {parish.churchEmail && (
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Church Email</p>
                                            <p className="text-gray-900 flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-gray-400" />
                                                {parish.churchEmail}
                                            </p>
                                        </div>
                                    )}
                                    {!parish.churchAddress && !parish.churchPhone && !parish.churchEmail && (
                                        <p className="text-gray-500 italic">No church contact information available</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Additional Information */}
                        {(parish.administratorName || parish.foundedDate) && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {parish.administratorName && (
                                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <UserCheck className="h-5 w-5 text-epr-green-600" />
                                            Administrator
                                        </h3>
                                        <p className="text-gray-900 font-semibold">{parish.administratorName}</p>
                                    </div>
                                )}
                                {parish.foundedDate && (
                                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <Calendar className="h-5 w-5 text-epr-green-600" />
                                            Founded Date
                                        </h3>
                                        <p className="text-gray-900 font-semibold">
                                            {new Date(parish.foundedDate).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Communities List */}
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Home className="h-5 w-5 text-epr-green-600" />
                                    Communities ({communities.length})
                                </h3>
                            </div>
                            {communities.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Community Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Code</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Families</th>
                                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Members</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {communities.map((community) => (
                                                <tr key={community.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="font-semibold text-gray-900">{community.name}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs font-mono bg-epr-green-100 text-epr-green-700 px-2 py-1 rounded">{community.code}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{community.location || "—"}</td>
                                                    <td className="px-6 py-4 text-center font-semibold text-gray-900">{community.totalFamilies || 0}</td>
                                                    <td className="px-6 py-4 text-center font-semibold text-epr-green-600">{community.totalMembers.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="px-6 py-12 text-center">
                                    <Home className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">No communities registered under this parish yet</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-gray-500">Parish not found</p>
                    </div>
                )}
            </div>
        </AppShell>
    );
}
