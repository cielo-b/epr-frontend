"use client";

import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: "danger" | "warning" | "info" | "success";
    isLoading?: boolean;
}

export function ConfirmationModal({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "info",
    isLoading = false
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    const getColorClasses = () => {
        switch (type) {
            case "danger":
                return {
                    icon: <XCircle className="h-6 w-6 text-red-600" />,
                    bg: "bg-red-50",
                    button: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
                };
            case "warning":
                return {
                    icon: <AlertTriangle className="h-6 w-6 text-brand-green-600" />,
                    bg: "bg-brand-green-50",
                    button: "bg-brand-green-600 hover:bg-brand-green-700 focus:ring-brand-green-500",
                };
            case "success":
                return {
                    icon: <CheckCircle className="h-6 w-6 text-brand-green-600" />,
                    bg: "bg-brand-green-50",
                    button: "bg-brand-green-600 hover:bg-brand-green-700 focus:ring-brand-green-500",
                };
            default:
                return {
                    icon: <Info className="h-6 w-6 text-brand-green-600" />,
                    bg: "bg-brand-green-50",
                    button: "bg-brand-green-600 hover:bg-brand-green-700 focus:ring-brand-green-500",
                };
        }
    };

    const colors = getColorClasses();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${colors.bg}`}>
                            {colors.icon}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                                {title}
                            </h3>
                            <p className="mt-2 text-gray-600 leading-relaxed">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 flex flex-col sm:flex-row-reverse gap-3 mt-2">
                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={onConfirm}
                        className={`inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 ${colors.button}`}
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {confirmText}...
                            </>
                        ) : confirmText}
                    </button>
                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={onCancel}
                        className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
}
