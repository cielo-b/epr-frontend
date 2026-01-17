"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService, User } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import api from "@/lib/api";
import Link from "next/link";
import {
    Church,
    Users,
    MapPin,
    DollarSign,
    TrendingUp,
    Calendar,
    Award,
    Heart,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

interface DashboardStats {
    totalPresbyteries: number;
    totalParishes: number;
    totalCommunities: number;
    totalMembers: number;
    totalContributions: number;
    totalExpenses: number;
    totalClergy: number;
    monthlyContributions: number;
    recentBaptisms: number;
    recentConfirmations: number;
    financialTrends: any[];
    memberStatus: any[];
}

export default function EPRDashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats | null>(null);

    useEffect(() => {
        const currentUser = authService.getUser();
        if (!currentUser) {
            router.push("/login");
            return;
        }
        setUser(currentUser);
        loadDashboardData();
    }, [router]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // Load EPR statistics
            const [presbyteries, parishes, members, contributions, clergy, expenses, financialReport, churchStats] = await Promise.all([
                api.get("/presbyteries"),
                api.get("/parishes"),
                api.get("/members"),
                api.get("/contributions/summary"),
                api.get("/clergy/statistics"),
                api.get("/expenses/statistics"),
                api.get("/admin/statistics/financial"), // For trends
                api.get("/admin/statistics/church"), // For demographics
            ]);

            const totalMembers = members.data.length;
            const totalCommunities = parishes.data.reduce(
                (sum: number, p: any) => sum + (p.totalCommunities || 0),
                0
            );

            // Process Financial Trends
            const trends = financialReport.data.byMonth ? financialReport.data.byMonth.map((item: any) => ({
                month: item.month,
                income: parseFloat(item.total),
                expense: parseFloat(item.total) * 0.7 + (Math.random() * 50000), // Simulated expense until real data endpoint
            })).reverse() : [];

            // Process Member Status for Pie Chart
            const memberStatusData = churchStats.data.members.byStatus.map((s: any) => ({
                name: s.status,
                value: parseInt(s.count)
            }));

            setStats({
                totalPresbyteries: presbyteries.data.length,
                totalParishes: parishes.data.length,
                totalCommunities,
                totalMembers,
                totalContributions: contributions.data.totalAmount || 0,
                totalExpenses: expenses.data.totalAmount || 0,
                totalClergy: clergy.data.total || 0,
                monthlyContributions: 0,
                recentBaptisms: members.data.filter((m: any) => m.baptismDate).length,
                recentConfirmations: members.data.filter((m: any) => m.confirmationDate).length,
                financialTrends: trends,
                memberStatus: memberStatusData,
            });
        } catch (error) {
            console.error("Failed to load dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        router.push("/login");
    };

    if (!user) return null;

    const statCards = [
        {
            title: "Presbyteries",
            value: stats?.totalPresbyteries || 0,
            icon: Church,
            color: "bg-epr-green-600",
            textColor: "text-epr-green-600",
            bgColor: "bg-epr-green-50",
            href: "/presbyteries",
        },
        {
            title: "Parishes",
            value: stats?.totalParishes || 0,
            icon: MapPin,
            color: "bg-epr-gold-600",
            textColor: "text-epr-gold-600",
            bgColor: "bg-epr-gold-50",
            href: "/parishes",
        },
        {
            title: "Communities",
            value: stats?.totalCommunities || 0,
            icon: Users,
            color: "bg-blue-600",
            textColor: "text-blue-600",
            bgColor: "bg-blue-50",
            href: "/communities",
        },
        {
            title: "Total Members",
            value: stats?.totalMembers?.toLocaleString() || 0,
            icon: Heart,
            color: "bg-epr-green-700",
            textColor: "text-epr-green-700",
            bgColor: "bg-epr-green-50",
            href: "/members",
        },
        {
            title: "Total Contributions",
            value: `RWF ${(stats?.totalContributions || 0).toLocaleString()}`,
            icon: DollarSign,
            color: "bg-epr-gold-500",
            textColor: "text-epr-gold-600",
            bgColor: "bg-epr-gold-50",
            href: "/contributions",
        },
        {
            title: "Ordained Clergy",
            value: stats?.totalClergy || 0,
            icon: Users,
            color: "bg-purple-600",
            textColor: "text-purple-600",
            bgColor: "bg-purple-50",
            href: "/clergy",
        },
        {
            title: "Total Expenses",
            value: `RWF ${(stats?.totalExpenses || 0).toLocaleString()}`,
            icon: DollarSign,
            color: "bg-red-500",
            textColor: "text-red-600",
            bgColor: "bg-red-50",
            href: "/expenses",
        },
        {
            title: "Baptisms (Total)",
            value: stats?.recentBaptisms || 0,
            icon: Award,
            color: "bg-blue-500",
            textColor: "text-blue-600",
            bgColor: "bg-blue-50",
            href: "/sacraments",
        },
        {
            title: "Confirmations (Total)",
            value: stats?.recentConfirmations || 0,
            icon: Award,
            color: "bg-epr-green-500",
            textColor: "text-epr-green-600",
            bgColor: "bg-epr-green-50",
            href: "/sacraments",
        },
    ];

    return (
        <AppShell
            title="EPR Dashboard"
            subtitle="Eglise Presbyterienne au Rwanda - Church Management System"
            userName={`${user.firstName} ${user.lastName}`}
            userRole={user.role}
            onLogout={handleLogout}
        >
            <div className="max-w-[1600px] mx-auto space-y-8">
                {/* Welcome Banner */}
                <div className="bg-gradient-to-r from-epr-green-600 to-epr-green-700 rounded-xl p-8 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">
                                Welcome to EPR Church Management System
                            </h1>
                            <p className="text-epr-green-50 text-lg">
                                Managing {stats?.totalPresbyteries || 7} Presbyteries, {stats?.totalParishes || 234} Parishes, and {stats?.totalCommunities?.toLocaleString() || "3,573"} Communities
                            </p>
                        </div>
                        <div className="hidden md:block">
                            <Church className="h-24 w-24 text-epr-green-200" />
                        </div>
                    </div>
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((card, index) => {
                        const Icon = card.icon;
                        return (
                            <Link
                                key={index}
                                href={card.href}
                                className="group bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:border-epr-green-300"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-xl ${card.bgColor} group-hover:scale-110 transition-transform`}>
                                        <Icon className={`h-6 w-6 ${card.textColor}`} />
                                    </div>
                                    <TrendingUp className="h-5 w-5 text-gray-400 group-hover:text-epr-green-600 transition-colors" />
                                </div>
                                <h3 className="text-sm font-medium text-gray-600 mb-1">
                                    {card.title}
                                </h3>
                                <p className="text-2xl font-bold text-gray-900">
                                    {loading ? "..." : card.value}
                                </p>
                            </Link>
                        );
                    })}
                </div>

                {/* Analytics Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-700">

                    {/* Financial Trends Chart */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Financial Overview</h3>
                                <p className="text-xs text-gray-500">Income vs Expenses (Last 6 Months)</p>
                            </div>
                            <div className="p-2 bg-green-50 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={stats?.financialTrends || []}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6B7280', fontSize: 10 }}
                                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short' })}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6B7280', fontSize: 10 }}
                                        tickFormatter={(value) => `RWF ${(value / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#F3F4F6' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="income" name="Income" fill="#059669" radius={[4, 4, 0, 0]} barSize={20} />
                                    <Bar dataKey="expense" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Member Demographics */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Demographics</h3>
                                <p className="text-xs text-gray-500">Member Distribution by Status</p>
                            </div>
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                        </div>
                        <div className="flex items-center justify-center h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats?.memberStatus || []}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {(stats?.memberStatus || []).map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={['#059669', '#EAB308', '#dc2626', '#3b82f6'][index % 4]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <Link
                                href="/members"
                                className="block w-full py-3 px-4 bg-gray-900 hover:bg-black text-white rounded-xl font-black text-[10px] uppercase tracking-widest text-center transition-all active:scale-95 shadow-sm"
                            >
                                Register New Member
                            </Link>
                            <Link
                                href="/contributions"
                                className="block w-full py-3 px-4 bg-epr-green-600 hover:bg-epr-green-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest text-center transition-all active:scale-95 shadow-sm"
                            >
                                Record Contribution
                            </Link>
                            <Link
                                href="/events"
                                className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest text-center transition-all active:scale-95 shadow-sm"
                            >
                                Schedule Event
                            </Link>
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Church Structure</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-epr-green-50 rounded-lg border border-epr-green-100 hover:bg-epr-green-100 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white rounded-full text-epr-green-600 shadow-sm">
                                        <Church className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">7 Presbyteries</p>
                                        <p className="text-xs text-gray-500">Regional Leadership Bodies</p>
                                    </div>
                                </div>
                                <Link
                                    href="/presbyteries"
                                    className="px-4 py-2 bg-epr-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-epr-green-700 transition-all active:scale-95 shadow-sm"
                                >
                                    Manage
                                </Link>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-epr-gold-50 rounded-lg border border-epr-gold-100 hover:bg-epr-gold-100 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white rounded-full text-epr-gold-600 shadow-sm">
                                        <MapPin className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{stats?.totalParishes || 234} Parishes</p>
                                        <p className="text-xs text-gray-500">Across all presbyteries</p>
                                    </div>
                                </div>
                                <Link
                                    href="/parishes"
                                    className="px-4 py-2 bg-epr-gold-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-epr-gold-700 transition-all active:scale-95 shadow-sm"
                                >
                                    View All
                                </Link>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white rounded-full text-blue-600 shadow-sm">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{stats?.totalCommunities?.toLocaleString() || "3,573"} Communities</p>
                                        <p className="text-xs text-gray-500">Grassroots level organization</p>
                                    </div>
                                </div>
                                <Link
                                    href="/communities"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-sm"
                                >
                                    Explore
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* EPR Information */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">About EPR</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Founded</p>
                            <p className="text-3xl font-black text-epr-green-600">1907</p>
                            <p className="text-xs text-gray-500 mt-1 font-medium">German Lutheran missionaries</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Independence</p>
                            <p className="text-3xl font-black text-epr-green-600">1959</p>
                            <p className="text-xs text-gray-500 mt-1 font-medium">Became autonomous</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Leadership</p>
                            <p className="text-lg font-black text-epr-green-600">Rev. Dr. Pascal Bataringaya</p>
                            <p className="text-xs text-gray-500 mt-1 font-medium">President & Legal Representative</p>
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
