'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}

export default function NotificationPanel({ isOpen, onClose, unreadCount, setUnreadCount }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => {
      // Logic for external updates if needed
    };
    window.addEventListener('notifications-updated', handleUpdate);
    return () => window.removeEventListener('notifications-updated', handleUpdate);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/notifications/my?page=0&size=20&_t=${Date.now()}`);
      setNotifications(response.data.content || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleMarkAsRead = async (notificationId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification || notification.read) return;

    const newCount = Math.max(0, unreadCount - 1);
    setUnreadCount(newCount);
    setNotifications(prev =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    window.dispatchEvent(new CustomEvent('notifications-updated', { detail: { count: newCount } }));

    try {
      await api.put(`/api/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Failed to mark as read:', error);
      // Rollback on error if needed, but for simplicity we'll just log
    }
  };

  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification) return;

      if (notification.read === false) {
        const newCount = Math.max(0, unreadCount - 1);
        setUnreadCount(newCount);
        window.dispatchEvent(new CustomEvent('notifications-updated', { detail: { count: newCount } }));
      }

      await api.delete(`/api/notifications/${notificationId}`);
      setNotifications(notifications.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    // Optimistic Update
    setNotifications(prev => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    window.dispatchEvent(new CustomEvent('notifications-updated', { detail: { count: 0 } }));

    try {
      await api.put('/api/notifications/mark-all-as-read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'SUCCESS':
      case 'REQUEST_APPROVED':
        return 'bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700';
      case 'WARNING':
        return 'bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700';
      case 'ERROR':
      case 'REQUEST_REJECTED':
        return 'bg-red-100 dark:bg-red-900 border-red-300 dark:border-red-700';
      case 'REQUEST_PENDING':
        return 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700';
      default:
        return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-8 pt-20 sm:pt-24 pointer-events-none animate-in fade-in duration-300">
      {/* Overlay for closing */}
      <div className="fixed inset-0 pointer-events-auto" onClick={onClose}></div>

      {/* Panel */}
      <div
        className="glass-dark w-[400px] max-w-full max-h-[80vh] sm:max-h-[600px] rounded-[24px] sm:rounded-[32px] shadow-3xl border border-white/5 flex flex-col pointer-events-auto relative animate-in slide-in-from-right-10 duration-500 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-7 border-b border-white/5 bg-white/5">
          <div>
            <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">
              Thông báo
            </h3>
            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">
              {unreadCount > 0 ? `${unreadCount} thông báo mới` : 'Không có thông báo mới'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-400 border border-white/10 px-3 py-1.5 rounded-full hover:border-indigo-500/30 transition-all bg-white/5"
            >
              Đọc tất cả
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/5">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-4">
              <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Đang tải...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-4 opacity-30">
              <svg className="w-12 h-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Trống trơn</span>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleMarkAsRead(notification.id)}
                  className={`p-6 cursor-pointer transition-all duration-500 relative group border-l-4 ${
                    !notification.read
                      ? 'bg-indigo-500/[0.07] border-indigo-500 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]'
                      : 'bg-transparent border-transparent opacity-40 grayscale-[0.8]'
                  } hover:bg-white/5 hover:opacity-100 hover:grayscale-0`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {!notification.read ? (
                          <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)] animate-pulse"></span>
                        ) : (
                          <div className="w-2.5 h-2.5 border border-white/20 rounded-full"></div>
                        )}
                        <h4 className={`text-[14px] leading-tight transition-colors ${
                          !notification.read 
                            ? 'font-black text-slate-900 dark:text-white' 
                            : 'font-medium text-slate-500 dark:text-slate-400'
                        }`}>
                          {notification.title}
                        </h4>
                      </div>
                      <p className={`text-[12px] line-clamp-2 mb-3 leading-relaxed ${
                        !notification.read 
                          ? 'text-slate-700 dark:text-slate-200 font-medium' 
                          : 'text-slate-500 dark:text-slate-500 font-normal'
                      }`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-3">
                         <span className="text-[9px] font-black uppercase tracking-widest text-slate-400/50">
                            {new Date(notification.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                         </span>
                         <span className="text-[9px] font-black uppercase tracking-widest text-slate-400/30">
                            {new Date(notification.createdAt).toLocaleDateString('vi-VN')}
                         </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                      <button
                        onClick={(e) => handleDelete(notification.id, e)}
                        title="Xóa thông báo"
                        className="w-8 h-8 flex items-center justify-center bg-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all shadow-lg backdrop-blur-md"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
