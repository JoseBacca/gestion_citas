import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./Authproviders";

const NotificationContext = createContext(null);

export const useNotifications = () => {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error("useNotifications debe usarse dentro de NotificationProvider");
    return ctx;
};

export function NotificationProvider({ children }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(50);

            setNotifications(data || []);
            setUnreadCount((data || []).filter((n) => !n.read).length);
        } catch (err) {
            console.error("Error fetching notifications:", err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchNotifications();
        if (!user) return;

        const channel = supabase
            .channel("notifications-changes")
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (payload) => {
                setNotifications((prev) => [payload.new, ...prev].slice(0, 50));
                setUnreadCount((prev) => prev + 1);
            })
            .subscribe();

        return () => { channel.unsubscribe(); };
    }, [user, fetchNotifications]);

    const markAsRead = async (notificationId) => {
        await supabase.from("notifications").update({ read: true }).eq("id", notificationId);
        setNotifications((prev) => prev.map((n) => n.id === notificationId ? { ...n, read: true } : n));
        setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    const markAllAsRead = async () => {
        if (!user) return;
        await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const clearAll = async () => {
        if (!user) return;
        await supabase.from("notifications").delete().eq("user_id", user.id);
        setNotifications([]);
        setUnreadCount(0);
    };

    const createNotification = async (title, message, type = "info") => {
        if (!user) return;
        const { data } = await supabase
            .from("notifications")
            .insert({ user_id: user.id, title, message, type, read: false })
            .select()
            .single();
        if (data) {
            setNotifications((prev) => [data, ...prev].slice(0, 50));
            setUnreadCount((prev) => prev + 1);
        }
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllAsRead, clearAll, createNotification }}>
            {children}
        </NotificationContext.Provider>
    );
}
