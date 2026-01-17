"use client";

import { AlertTriangle, Info, CheckCircle, XCircle, X } from "lucide-react";

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

    const getStyles = () => {
        switch (type) {
            case "danger":
                return {
                    icon: <XCircle className="h-6 w-6 text-red-600" />,
                    bg: "bg-red-50",
                    button: "bg-red-600 hover:bg-red-700 shadow-red-200",
                    accent: "border-red-100"
                };
            case "warning":
                return {
                    icon: <AlertTriangle className="h-6 w-6 text-amber-600" />,
                    bg: "bg-amber-50",
                    button: "bg-amber-600 hover:bg-amber-700 shadow-amber-200",
                    accent: "border-amber-100"
                };
            case "success":
                return {
                    icon: <CheckCircle className="h-6 w-6 text-[#0f5132]" />,
                    bg: "bg-[#0f5132]/5",
                    button: "bg-[#0f5132] hover:bg-[#0c4027] shadow-[#0f5132]/20",
                    accent: "border-[#0f5132]/10"
                };
            default:
                return {
                    icon: <Info className="h-6 w-6 text-blue-600" />,
                    bg: "bg-blue-50",
                    button: "bg-blue-600 hover:bg-blue-700 shadow-blue-200",
                    accent: "border-blue-100"
                };
        }
    };

    const styles = getStyles();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className={`bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300 border-4 ${styles.accent}`}>
                <div className="relative p-8">
                    <button
                        onClick={onCancel}
                        className="absolute right-6 top-6 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <div className="flex flex-col items-center text-center">
                        <div className={`p-4 rounded-3xl ${styles.bg} mb-6`}>
                            {styles.icon}
                        </div>

                        <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
                            {title}
                        </h3>
                        <p className="text-gray-500 font-medium leading-relaxed mb-8">
                            {message}
                        </p>

                        <div className="flex gap-3 w-full mt-8">
                            <button
                                type="button"
                                disabled={isLoading}
                                onClick={onCancel}
                                className="flex-1 py-3.5 rounded-2xl text-xs font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-50 border border-gray-100 transition-all active:scale-[0.98] disabled:opacity-50 uppercase tracking-widest"
                            >
                                {cancelText}
                            </button>
                            <button
                                type="button"
                                disabled={isLoading}
                                onClick={onConfirm}
                                className={`flex-[2] py-3.5 rounded-2xl text-xs font-black text-white shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest ${styles.button}`}
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>PROCESSING</span>
                                    </>
                                ) : confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
