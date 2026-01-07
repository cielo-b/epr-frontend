"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import api, { API_URL } from "@/lib/api";
import { authService } from "@/lib/auth";
import { io, Socket } from "socket.io-client";
import { Send, Plus, Search, User as UserIcon, MoreVertical, MessageSquare, Users, Paperclip, Edit, UserPlus, Trash, X, MoreHorizontal, Download, File } from "lucide-react";

import { format } from "date-fns";
import { useToast } from "@/components/ToastProvider";

type User = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
};

type Message = {
    id: string;
    content: string;
    sender: User;
    createdAt: string;
    updatedAt?: string;
    attachmentUrl?: string; // Merged type
    attachmentType?: string;
    isDeleted?: boolean;
};

type Conversation = {
    id: string;
    name?: string;
    isGroup: boolean;
    participants: { user: User }[];
    messages: Message[];
    updatedAt: string;
};

export default function ChatPage() {
    const [user, setUser] = useState<any>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'message' | 'conversation', id: string } | null>(null);
    const [imageViewerOpen, setImageViewerOpen] = useState(false);
    const [viewerImageUrl, setViewerImageUrl] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { addToast } = useToast();

    // Initialize User and Socket
    useEffect(() => {
        const currentUser = authService.getUser();
        if (currentUser) {
            setUser(currentUser);

            // Determine Socket URL (Base URL of API)
            const socketUrl = API_URL.replace('/api', '');
            const newSocket = io(`${socketUrl}/chat`, {
                query: { userId: currentUser.id },
                transports: ['websocket']
            });

            newSocket.on('connect', () => {
                console.log("Connected to chat socket");
            });

            newSocket.on('newMessage', (message: Message) => {
                setMessages((prev) => [...prev, message]);
                loadConversations();
            });

            newSocket.on('conversationUpdated', (updatedConv: Conversation) => {
                setConversations(prev => prev.map(c => c.id === updatedConv.id ? updatedConv : c));
                if (activeConversationId === updatedConv.id) {
                    // Force re-render or logic if needed, but react handles it via conversations state
                }
            });

            newSocket.on('participantRemoved', ({ conversationId, userId }: { conversationId: string, userId: string }) => {
                if (userId === currentUser.id) {
                    setConversations(prev => prev.filter(c => c.id !== conversationId));
                    if (activeConversationId === conversationId) {
                        setActiveConversationId(null);
                        addToast("You have been removed from this conversation", "info");
                    }
                } else {
                    loadConversations();
                }
            });

            newSocket.on('messageUpdated', (updatedMsg: Message) => {
                setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
            });

            newSocket.on('messageDeleted', ({ messageId, conversationId }: { messageId: string, conversationId: string }) => {
                // We no longer filter out messages because we show a "deleted" banner
                // But we reload conversations so the sidebar shows "This message was deleted"
                loadConversations();
            });

            newSocket.on('conversationDeleted', ({ conversationId }: { conversationId: string }) => {
                setConversations(prev => prev.filter(c => c.id !== conversationId));
                if (activeConversationId === conversationId) {
                    setActiveConversationId(null);
                    addToast("This conversation has been deleted", "info");
                }
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        }
    }, []);

    // Load Conversations
    useEffect(() => {
        loadConversations();
    }, []);

    const loadConversations = async () => {
        try {
            const res = await api.get('/chat/conversations');
            setConversations(res.data);
        } catch (err) {
            console.error("Failed to load conversations", err);
        }
    };

    // Load Messages when active conversation changes
    useEffect(() => {
        if (activeConversationId) {
            loadMessages(activeConversationId);
            if (socket) {
                socket.emit('joinConversation', activeConversationId);
            }
        }
    }, [activeConversationId, socket]);

    const loadMessages = async (id: string) => {
        try {
            const res = await api.get(`/chat/conversations/${id}/messages`);
            setMessages(res.data);
            scrollToBottom();
        } catch (err) {
            console.error("Failed to load messages", err);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e?: React.FormEvent, attachmentUrl?: string, attachmentType?: string) => {
        if (e) e.preventDefault();

        if (editingMessageId) {
            if (newMessage.trim()) {
                await handleEditMessage(editingMessageId, newMessage.trim());
            }
            return;
        }

        if ((!newMessage.trim() && !attachmentUrl) || !activeConversationId || !user || !socket) return;

        const tempId = Date.now().toString();
        const content = newMessage.trim();

        // Optimistic update? Maybe risky if socket fails. 
        // Let's settle for API call + Socket broadcast.
        // Actually, sending via Socket is faster for UI, but let's use API to be robust as requested by controller setup
        // controller calls service.sendMessage

        // BUT we also have socket gateway listening to 'sendMessage'.
        // Let's use the socket event for sending if we want "real-time" feel, but REST is safer for persistence confirmation.
        // Code below uses REST as primary.

        try {
            // Using REST for reliability and broadcasting
            const response = await api.post('/chat/messages', {
                conversationId: activeConversationId,
                content: content || "",
                attachmentUrl,
                attachmentType
            });

            setNewMessage("");
            if (editingMessageId) setEditingMessageId(null);

            // Reload messages to ensure we have the latest (including the one we just sent)
            await loadMessages(activeConversationId);
        } catch (err) {
            addToast("Failed to send message", "error");
        }
    };

    const handleCreateConversation = async () => {
        if (selectedUserIds.length === 0) return;

        try {
            const res = await api.post('/chat/conversations', {
                participantIds: selectedUserIds,
                isGroup: selectedUserIds.length > 1,
                name: selectedUserIds.length > 1 ? "New Group" : undefined // Naming could be improved
            });

            setConversations(prev => [res.data, ...prev]);
            setActiveConversationId(res.data.id);
            setIsNewChatModalOpen(false);
            setSelectedUserIds([]);
        } catch (err) {
            addToast("Failed to create conversation", "error");
        }
    };

    const openNewChatModal = async () => {
        try {
            const res = await api.get('/users');
            // Filter out self
            const others = res.data.filter((u: User) => u.id !== user?.id);
            setAvailableUsers(others);
            setIsNewChatModalOpen(true);
        } catch (err) {
            addToast("Failed to load users", "error");
        }
    };

    const toggleUserSelection = (id: string) => {
        setSelectedUserIds(prev =>
            prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
        );
    };

    const handleUpdateGroup = async () => {
        if (!activeConversationId || !groupName.trim()) return;
        try {
            await api.patch(`/chat/conversations/${activeConversationId}`, { name: groupName });
            setGroupName(""); // Reset or keep? Better keep or update local temporarily

            // We rely on socket for update, but to be responsive:
            // Actually, let's wait for socket.
        } catch (err) {
            addToast("Failed to update group name", "error");
        }
    };

    const handleAddMembers = async () => {
        if (!activeConversationId || selectedUserIds.length === 0) return;
        try {
            await api.post(`/chat/conversations/${activeConversationId}/participants`, { userIds: selectedUserIds });
            setIsAddMemberOpen(false);
            setSelectedUserIds([]);
            addToast("Members added successfully");
        } catch (err) {
            addToast("Failed to add members", "error");
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!activeConversationId) return;
        try {
            await api.delete(`/chat/conversations/${activeConversationId}/participants/${userId}`);
            addToast("Member removed");
        } catch (err) {
            addToast("Failed to remove member", "error");
        }
    };

    const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/chat/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // Send message with attachment immediately? Or put in input?
            // Sending immediately for simplicity, but maybe content is nice.
            // Let's assume we send immediately with empty content or generic "Sent a file".
            // Or better: update state to show "Attached: filename" and wait for send?
            // For now: send immediately.
            await handleSendMessage(undefined, res.data.url, res.data.type);
            addToast("Attachment sent");
        } catch (err) {
            addToast("Failed to upload file", "error");
        }
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleEditMessage = async (messageId: string, newContent: string) => {
        try {
            await api.patch(`/chat/messages/${messageId}`, { content: newContent });
            setEditingMessageId(null);
            setNewMessage(""); // Clear input if it was used for editing?
            // Note: UI needs to handle "Editing Mode" where input field is populated.
        } catch (err) {
            addToast("Failed to edit message", "error");
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        setDeleteTarget({ type: 'message', id: messageId });
        setDeleteConfirmOpen(true);
    };

    const handleDeleteConversation = async () => {
        if (!activeConversationId) return;
        setDeleteTarget({ type: 'conversation', id: activeConversationId });
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        try {
            if (deleteTarget.type === 'message') {
                await api.delete(`/chat/messages/${deleteTarget.id}`);
                addToast("Message deleted");
            } else {
                await api.delete(`/chat/conversations/${deleteTarget.id}`);
                addToast("Conversation deleted");
            }
        } catch (err) {
            addToast(`Failed to delete ${deleteTarget.type}`, "error");
        } finally {
            setDeleteConfirmOpen(false);
            setDeleteTarget(null);
        }
    };

    const handleDownloadFile = (url: string, filename?: string) => {
        // Create a temporary anchor element to trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || url.split('/').pop() || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toggleGroupSettings = () => {
        const activeConversation = conversations.find(c => c.id === activeConversationId);
        if (activeConversation && activeConversation.isGroup) {
            setGroupName(activeConversation.name || "");
            setIsGroupSettingsOpen(!isGroupSettingsOpen);
        }
    };

    // Helper to get conversation display name
    const getConversationName = (conv: Conversation) => {
        if (conv.name) return conv.name;
        const otherParticipants = conv.participants.filter(p => p.user.id !== user?.id);
        if (otherParticipants.length === 0) return "Just You";
        if (otherParticipants.length === 1) return `${otherParticipants[0].user.firstName} ${otherParticipants[0].user.lastName}`;
        return otherParticipants.map(p => p.user.firstName).join(", ");
    };

    const activeConversation = conversations.find(c => c.id === activeConversationId);

    return (
        <AppShell title="Team Chat" userName={user?.firstName} userRole={user?.role}>
            <div className="flex h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

                {/* Sidebar */}
                <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50/50">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-gray-50/50 backdrop-blur-sm z-10">
                        <h2 className="font-bold text-gray-800 text-lg">Messages</h2>
                        <button
                            onClick={openNewChatModal}
                            className="p-2 bg-brand-green-100 text-brand-green-700 rounded-lg hover:bg-brand-green-200 transition-colors"
                            title="New Chat"
                        >
                            <Plus className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="p-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                placeholder="Search chats..."
                                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-green-500 focus:border-brand-green-500"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {conversations.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No conversations yet.</p>
                            </div>
                        ) : (
                            conversations.map(conv => {
                                const isActive = conv.id === activeConversationId;
                                return (
                                    <div
                                        key={conv.id}
                                        onClick={() => setActiveConversationId(conv.id)}
                                        className={`p-4 cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-0 ${isActive ? 'bg-white border-l-4 border-l-brand-green-500 shadow-sm' : 'border-l-4 border-l-transparent'}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-green-400 to-blue-500 flex items-center justify-center text-white font-bold shrink-0">
                                                {getConversationName(conv).charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className={`text-sm font-semibold truncate ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                                                    {getConversationName(conv)}
                                                </h3>
                                                <p className="text-xs text-gray-500 truncate mt-0.5">
                                                    {conv.messages && conv.messages.length > 0
                                                        ? conv.messages[conv.messages.length - 1].content
                                                        : <span className="italic text-gray-400">No messages yet</span>}
                                                </p>
                                            </div>
                                            {/* Time could go here */}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-white">
                    {activeConversation ? (
                        <>
                            {/* Header */}
                            <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white sticky top-0 z-10">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg">
                                        {getConversationName(activeConversation).charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-gray-900">{getConversationName(activeConversation)}</h2>
                                        <p className="text-xs text-green-600 flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-green-500 block"></span> Online
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-gray-500">
                                    <button
                                        onClick={activeConversation.isGroup ? toggleGroupSettings : handleDeleteConversation}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors relative group"
                                        title={activeConversation.isGroup ? "Group Settings" : "Delete Conversation"}
                                    >
                                        <MoreVertical className="h-5 w-5" />
                                        {!activeConversation.isGroup && (
                                            <div className="absolute right-0 top-10 w-32 bg-white shadow-xl rounded-lg p-1 hidden group-hover:block border border-gray-100">
                                                <div className="text-xs text-red-600 px-2 py-1">Delete Chat</div>
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30 custom-scrollbar space-y-4">
                                {messages.map((msg, idx) => {
                                    const isMe = msg.sender?.id === user?.id;
                                    const showAvatar = idx === 0 || messages[idx - 1].sender.id !== msg.sender.id;

                                    return (
                                        <div key={msg.id} className={`flex gap-3 group/msg ${isMe ? 'flex-row-reverse' : ''}`}>
                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${showAvatar ? (isMe ? 'bg-brand-green-100 text-brand-green-700' : 'bg-gray-200 text-gray-700') : 'invisible'}`}>
                                                {msg.sender.firstName[0]}
                                            </div>
                                            <div className={`max-w-[70%] space-y-1`}>
                                                <div className={`px-4 py-2 rounded-2xl shadow-sm text-sm relative ${msg.isDeleted ? 'bg-gray-100 border border-gray-200 text-gray-400 italic rounded-br-none' : (isMe ? 'bg-brand-green-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none')}`}>
                                                    {msg.isDeleted ? (
                                                        <div className="flex items-center gap-2">
                                                            <Trash className="h-3 w-3 opacity-50" />
                                                            <span>This message was deleted</span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {msg.attachmentUrl && (
                                                                <div className="mb-2">
                                                                    {msg.attachmentType?.startsWith('image/') ? (
                                                                        <div className="relative group/img">
                                                                            <img
                                                                                src={`${API_URL.replace('/api', '')}${msg.attachmentUrl}`}
                                                                                alt="attachment"
                                                                                className="rounded-lg max-h-48 object-cover bg-black/10 cursor-pointer hover:opacity-90 transition-opacity"
                                                                                onClick={() => {
                                                                                    setViewerImageUrl(`${API_URL.replace('/api', '')}${msg.attachmentUrl}`);
                                                                                    setImageViewerOpen(true);
                                                                                }}
                                                                            />
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleDownloadFile(`${API_URL.replace('/api', '')}${msg.attachmentUrl}`);
                                                                                }}
                                                                                className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity"
                                                                            >
                                                                                <Download className="h-4 w-4 text-white" />
                                                                            </button>
                                                                        </div>
                                                                    ) : msg.attachmentType?.startsWith('video/') ? (
                                                                        <div className="relative">
                                                                            <video
                                                                                src={`${API_URL.replace('/api', '')}${msg.attachmentUrl}`}
                                                                                controls
                                                                                className="rounded-lg max-h-64 w-full bg-black"
                                                                            />
                                                                            <button
                                                                                onClick={() => handleDownloadFile(`${API_URL.replace('/api', '')}${msg.attachmentUrl}`)}
                                                                                className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-lg"
                                                                            >
                                                                                <Download className="h-4 w-4 text-white" />
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => handleDownloadFile(`${API_URL.replace('/api', '')}${msg.attachmentUrl}`)}
                                                                            className={`flex items-center gap-2 p-2 rounded-lg w-full ${isMe ? 'bg-brand-green-700/50' : 'bg-gray-100'} hover:opacity-80 transition-opacity`}
                                                                        >
                                                                            <File className="h-4 w-4" />
                                                                            <span className="truncate max-w-[150px] underline">Download File</span>
                                                                            <Download className="h-4 w-4 ml-auto" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {msg.content}

                                                            {/* Message Actions */}
                                                            {isMe && (
                                                                <div className={`absolute top-0 ${isMe ? '-left-16' : '-right-16'} hidden group-hover/msg:flex gap-1 bg-white shadow-md rounded-lg p-1 border border-gray-100`}>
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingMessageId(msg.id);
                                                                            setNewMessage(msg.content);
                                                                            if (fileInputRef.current) fileInputRef.current.focus();
                                                                        }}
                                                                        className="p-1 hover:bg-gray-100 rounded text-gray-600"
                                                                        title="Edit"
                                                                    >
                                                                        <Edit className="h-3 w-3" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteMessage(msg.id)}
                                                                        className="p-1 hover:bg-red-50 rounded text-red-600"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash className="h-3 w-3" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                                <p className={`text-[10px] text-gray-400 ${isMe ? 'text-right' : 'text-left'}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {msg.updatedAt && msg.updatedAt !== msg.createdAt && <span className="ml-1 italic">(edited)</span>}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-4 bg-white border-t border-gray-200">
                                {editingMessageId && (
                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2 px-2">
                                        <span>Editing message...</span>
                                        <button onClick={() => { setEditingMessageId(null); setNewMessage(""); }} className="hover:text-gray-700">Cancel</button>
                                    </div>
                                )}
                                <form onSubmit={(e) => handleSendMessage(e)} className="flex gap-2 items-end">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={handleUploadFile}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                                        title="Attach file"
                                    >
                                        <Paperclip className="h-5 w-5" />
                                    </button>
                                    <div className="flex-1 bg-gray-100 rounded-xl px-4 py-2 focus-within:ring-0 focus-within:bg-gray-100 transition-all border border-transparent focus-within:border-transparent">
                                        <input
                                            value={newMessage}
                                            onChange={e => setNewMessage(e.target.value)}
                                            placeholder="Type your message..."
                                            className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-sm py-1 ring-0 outline-none placeholder:text-gray-500 text-gray-900"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="p-3 bg-brand-green-600 text-white rounded-xl hover:bg-brand-green-700 disabled:opacity-50 disabled:hover:bg-brand-green-600 shadow-md shadow-brand-green-600/20 transition-all flex items-center justify-center"
                                    >
                                        {editingMessageId ? <Edit className="h-5 w-5" /> : <Send className="h-5 w-5" />}
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                <MessageSquare className="h-12 w-12 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome to Team Chat</h3>
                            <p className="max-w-md text-center text-gray-500">
                                Select a conversation from the sidebar or start a new chat to communicate with your team members instantly.
                            </p>
                            <button
                                onClick={openNewChatModal}
                                className="mt-8 px-6 py-3 bg-brand-green-600 text-white rounded-xl font-medium hover:bg-brand-green-700 transition-all shadow-lg shadow-brand-green-600/20"
                            >
                                Start New Conversation
                            </button>
                        </div>
                    )}
                </div>

                {/* New Chat Modal */}
                {isNewChatModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                            <div className="px-6 py-4 border-b border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900">New Message</h3>
                                <p className="text-sm text-gray-500">Select users to start a conversation</p>
                            </div>
                            <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                <div className="mb-4">
                                    <input
                                        placeholder="Search people..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-green-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    {availableUsers
                                        .filter(u => `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()))
                                        .map(u => (
                                            <label key={u.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUserIds.includes(u.id)}
                                                    onChange={() => toggleUserSelection(u.id)}
                                                    className="w-4 h-4 text-brand-green-600 rounded border-gray-300 focus:ring-brand-green-500"
                                                />
                                                <div className="h-8 w-8 rounded-full bg-brand-green-100 flex items-center justify-center text-xs font-bold text-brand-green-700">
                                                    {u.firstName[0]}{u.lastName[0]}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</div>
                                                    <div className="text-xs text-gray-500">{u.email}</div>
                                                </div>
                                            </label>
                                        ))}
                                </div>
                            </div>
                            <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                                <button
                                    onClick={() => setIsNewChatModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateConversation}
                                    disabled={selectedUserIds.length === 0}
                                    className="px-6 py-2 text-sm font-medium text-white bg-brand-green-600 hover:bg-brand-green-700 rounded-lg disabled:opacity-50 shadow-md shadow-brand-green-600/20"
                                >
                                    {selectedUserIds.length > 1 ? "Create Group" : "Start Chat"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Group Settings Modal */}
                {isGroupSettingsOpen && activeConversation && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-gray-900">Group Settings</h3>
                                <button onClick={() => setIsGroupSettingsOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                            </div>
                            <div className="p-6">
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
                                    <div className="flex gap-2">
                                        <input
                                            value={groupName}
                                            onChange={e => setGroupName(e.target.value)}
                                            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-green-500"
                                        />
                                        <button
                                            onClick={handleUpdateGroup}
                                            className="px-4 py-2 bg-brand-green-600 text-white rounded-lg hover:bg-brand-green-700 transition-colors"
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-sm font-medium text-gray-700">Members ({activeConversation.participants.length})</h4>
                                        <button
                                            onClick={() => {
                                                setIsGroupSettingsOpen(false);
                                                const loadUsers = async () => {
                                                    try {
                                                        const res = await api.get('/users');
                                                        const currentIds = activeConversation.participants.map(p => p.user.id);
                                                        const others = res.data.filter((u: User) => !currentIds.includes(u.id));
                                                        setAvailableUsers(others);
                                                        setIsAddMemberOpen(true);
                                                    } catch (err) {
                                                        addToast("Failed to load users", "error");
                                                    }
                                                };
                                                loadUsers();
                                            }}
                                            className="text-xs text-brand-green-600 hover:text-brand-green-700 flex items-center gap-1 font-medium"
                                        >
                                            <UserPlus className="h-3 w-3" /> Add Member
                                        </button>
                                    </div>
                                    <div className="space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar">
                                        {activeConversation.participants.map(p => (
                                            <div key={p.user.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                                        {p.user.firstName[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{p.user.firstName} {p.user.lastName}</p>
                                                        <p className="text-xs text-gray-500">{p.user.email}</p>
                                                    </div>
                                                </div>
                                                {p.user.id !== user.id && (
                                                    <button
                                                        onClick={() => handleRemoveMember(p.user.id)}
                                                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                                        title="Remove Member"
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-gray-100 flex justify-center">
                                        <button
                                            onClick={() => { setIsGroupSettingsOpen(false); handleDeleteConversation(); }}
                                            className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium text-sm px-4 py-2 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash className="h-4 w-4" /> Delete Group
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Member Modal */}
                {isAddMemberOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                            <div className="px-6 py-4 border-b border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900">Add Members</h3>
                            </div>
                            <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {availableUsers.length === 0 ? (
                                    <p className="text-center text-gray-500 py-4">No other users to add.</p>
                                ) : (
                                    availableUsers.map(u => (
                                        <label key={u.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={selectedUserIds.includes(u.id)}
                                                onChange={() => toggleUserSelection(u.id)}
                                                className="w-4 h-4 text-brand-green-600 rounded border-gray-300 focus:ring-brand-green-500"
                                            />
                                            <div className="h-8 w-8 rounded-full bg-brand-green-100 flex items-center justify-center text-xs font-bold text-brand-green-700">
                                                {u.firstName[0]}{u.lastName[0]}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</div>
                                                <div className="text-xs text-gray-500">{u.email}</div>
                                            </div>
                                        </label>
                                    ))
                                )}
                            </div>
                            <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                                <button
                                    onClick={() => { setIsAddMemberOpen(false); setSelectedUserIds([]); }}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddMembers}
                                    disabled={selectedUserIds.length === 0}
                                    className="px-6 py-2 text-sm font-medium text-white bg-brand-green-600 hover:bg-brand-green-700 rounded-lg disabled:opacity-50 shadow-md shadow-brand-green-600/20"
                                >
                                    Add Members
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deleteConfirmOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                            <div className="px-6 py-4 border-b border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900">Confirm Deletion</h3>
                            </div>
                            <div className="p-6">
                                <p className="text-gray-700">
                                    Are you sure you want to delete this {deleteTarget?.type === 'message' ? 'message' : 'conversation'}?
                                    {deleteTarget?.type === 'conversation' && ' This action cannot be undone.'}
                                </p>
                            </div>
                            <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                                <button
                                    onClick={() => { setDeleteConfirmOpen(false); setDeleteTarget(null); }}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-6 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md shadow-red-600/20"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Image Viewer Modal */}
                {imageViewerOpen && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
                        onClick={() => setImageViewerOpen(false)}
                    >
                        <button
                            onClick={() => setImageViewerOpen(false)}
                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="h-6 w-6 text-white" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadFile(viewerImageUrl);
                            }}
                            className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <Download className="h-6 w-6 text-white" />
                        </button>
                        <img
                            src={viewerImageUrl}
                            alt="Full size"
                            className="max-w-full max-h-full object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                )}
            </div>
        </AppShell>
    );
}
