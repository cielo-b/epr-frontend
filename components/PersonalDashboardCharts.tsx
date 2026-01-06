"use client";

import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";

interface PersonalChartsProps {
    tasksByStatus: { status: string; count: number }[];
}

const COLORS = [
    "#10b981", // Emerald-500 (Completed/Success)
    "#3b82f6", // Blue-500 (In Progress)
    "#f59e0b", // Amber-500 (Pending/Open)
    "#ef4444", // Red-500 (On Hold/Error)
    "#6b7280", // Gray-500 (Other)
];

const STATUS_MAP: Record<string, string> = {
    "COMPLETED": "Done",
    "IN_PROGRESS": "Working",
    "OPEN": "To Do",
    "ON_HOLD": "Blocked",
    "BACKLOG": "Later"
};

export function PersonalDashboardCharts({ tasksByStatus }: PersonalChartsProps) {
    const data = tasksByStatus.map(t => ({
        name: STATUS_MAP[t.status] || t.status,
        value: t.count,
        originalStatus: t.status
    }));

    return (
        <div className="bg-white border border-brand-green-100 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-6">Task Composition</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={90}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            align="center"
                            iconType="circle"
                            formatter={(value) => <span className="text-xs font-bold text-gray-600">{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
