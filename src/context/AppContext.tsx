'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Booking, Notification, MaintenanceRequest, NoticeboardPost, GrantApplication, KeyRecord, ParcelAlert, User, Organisation } from '@/types';
import { mockBookings } from '@/data/bookings';
import { mockNotifications } from '@/data/notifications';
import { mockMaintenanceRequests } from '@/data/maintenanceRequests';
import { mockNoticeboardPosts } from '@/data/noticeboard';
import { mockGrantApplications } from '@/data/grants';
import { mockKeyRecords } from '@/data/keys';
import { mockParcelAlerts } from '@/data/parcels';
import { mockUsers } from '@/data/users';
import { mockOrganisations } from '@/data/organisations';

interface AppContextType {
  bookings: Booking[];
  notifications: Notification[];
  maintenanceRequests: MaintenanceRequest[];
  noticeboardPosts: NoticeboardPost[];
  grantApplications: GrantApplication[];
  keyRecords: KeyRecord[];
  parcelAlerts: ParcelAlert[];
  users: User[];
  organisations: Organisation[];

  addBooking: (booking: Booking) => void;
  cancelBooking: (bookingId: string) => void;
  markNotificationRead: (notifId: string) => void;
  markAllNotificationsRead: (userId: string) => void;
  addNotification: (notif: Notification) => void;
  addMaintenanceRequest: (req: MaintenanceRequest) => void;
  updateMaintenanceRequest: (id: string, updates: Partial<MaintenanceRequest>) => void;
  addNoticeboardPost: (post: NoticeboardPost) => void;
  addGrantApplication: (app: GrantApplication) => void;
  addKeyRecord: (record: KeyRecord) => void;
  updateKeyRecord: (id: string, updates: Partial<KeyRecord>) => void;
  addParcelAlert: (alert: ParcelAlert) => void;
  approveUser: (userId: string) => void;
  rejectUser: (userId: string) => void;
  addUser: (user: User) => void;
  updateOrganisation: (id: string, updates: Partial<Organisation>) => void;
  resetToMockData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error(`Failed to load ${key} from localStorage`, e);
  }
  return fallback;
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage`, e);
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [noticeboardPosts, setNoticeboardPosts] = useState<NoticeboardPost[]>([]);
  const [grantApplications, setGrantApplications] = useState<GrantApplication[]>([]);
  const [keyRecords, setKeyRecords] = useState<KeyRecord[]>([]);
  const [parcelAlerts, setParcelAlerts] = useState<ParcelAlert[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    setBookings(loadFromStorage('rh_bookings', mockBookings));
    setNotifications(loadFromStorage('rh_notifications', mockNotifications));
    setMaintenanceRequests(loadFromStorage('rh_maintenance', mockMaintenanceRequests));
    setNoticeboardPosts(loadFromStorage('rh_noticeboard', mockNoticeboardPosts));
    setGrantApplications(loadFromStorage('rh_grants', mockGrantApplications));
    setKeyRecords(loadFromStorage('rh_keys', mockKeyRecords));
    setParcelAlerts(loadFromStorage('rh_parcels', mockParcelAlerts));
    setUsers(loadFromStorage('rh_users', mockUsers));
    setOrganisations(loadFromStorage('rh_organisations', mockOrganisations));
    setInitialized(true);
  }, []);

  useEffect(() => { if (initialized) saveToStorage('rh_bookings', bookings); }, [bookings, initialized]);
  useEffect(() => { if (initialized) saveToStorage('rh_notifications', notifications); }, [notifications, initialized]);
  useEffect(() => { if (initialized) saveToStorage('rh_maintenance', maintenanceRequests); }, [maintenanceRequests, initialized]);
  useEffect(() => { if (initialized) saveToStorage('rh_noticeboard', noticeboardPosts); }, [noticeboardPosts, initialized]);
  useEffect(() => { if (initialized) saveToStorage('rh_grants', grantApplications); }, [grantApplications, initialized]);
  useEffect(() => { if (initialized) saveToStorage('rh_keys', keyRecords); }, [keyRecords, initialized]);
  useEffect(() => { if (initialized) saveToStorage('rh_parcels', parcelAlerts); }, [parcelAlerts, initialized]);
  useEffect(() => { if (initialized) saveToStorage('rh_users', users); }, [users, initialized]);
  useEffect(() => { if (initialized) saveToStorage('rh_organisations', organisations); }, [organisations, initialized]);

  const addBooking = useCallback((booking: Booking) => {
    setBookings(prev => [booking, ...prev]);
  }, []);

  const cancelBooking = useCallback((bookingId: string) => {
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'CANCELLED' as const } : b));
  }, []);

  const markNotificationRead = useCallback((notifId: string) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
  }, []);

  const markAllNotificationsRead = useCallback((userId: string) => {
    setNotifications(prev => prev.map(n => n.userId === userId ? { ...n, read: true } : n));
  }, []);

  const addNotification = useCallback((notif: Notification) => {
    setNotifications(prev => [notif, ...prev]);
  }, []);

  const addMaintenanceRequest = useCallback((req: MaintenanceRequest) => {
    setMaintenanceRequests(prev => [req, ...prev]);
  }, []);

  const updateMaintenanceRequest = useCallback((id: string, updates: Partial<MaintenanceRequest>) => {
    setMaintenanceRequests(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const addNoticeboardPost = useCallback((post: NoticeboardPost) => {
    setNoticeboardPosts(prev => [post, ...prev]);
  }, []);

  const addGrantApplication = useCallback((app: GrantApplication) => {
    setGrantApplications(prev => [app, ...prev]);
  }, []);

  const addKeyRecord = useCallback((record: KeyRecord) => {
    setKeyRecords(prev => [...prev, record]);
  }, []);

  const updateKeyRecord = useCallback((id: string, updates: Partial<KeyRecord>) => {
    setKeyRecords(prev => prev.map(k => k.id === id ? { ...k, ...updates } : k));
  }, []);

  const addParcelAlert = useCallback((alert: ParcelAlert) => {
    setParcelAlerts(prev => [alert, ...prev]);
  }, []);

  const approveUser = useCallback((userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'APPROVED' as const } : u));
  }, []);

  const rejectUser = useCallback((userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'REJECTED' as const } : u));
  }, []);

  const addUser = useCallback((user: User) => {
    setUsers(prev => [...prev, user]);
  }, []);

  const updateOrganisation = useCallback((id: string, updates: Partial<Organisation>) => {
    setOrganisations(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  }, []);

  const resetToMockData = useCallback(() => {
    setBookings(mockBookings);
    setNotifications(mockNotifications);
    setMaintenanceRequests(mockMaintenanceRequests);
    setNoticeboardPosts(mockNoticeboardPosts);
    setGrantApplications(mockGrantApplications);
    setKeyRecords(mockKeyRecords);
    setParcelAlerts(mockParcelAlerts);
    setUsers(mockUsers);
    setOrganisations(mockOrganisations);
  }, []);

  return (
    <AppContext.Provider value={{
      bookings, notifications, maintenanceRequests, noticeboardPosts,
      grantApplications, keyRecords, parcelAlerts, users, organisations,
      addBooking, cancelBooking, markNotificationRead, markAllNotificationsRead,
      addNotification, addMaintenanceRequest, updateMaintenanceRequest,
      addNoticeboardPost, addGrantApplication, addKeyRecord, updateKeyRecord,
      addParcelAlert, approveUser, rejectUser, addUser, updateOrganisation,
      resetToMockData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
