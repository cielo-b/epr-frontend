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
    Calendar as CalendarIcon,
    Clock,
    MapPin,
    Users,
    Plus,
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    Edit,
    Trash2,
    X,
    Target,
    CheckCircle2,
    Bell,
    Search,
    LayoutList,
    CalendarDays
} from "lucide-react";

interface ChurchEvent {
    id: string;
    title: string;
    description?: string;
    type: string;
    startDate: string;
    endDate: string;
    location?: string;
    parishId?: string;
    expectedAttendees: number;
    actualAttendees: number;
    status: "PLANNED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "POSTPONED";
    isRecurring: boolean;
    notes?: string;
    speakers?: string[];
}

export default function EventsPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState<ChurchEvent[]>([]);
    const [parishes, setParishes] = useState<any[]>([]);

    const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
    const [currentDate, setCurrentDate] = useState(new Date());

    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<ChurchEvent | null>(null);
    const { addToast } = useToast();
    const [confirmDelete, setConfirmDelete] = useState<{ id: string; isOpen: boolean }>({ id: "", isOpen: false });
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        type: "WORSHIP",
        startDate: "",
        endDate: "",
        location: "",
        parishId: "",
        expectedAttendees: 0,
        status: "PLANNED",
        isRecurring: false,
        notes: "",
        speakers: "" as any,
    });

    useEffect(() => {
        const currentUser = authService.getUser();
        if (!currentUser) {
            router.push("/login");
            return;
        }
        setUser(currentUser);
        loadInitialData();
    }, [router, currentDate]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            const [eventsRes, parishesRes] = await Promise.all([
                api.get(`/events/calendar/${year}/${month}`),
                api.get("/parishes"),
            ]);
            setEvents(eventsRes.data);
            setParishes(parishesRes.data);
        } catch (error) {
            console.error("Failed to load events:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                speakers: typeof formData.speakers === "string" ? formData.speakers.split(",").map(s => s.trim()) : formData.speakers
            };

            if (editingEvent) {
                await api.patch(`/events/${editingEvent.id}`, payload);
            } else {
                await api.post("/events", payload);
            }
            setShowModal(false);
            resetForm();
            loadInitialData();
            addToast(`Event ${editingEvent ? 'updated' : 'scheduled'} successfully`, "success");
        } catch (error: any) {
            addToast(error.response?.data?.message || "Operation failed", "error");
        }
    };

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            type: "WORSHIP",
            startDate: "",
            endDate: "",
            location: "",
            parishId: "",
            expectedAttendees: 0,
            status: "PLANNED",
            isRecurring: false,
            notes: "",
            speakers: "",
        });
        setEditingEvent(null);
    };

    const handleEdit = (event: ChurchEvent) => {
        setEditingEvent(event);
        setFormData({
            title: event.title,
            description: event.description || "",
            type: event.type,
            startDate: event.startDate.substring(0, 16),
            endDate: event.endDate.substring(0, 16),
            location: event.location || "",
            parishId: event.parishId || "",
            expectedAttendees: event.expectedAttendees,
            status: event.status,
            isRecurring: event.isRecurring,
            notes: event.notes || "",
            speakers: event.speakers?.join(", ") || "",
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        try {
            setIsActionLoading(true);
            await api.delete(`/events/${id}`);
            setConfirmDelete({ id: "", isOpen: false });
            loadInitialData();
            addToast("Event removed from calendar", "success");
        } catch (error) {
            addToast("Failed to cancel event", "error");
        } finally {
            setIsActionLoading(false);
        }
    };

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];

        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-32 bg-gray-50/50 border border-gray-100"></div>);
        }

        // Days with events
        for (let d = 1; d <= daysInMonth; d++) {
            const dayEvents = events.filter(e => {
                const date = new Date(e.startDate);
                return date.getDate() === d && date.getMonth() === month && date.getFullYear() === year;
            });

            days.push(
                <div key={d} className="h-32 border border-gray-100 p-2 overflow-y-auto hover:bg-epr-green-50/20 transition-colors">
                    <div className="flex justify-between items-center mb-1">
                        <span className={`text-xs font-bold ${dayEvents.length > 0 ? 'text-epr-green-700 bg-epr-green-100 w-6 h-6 rounded-full flex items-center justify-center' : 'text-gray-400'}`}>
                            {d}
                        </span>
                    </div>
                    <div className="space-y-1">
                        {dayEvents.map(e => (
                            <button
                                key={e.id}
                                onClick={() => handleEdit(e)}
                                className="w-full text-left p-1 rounded bg-white border border-epr-green-100 shadow-sm hover:border-epr-green-300 transition-all group"
                            >
                                <p className="text-[10px] font-bold text-gray-800 truncate mb-1">{e.title}</p>
                                <div className="flex items-center gap-1">
                                    <Clock className="h-2 w-2 text-gray-400" />
                                    <span className="text-[8px] text-gray-500">{new Date(e.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        return days;
    };

    const getStatusBadge = (status: string) => {
        const styles: any = {
            PLANNED: "bg-gray-100 text-gray-700",
            CONFIRMED: "bg-blue-100 text-blue-700",
            IN_PROGRESS: "bg-yellow-100 text-yellow-700",
            COMPLETED: "bg-green-100 text-green-700",
            CANCELLED: "bg-red-100 text-red-700",
        };
        return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${styles[status] || styles.PLANNED}`}>{status}</span>;
    };

    if (!user) return null;

    return (
        <AppShell
            title="Event Management"
            subtitle="Church calendar, schedules, and attendance tracking"
            userName={`${user.firstName} ${user.lastName}`}
            userRole={user.role}
            onLogout={() => { authService.logout(); router.push("/login"); }}
        >
            <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row justify-between items-center bg-white border border-gray-100 p-4 rounded-xl shadow-sm gap-4">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-gray-900 min-w-[200px]">
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h2>
                        <div className="flex p-1 bg-gray-100 rounded-lg">
                            <button
                                onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                                className="p-2 hover:bg-white rounded-md transition-all text-gray-600 hover:text-epr-green-600"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => setCurrentDate(new Date())}
                                className="px-3 text-xs font-bold text-gray-600 hover:text-epr-green-600 border-x border-gray-200"
                            >
                                Today
                            </button>
                            <button
                                onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                                className="p-2 hover:bg-white rounded-md transition-all text-gray-600 hover:text-epr-green-600"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="flex p-1 bg-gray-100 rounded-lg shadow-inner">
                            <button
                                onClick={() => setViewMode("calendar")}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-bold ${viewMode === "calendar" ? "bg-white text-epr-green-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                            >
                                <CalendarDays className="h-4 w-4" />
                                Calendar
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-bold ${viewMode === "list" ? "bg-white text-epr-green-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                            >
                                <LayoutList className="h-4 w-4" />
                                List View
                            </button>
                        </div>
                        <button
                            onClick={() => { resetForm(); setShowModal(true); }}
                            className="btn-epr"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Add Event
                        </button>
                    </div>
                </div>

                {/* View Content */}
                {loading ? (
                    <div className="py-20 flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-epr-green-100 border-t-epr-green-600 mb-4"></div>
                        <p className="text-gray-500 font-medium tracking-wide">Syncing calendar records...</p>
                    </div>
                ) : viewMode === "calendar" ? (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">{day}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7">
                            {renderCalendar()}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map(event => (
                            <div key={event.id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-epr-green-50 rounded-lg">
                                        <CalendarIcon className="h-6 w-6 text-epr-green-600" />
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleEdit(event)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => setConfirmDelete({ id: event.id, isOpen: true })} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-epr-green-700 transition-colors mb-2">{event.title}</h3>
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Clock className="h-4 w-4 text-gray-400" />
                                        {new Date(event.startDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        {event.location || "Online / TBD"}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    {getStatusBadge(event.status)}
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                                        <Users className="h-3.5 w-3.5" />
                                        {event.expectedAttendees} expected
                                    </div>
                                </div>
                            </div>
                        ))}
                        {events.length === 0 && (
                            <div className="col-span-full py-20 text-center bg-white border border-dashed border-gray-200 rounded-xl">
                                <Bell className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">No events scheduled for this month.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Event Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="sticky top-0 bg-white/90 backdrop-blur-md px-8 py-6 border-b border-gray-50 flex justify-between items-center z-10">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{editingEvent ? "Modify Gathering" : "Schedule Event"}</h2>
                                <p className="text-sm text-gray-500">Coordinate ecclesiastical activities and meetings</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)] p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Event Title *</label>
                                    <input
                                        type="text" required
                                        placeholder="e.g. Annual General Conference 2026"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-epr-green-500/10 focus:bg-white focus:border-epr-green-500 transition-all outline-none font-semibold"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Nature of Event</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-epr-green-500/10 focus:bg-white focus:border-epr-green-500 transition-all outline-none"
                                    >
                                        <option value="WORSHIP">Worship Service</option>
                                        <option value="MEETING">Committees & Council</option>
                                        <option value="CONFERENCE">National Conference</option>
                                        <option value="RETREAT">Spiritual Retreat</option>
                                        <option value="TRAINING">Leader Training</option>
                                        <option value="WEDDING">Holy Matrimony</option>
                                        <option value="BAPTISM">Holy Baptism</option>
                                        <option value="OTHER">Other Activity</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Event Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-epr-green-500/10 focus:bg-white focus:border-epr-green-500 transition-all outline-none"
                                    >
                                        <option value="PLANNED">Planned</option>
                                        <option value="CONFIRMED">Confirmed</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="COMPLETED">Completed</option>
                                        <option value="CANCELLED">Cancelled</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Start Time *</label>
                                    <input
                                        type="datetime-local" required
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-epr-green-500/10 focus:bg-white focus:border-epr-green-500 transition-all outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">End Time *</label>
                                    <input
                                        type="datetime-local" required
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-epr-green-500/10 focus:bg-white focus:border-epr-green-500 transition-all outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Venue / Platform</label>
                                    <input
                                        type="text"
                                        placeholder="Physical address or Zoom link"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-epr-green-500/10 focus:bg-white focus:border-epr-green-500 transition-all outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Target Parish</label>
                                    <select
                                        value={formData.parishId}
                                        onChange={(e) => setFormData({ ...formData, parishId: e.target.value })}
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-epr-green-500/10 focus:bg-white focus:border-epr-green-500 transition-all outline-none"
                                    >
                                        <option value="">National / Multi-Parish</option>
                                        {parishes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Key Speakers / Ministers (comma separated)</label>
                                    <input
                                        type="text"
                                        placeholder="Rev. Dr. Pascal, Bishop Jane Doe, etc."
                                        value={formData.speakers}
                                        onChange={(e) => setFormData({ ...formData, speakers: e.target.value })}
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-epr-green-500/10 focus:bg-white focus:border-epr-green-500 transition-all outline-none"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Detailed Agenda / Brief</label>
                                    <textarea
                                        rows={4}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-epr-green-500/10 focus:bg-white focus:border-epr-green-500 transition-all outline-none resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6 pb-2 border-t border-gray-100 mt-6">
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
                                    CONFIRM SCHEDULE
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmDelete.isOpen}
                title="Cancel Event"
                message="Are you sure you want to remove this event from the calendar? This will notify any registered attendees and cannot be undone."
                type="danger"
                onConfirm={() => handleDelete(confirmDelete.id)}
                onCancel={() => setConfirmDelete({ id: "", isOpen: false })}
                confirmText="Cancel Event"
                isLoading={isActionLoading}
            />
        </AppShell>
    );
}
