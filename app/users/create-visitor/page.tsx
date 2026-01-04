"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Plus, X, Calendar, Lock, Eye, Edit, Trash, Download, Upload, UserPlus } from "lucide-react";

interface Permission {
    resource: string;
    action: string;
    resourceId?: string;
    constraints?: {
        tabs?: string[];
        fields?: string[];
        readonly?: boolean;
    };
    expiresAt?: string;
}

interface PermissionTemplate {
    name: string;
    description: string;
    permissions: Permission[];
}

const PERMISSION_TEMPLATES: PermissionTemplate[] = [
    {
        name: "Read-Only Auditor",
        description: "Can view all projects, tasks, and documents but cannot edit anything",
        permissions: [
            { resource: "PROJECT", action: "VIEW" },
            { resource: "TASK", action: "VIEW" },
            { resource: "DOCUMENT", action: "VIEW" },
            { resource: "DOCUMENT", action: "DOWNLOAD" },
            { resource: "REPORT", action: "VIEW" },
        ],
    },
    {
        name: "Report Submitter",
        description: "Can only create and view their own reports",
        permissions: [
            { resource: "REPORT", action: "CREATE" },
            { resource: "REPORT", action: "VIEW", constraints: { readonly: true } },
        ],
    },
    {
        name: "Document Manager",
        description: "Full document management for specific projects",
        permissions: [
            { resource: "DOCUMENT", action: "VIEW" },
            { resource: "DOCUMENT", action: "CREATE" },
            { resource: "DOCUMENT", action: "UPDATE" },
            { resource: "DOCUMENT", action: "DELETE" },
            { resource: "DOCUMENT", action: "UPLOAD" },
            { resource: "DOCUMENT", action: "DOWNLOAD" },
        ],
    },
    {
        name: "Custom",
        description: "Build your own permission set",
        permissions: [],
    },
];

const RESOURCES = ["PROJECT", "TASK", "DOCUMENT", "REPORT", "COMMENT", "ACTIVITY"];
const ACTIONS = ["VIEW", "CREATE", "UPDATE", "DELETE", "DOWNLOAD", "UPLOAD", "ASSIGN"];
const PROJECT_TABS = ["details", "tasks", "documents", "comments", "activity"];
const TASK_FIELDS = ["title", "description", "status", "priority", "dueDate", "assignees"];

export default function CreateVisitorPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<string>("Custom");
    const [showAdvanced, setShowAdvanced] = useState(false);

    // User details
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [password, setPassword] = useState("");

    // Permissions
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [projects, setProjects] = useState<any[]>([]);

    // Load projects for selection
    useState(() => {
        api.get("/projects").then((res) => setProjects(res.data)).catch(console.error);
    });

    const handleTemplateSelect = (templateName: string) => {
        setSelectedTemplate(templateName);
        const template = PERMISSION_TEMPLATES.find((t) => t.name === templateName);
        if (template) {
            setPermissions([...template.permissions]);
        }
    };

    const addPermission = () => {
        setPermissions([
            ...permissions,
            { resource: "PROJECT", action: "VIEW" },
        ]);
    };

    const updatePermission = (index: number, updates: Partial<Permission>) => {
        const newPermissions = [...permissions];
        newPermissions[index] = { ...newPermissions[index], ...updates };
        setPermissions(newPermissions);
    };

    const removePermission = (index: number) => {
        setPermissions(permissions.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Create user
            const userResponse = await api.post("/users", {
                email,
                firstName,
                lastName,
                password,
                role: "VISITOR",
            });

            const userId = userResponse.data.id;

            // Create permissions
            if (permissions.length > 0) {
                await api.post("/permissions/bulk", {
                    userId,
                    permissions,
                });
            }

            alert("Visitor user created successfully!");
            router.push("/users");
        } catch (error: any) {
            alert(error.response?.data?.message || "Failed to create visitor");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Create Visitor User</h1>
                <p className="text-sm text-gray-600 mt-1">
                    Create a visitor with customized permissions
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* User Details */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-blue-600" />
                        User Information
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                First Name *
                            </label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Last Name *
                            </label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email *
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password *
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Permission Templates */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Lock className="h-5 w-5 text-blue-600" />
                        Permission Template
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                        {PERMISSION_TEMPLATES.map((template) => (
                            <button
                                key={template.name}
                                type="button"
                                onClick={() => handleTemplateSelect(template.name)}
                                className={`p-4 rounded-lg border-2 text-left transition-all ${selectedTemplate === template.name
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-200 hover:border-gray-300"
                                    }`}
                            >
                                <div className="font-medium text-gray-900">{template.name}</div>
                                <div className="text-sm text-gray-600 mt-1">{template.description}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom Permissions */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Lock className="h-5 w-5 text-blue-600" />
                            Permissions ({permissions.length})
                        </h2>
                        <button
                            type="button"
                            onClick={addPermission}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1 text-sm"
                        >
                            <Plus className="h-4 w-4" />
                            Add Permission
                        </button>
                    </div>

                    {permissions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Lock className="h-12 w-12 mx-auto mb-2 opacity-30" />
                            <p>No permissions added yet</p>
                            <p className="text-sm">Select a template or add custom permissions</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {permissions.map((permission, index) => (
                                <PermissionRow
                                    key={index}
                                    permission={permission}
                                    projects={projects}
                                    onUpdate={(updates) => updatePermission(index, updates)}
                                    onRemove={() => removePermission(index)}
                                    showAdvanced={showAdvanced}
                                />
                            ))}
                        </div>
                    )}

                    {permissions.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="mt-4 text-sm text-blue-600 hover:text-blue-700"
                        >
                            {showAdvanced ? "Hide" : "Show"} Advanced Options
                        </button>
                    )}
                </div>

                {/* Submit */}
                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        {loading ? "Creating..." : "Create Visitor User"}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}

function PermissionRow({
    permission,
    projects,
    onUpdate,
    onRemove,
    showAdvanced,
}: {
    permission: Permission;
    projects: any[];
    onUpdate: (updates: Partial<Permission>) => void;
    onRemove: () => void;
    showAdvanced: boolean;
}) {
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

    return (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="grid grid-cols-12 gap-3 items-start">
                {/* Resource */}
                <div className="col-span-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Resource</label>
                    <select
                        value={permission.resource}
                        onChange={(e) => onUpdate({ resource: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                    >
                        {RESOURCES.map((r) => (
                            <option key={r} value={r}>
                                {r}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Action */}
                <div className="col-span-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Action</label>
                    <select
                        value={permission.action}
                        onChange={(e) => onUpdate({ action: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                    >
                        {ACTIONS.map((a) => (
                            <option key={a} value={a}>
                                {getActionIcon(a)} {a}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Specific Resource */}
                <div className="col-span-5">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Specific {permission.resource} (Optional)
                    </label>
                    <select
                        value={permission.resourceId || ""}
                        onChange={(e) => onUpdate({ resourceId: e.target.value || undefined })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                    >
                        <option value="">All {permission.resource}s</option>
                        {permission.resource === "PROJECT" &&
                            projects.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                    </select>
                </div>

                {/* Remove */}
                <div className="col-span-1 flex items-end">
                    <button
                        type="button"
                        onClick={onRemove}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Advanced Options */}
            {showAdvanced && (
                <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                    {/* Expiration */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Expiration Date (Optional)
                        </label>
                        <input
                            type="datetime-local"
                            value={permission.expiresAt || ""}
                            onChange={(e) => onUpdate({ expiresAt: e.target.value || undefined })}
                            className="px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                        />
                    </div>

                    {/* Tab Restrictions */}
                    {permission.resource === "PROJECT" && permission.action === "VIEW" && (
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Visible Tabs (leave empty for all)
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {PROJECT_TABS.map((tab) => (
                                    <label key={tab} className="flex items-center gap-1 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={permission.constraints?.tabs?.includes(tab) || false}
                                            onChange={(e) => {
                                                const tabs = permission.constraints?.tabs || [];
                                                const newTabs = e.target.checked
                                                    ? [...tabs, tab]
                                                    : tabs.filter((t) => t !== tab);
                                                onUpdate({
                                                    constraints: {
                                                        ...permission.constraints,
                                                        tabs: newTabs.length > 0 ? newTabs : undefined,
                                                    },
                                                });
                                            }}
                                            className="rounded"
                                        />
                                        {tab}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Read-only */}
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={permission.constraints?.readonly || false}
                            onChange={(e) =>
                                onUpdate({
                                    constraints: {
                                        ...permission.constraints,
                                        readonly: e.target.checked,
                                    },
                                })
                            }
                            className="rounded"
                        />
                        Read-only mode
                    </label>
                </div>
            )}
        </div>
    );
}
