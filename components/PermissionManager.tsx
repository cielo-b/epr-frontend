"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Plus, X, Eye, Edit, Trash, Download, Upload, Lock, Calendar, AlertCircle } from "lucide-react";

interface Permission {
    id: string;
    resource: string;
    action: string;
    resourceId?: string;
    constraints?: any;
    expiresAt?: string;
    createdAt: string;
    grantedBy: string;
}

interface PermissionManagerProps {
    userId: string;
    userName: string;
}

const RESOURCES = ["PROJECT", "TASK", "DOCUMENT", "REPORT", "COMMENT", "ACTIVITY"];
const ACTIONS = ["VIEW", "CREATE", "UPDATE", "DELETE", "DOWNLOAD", "UPLOAD", "ASSIGN"];

export default function PermissionManager({ userId, userName }: PermissionManagerProps) {
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);

    useEffect(() => {
        loadPermissions();
        loadProjects();
    }, [userId]);

    const loadPermissions = async () => {
        try {
            const response = await api.get(`/permissions/user/${userId}`);
            setPermissions(response.data);
        } catch (error) {
            console.error("Failed to load permissions", error);
        } finally {
            setLoading(false);
        }
    };

    const loadProjects = async () => {
        try {
            const response = await api.get("/projects");
            setProjects(response.data);
        } catch (error) {
            console.error("Failed to load projects", error);
        }
    };

    const handleAddPermission = async (permission: Omit<Permission, "id" | "createdAt" | "grantedBy">) => {
        try {
            await api.post("/permissions", {
                userId,
                ...permission,
            });
            await loadPermissions();
            setShowAddForm(false);
        } catch (error: any) {
            alert(error.response?.data?.message || "Failed to add permission");
        }
    };

    const handleDeletePermission = async (permissionId: string) => {
        if (!confirm("Are you sure you want to remove this permission?")) return;

        try {
            await api.delete(`/permissions/${permissionId}`);
            await loadPermissions();
        } catch (error: any) {
            alert(error.response?.data?.message || "Failed to delete permission");
        }
    };

    const handleDeleteAllPermissions = async () => {
        if (!confirm(`Are you sure you want to remove ALL permissions for ${userName}?`)) return;

        try {
            await api.delete(`/permissions/user/${userId}`);
            await loadPermissions();
        } catch (error: any) {
            alert(error.response?.data?.message || "Failed to delete permissions");
        }
    };

    const getResourceIcon = (resource: string) => {
        // Return appropriate icon based on resource type
        return <Lock className="h-4 w-4" />;
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case "VIEW":
                return <Eye className="h-4 w-4" />;
            case "CREATE":
                return <Plus className="h-4 w-4" />;
            case "UPDATE":
                return <Edit className="h-4 w-4" />;
            case "DELETE":
                return <Trash className="h-4 w-4" />;
            case "DOWNLOAD":
                return <Download className="h-4 w-4" />;
            case "UPLOAD":
                return <Upload className="h-4 w-4" />;
            default:
                return <Lock className="h-4 w-4" />;
        }
    };

    const isExpired = (expiresAt?: string) => {
        if (!expiresAt) return false;
        return new Date(expiresAt) < new Date();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Permissions for {userName}</h3>
                    <p className="text-sm text-gray-600">{permissions.length} permission(s) granted</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm"
                    >
                        <Plus className="h-4 w-4" />
                        Add Permission
                    </button>
                    {permissions.length > 0 && (
                        <button
                            onClick={handleDeleteAllPermissions}
                            className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 text-sm"
                        >
                            Remove All
                        </button>
                    )}
                </div>
            </div>

            {/* Add Permission Form */}
            {showAddForm && (
                <AddPermissionForm
                    projects={projects}
                    onAdd={handleAddPermission}
                    onCancel={() => setShowAddForm(false)}
                />
            )}

            {/* Permissions List */}
            {permissions.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <Lock className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600 font-medium">No permissions granted</p>
                    <p className="text-sm text-gray-500 mt-1">This user has no access to any resources</p>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                        Grant First Permission
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    {permissions.map((permission) => (
                        <div
                            key={permission.id}
                            className={`border rounded-lg p-4 ${isExpired(permission.expiresAt)
                                    ? "bg-red-50 border-red-200"
                                    : "bg-white border-gray-200"
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium">
                                            {getActionIcon(permission.action)}
                                            {permission.action}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-sm font-medium">
                                            {getResourceIcon(permission.resource)}
                                            {permission.resource}
                                        </span>
                                        {permission.resourceId && (
                                            <span className="text-sm text-gray-600">
                                                (Specific: {getResourceName(permission.resourceId, permission.resource, projects)})
                                            </span>
                                        )}
                                        {isExpired(permission.expiresAt) && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                                                <AlertCircle className="h-3 w-3" />
                                                EXPIRED
                                            </span>
                                        )}
                                    </div>

                                    {/* Constraints */}
                                    {permission.constraints && Object.keys(permission.constraints).length > 0 && (
                                        <div className="mt-2 text-sm text-gray-600">
                                            <span className="font-medium">Constraints:</span>
                                            {permission.constraints.tabs && (
                                                <span className="ml-2">
                                                    Tabs: {permission.constraints.tabs.join(", ")}
                                                </span>
                                            )}
                                            {permission.constraints.fields && (
                                                <span className="ml-2">
                                                    Fields: {permission.constraints.fields.join(", ")}
                                                </span>
                                            )}
                                            {permission.constraints.readonly && (
                                                <span className="ml-2 text-orange-600">(Read-only)</span>
                                            )}
                                        </div>
                                    )}

                                    {/* Metadata */}
                                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                                        <span>Granted: {new Date(permission.createdAt).toLocaleDateString()}</span>
                                        {permission.expiresAt && (
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                Expires: {new Date(permission.expiresAt).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleDeletePermission(permission.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    title="Remove permission"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function AddPermissionForm({
    projects,
    onAdd,
    onCancel,
}: {
    projects: any[];
    onAdd: (permission: any) => void;
    onCancel: () => void;
}) {
    const [resource, setResource] = useState("PROJECT");
    const [action, setAction] = useState("VIEW");
    const [resourceId, setResourceId] = useState("");
    const [expiresAt, setExpiresAt] = useState("");
    const [tabs, setTabs] = useState<string[]>([]);
    const [readonly, setReadonly] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd({
            resource,
            action,
            resourceId: resourceId || undefined,
            expiresAt: expiresAt || undefined,
            constraints:
                tabs.length > 0 || readonly
                    ? {
                        tabs: tabs.length > 0 ? tabs : undefined,
                        readonly: readonly || undefined,
                    }
                    : undefined,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Add New Permission</h4>
            <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
                    <select
                        value={resource}
                        onChange={(e) => setResource(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                        {RESOURCES.map((r) => (
                            <option key={r} value={r}>
                                {r}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                    <select
                        value={action}
                        onChange={(e) => setAction(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                        {ACTIONS.map((a) => (
                            <option key={a} value={a}>
                                {a}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Specific {resource} (Optional)
                    </label>
                    <select
                        value={resourceId}
                        onChange={(e) => setResourceId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                        <option value="">All {resource}s</option>
                        {resource === "PROJECT" &&
                            projects.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                    </select>
                </div>
            </div>

            <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiration Date (Optional)
                </label>
                <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                />
            </div>

            <div className="flex gap-3">
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                    Add Permission
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}

function getResourceName(resourceId: string, resourceType: string, projects: any[]): string {
    if (resourceType === "PROJECT") {
        const project = projects.find((p) => p.id === resourceId);
        return project?.name || resourceId.substring(0, 8);
    }
    return resourceId.substring(0, 8);
}
