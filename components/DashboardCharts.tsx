"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";

interface DashboardChartsProps {
    stats: {
        projectsByStatus: { status: string; count: number }[];
        usersByRole: { role: string; count: number }[];
    };
}

// Professional, muted color palette
const COLORS = [
    "#3b82f6", // Blue-500
    "#10b981", // Emerald-500
    "#f59e0b", // Amber-500
    "#ef4444", // Red-500
    "#8b5cf6", // Violet-500
    "#06b6d4", // Cyan-500
    "#ec4899", // Pink-500
];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3 rounded-lg shadow-xl text-sm">
                <p className="font-semibold text-[var(--text-primary)] mb-1">{label || payload[0].name}</p>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].fill ?? payload[0].color }} />
                    <span className="text-[var(--text-secondary)]">Count:</span>
                    <span className="font-medium text-[var(--text-primary)]">{payload[0].value}</span>
                </div>
            </div>
        );
    }
    return null;
};

export function DashboardCharts({ stats }: DashboardChartsProps) {
    if (!stats) return null;

    // Sort data for better visualization
    const projectData = [...stats.projectsByStatus].sort((a, b) => b.count - a.count);
    const roleData = [...stats.usersByRole].sort((a, b) => b.count - a.count);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Project Status Chart - Donut Style */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-sm p-6 flex flex-col">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">
                        Project Distribution
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                        Breakdown of projects by their current status
                    </p>
                </div>
                <div className="h-[300px] w-full mt-auto">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={projectData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60} // Makes it a Donut chart
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="count"
                                nameKey="status"
                                stroke="none"
                            >
                                {projectData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                formatter={(value) => <span className="text-[var(--text-secondary)] text-sm ml-1">{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* User Roles Chart - Styled Bar Chart */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-sm p-6 flex flex-col">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">
                        Team Composition
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                        Distribution of users across different roles
                    </p>
                </div>
                <div className="h-[300px] w-full mt-auto">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={roleData}
                            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" opacity={0.4} />
                            <XAxis
                                dataKey="role"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                allowDecimals={false}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-active)', opacity: 0.5 }} />
                            <Bar
                                dataKey="count"
                                name="Users"
                                radius={[6, 6, 0, 0]}
                                barSize={40}
                            >
                                {roleData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
