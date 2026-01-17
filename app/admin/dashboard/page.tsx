"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService, User } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import api from "@/lib/api";
import Link from "next/link";
import {
    Users,
    Church,
    MapPin,
    DollarSign,
    TrendingUp,
    Activity,
    Shield,
    Database,
    BarChart3,
    Settings,
    UserCog,
    FileText,
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
    overview: {
        totalUsers: number;
        activeUsers: number;
        totalPresbyteries: number;
        totalParishes: number;
        totalCommunities: number;
        totalMembers: number;
        totalContributions: number;
        totalEvents: number;
    };
    usersByRole: Array<{ role: string; count: string }>;
    presbyteryStats: Array<any>;
    recentActivity: {
        newMembers: number;
        contributions: number;
        period: string;
    };
    recentUsers: Array<any>;
    userGrowth: any[];
}

interface SystemHealth {
    status: string;
    database: string;
    timestamp: string;
    uptime: number;
}

export default function AdminDashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [health, setHealth] = useState<SystemHealth | null>(null);

    useEffect(() => {
        const currentUser = authService.getUser();
        if (!currentUser) {
            router.push("/login");
            return;
        }

        // Check if user is SUPERADMIN
        if (currentUser.role !== "SUPERADMIN") {
            router.push("/epr-dashboard");
            return;
        }

        setUser(currentUser);
        loadAdminData();
    }, [router]);

    const loadAdminData = async () => {
        setLoading(true);
        try {
            const [dashboardData, healthData, userStats] = await Promise.all([
                api.get("/admin/dashboard"),
                api.get("/admin/system-health"),
                api.get("/admin/statistics/users"),
            ]);

            const mergedStats = {
                ...dashboardData.data,
                userGrowth: userStats.data.growth ? userStats.data.growth.map((g: any) => ({
                    month: g.month,
                    count: parseInt(g.count)
                })).reverse() : [],
            };

            setStats(mergedStats);
            setHealth(healthData.data);
        } catch (error) {
            console.error("Failed to load admin data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        router.push("/login");
    };

    if (!user || user.role !== "SUPERADMIN") return null;

    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    };

    const quickActions = [
        {
            title: "User Management",
            description: "Manage all system users",
            icon: Users,
            href: "/users",
            color: "bg-blue-500",
        },
        {
            title: "Presbyteries",
            description: "Manage presbyteries",
            icon: Church,
            href: "/presbyteries",
            color: "bg-epr-green-600",
        },
        {
            title: "Parishes",
            description: "Manage parishes",
            icon: MapPin,
            href: "/parishes",
            color: "bg-epr-gold-600",
        },
        {
            title: "Members",
            description: "View all members",
            icon: UserCog,
            href: "/members",
            color: "bg-purple-600",
        },
        {
            title: "Financial Reports",
            description: "View financial data",
            icon: DollarSign,
            href: "/admin/financial-reports",
            color: "bg-green-600",
        },
        {
            title: "System Settings",
            description: "Configure system",
            icon: Settings,
            href: "/admin/settings",
            color: "bg-gray-600",
        },
    ];

    return (
        <AppShell
            title="SUPERADMIN Dashboard"
            subtitle="Complete System Administration & Monitoring"
            userName={`${user.firstName} ${user.lastName}`}
            userRole={user.role}
            onLogout={handleLogout}
        >
            <div className="max-w-[1800px] mx-auto space-y-8">
                {/* System Health Banner */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <Shield className="h-8 w-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">System Administrator</h2>
                                <p className="text-blue-100">Full access to all EPR church management features</p>
                            </div>
                        </div>
                        {health && (
                            <div className="text-right">
                                <div className="flex items-center gap-2 justify-end mb-1">
                                    <Activity className="h-5 w-5 text-green-300" />
                                    <span className="font-semibold text-lg capitalize">{health.status}</span>
                                </div>
                                <p className="text-sm text-blue-100">Uptime: {formatUptime(health.uptime)}</p>
                                <p className="text-xs text-blue-200">Database: {health.database}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Overview Statistics */}
                <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">System Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats && [
                            {
                                title: "Total Users",
                                value: stats.overview.totalUsers,
                                subtitle: `${stats.overview.activeUsers} active`,
                                icon: Users,
                                color: "bg-blue-500",
                                textColor: "text-blue-600",
                                bgColor: "bg-blue-50",
                            },
                            {
                                title: "Presbyteries",
                                value: stats.overview.totalPresbyteries,
                                subtitle: `${stats.overview.totalParishes} parishes`,
                                icon: Church,
                                color: "bg-epr-green-600",
                                textColor: "text-epr-green-600",
                                bgColor: "bg-epr-green-50",
                            },
                            {
                                title: "Communities",
                                value: stats.overview.totalCommunities,
                                subtitle: "Grassroots level",
                                icon: MapPin,
                                color: "bg-purple-600",
                                textColor: "text-purple-600",
                                bgColor: "bg-purple-50",
                            },
                            {
                                title: "Total Members",
                                value: stats.overview.totalMembers.toLocaleString(),
                                subtitle: `${stats.recentActivity.newMembers} new (30d)`,
                                icon: UserCog,
                                color: "bg-epr-gold-600",
                                textColor: "text-epr-gold-600",
                                bgColor: "bg-epr-gold-50",
                            },
                            {
                                title: "Total Contributions",
                                value: `RWF ${(stats.overview.totalContributions || 0).toLocaleString()}`,
                                subtitle: `RWF ${(stats.recentActivity.contributions || 0).toLocaleString()} (30d)`,
                                icon: DollarSign,
                                color: "bg-green-600",
                                textColor: "text-green-600",
                                bgColor: "bg-green-50",
                            },
                            {
                                title: "Total Events",
                                value: stats.overview.totalEvents,
                                subtitle: "All church events",
                                icon: BarChart3,
                                color: "bg-orange-600",
                                textColor: "text-orange-600",
                                bgColor: "bg-orange-50",
                            },
                        ].map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <div
                                    key={index}
                                    className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                                            <Icon className={`h-6 w-6 ${stat.textColor}`} />
                                        </div>
                                        <TrendingUp className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <h4 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h4>
                                    <p className="text-2xl font-bold text-gray-900 mb-1">
                                        {loading ? "..." : stat.value}
                                    </p>
                                    <p className="text-xs text-gray-500">{stat.subtitle}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Analytics Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-700">

                    {/* User Growth Chart */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">User Growth</h3>
                                <p className="text-xs text-gray-500">New User Registrations (12 Months)</p>
                            </div>
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-blue-600" />
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={stats?.userGrowth || []}
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
                                    />
                                    <Tooltip
                                        cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#2563eb"
                                        strokeWidth={3}
                                        dot={{ fill: '#2563eb', strokeWidth: 2, r: 4, stroke: '#fff' }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Role Distribution Chart */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Role Distribution</h3>
                                <p className="text-xs text-gray-500">Users by Role Assignment</p>
                            </div>
                            <div className="p-2 bg-purple-50 rounded-lg">
                                <Shield className="h-5 w-5 text-purple-600" />
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row items-center h-[300px]">
                            <div className="w-full md:w-1/2 h-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stats?.usersByRole.map((r: any) => ({ name: r.role.replace(/_/g, ' '), value: parseInt(r.count) })) || []}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {(stats?.usersByRole || []).map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed'][index % 5]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="w-full md:w-1/2 space-y-3 pl-0 md:pl-6 overflow-y-auto max-h-[250px] custom-scrollbar">
                                {stats?.usersByRole && stats.usersByRole.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed'][index % 5] }}
                                            />
                                            <span className="text-xs font-medium text-gray-700 capitalize">
                                                {item.role.replace(/_/g, " ").toLowerCase()}
                                            </span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {quickActions.map((action, index) => {
                            const Icon = action.icon;
                            return (
                                <Link
                                    key={index}
                                    href={action.href}
                                    className="group bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:border-epr-green-300"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl ${action.color} text-white group-hover:scale-110 transition-transform`}>
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900 mb-1">{action.title}</h4>
                                            <p className="text-sm text-gray-600">{action.description}</p>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Presbytery & Recent Users Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Presbytery Membership Chart */}
                    <div className="xl:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Presbytery Membership</h3>
                            <Link href="/presbyteries" className="text-sm text-epr-green-600 font-semibold hover:underline">View All</Link>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={stats?.presbyteryStats || []}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 10 }} />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={100}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#374151', fontSize: 11, fontWeight: 500 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#F3F4F6' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none' }}
                                    />
                                    <Bar dataKey="totalMembers" name="Members" fill="#059669" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recent Users */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Users</h3>
                        <div className="space-y-3">
                            {stats && stats.recentUsers && stats.recentUsers.slice(0, 5).map((recentUser, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {recentUser.firstName} {recentUser.lastName}
                                        </p>
                                        <p className="text-xs text-gray-600">{recentUser.email}</p>
                                    </div>
                                    <span className="text-[10px] font-bold text-epr-green-600 bg-epr-green-50 px-2 py-1 rounded-full border border-epr-green-100">
                                        {recentUser.role.split('_')[0]}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <Link href="/users" className="block text-center text-sm font-bold text-blue-600 hover:text-blue-700">
                                View All Users
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
