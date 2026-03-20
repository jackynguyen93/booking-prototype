export type UserRole = 'ADMIN' | 'MEMBER_TENANT' | 'COMMERCIAL_TENANT' | 'FACILITY_USER' | 'TRADES' | 'COMMUNITY_MEMBER';
export type UserStatus = 'APPROVED' | 'PENDING' | 'REJECTED' | 'SUSPENDED';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  orgId: string;
  phone?: string;
  createdAt: string;
  avatarInitials?: string;
}

export interface Organisation {
  id: string;
  name: string;
  type: 'NON_PROFIT' | 'COMMERCIAL' | 'COMMUNITY' | 'GOVERNMENT';
  contactEmail: string;
  contactPhone: string;
  address: string;
  description: string;
  services: string;
  openingHours: string;
  publicListing: boolean;
  representatives: { name: string; role: string; email: string }[];
  activeUsers: number;
  createdAt: string;
}

export type RoomType = 'MEETING_ROOM' | 'PHONE_BOOTH' | 'CAR_PARK' | 'TRAINING_ROOM' | 'BOARD_ROOM';

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  capacity: number;
  pricePerHour: number;
  priceCapHours?: number;
  hasAV: boolean;
  floor: string;
  description: string;
  tenantsOnly: boolean;
  adminManaged: boolean;
  colorClass: string;
}

export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'PENDING_APPROVAL';

export interface Booking {
  id: string;
  roomId: string;
  userId: string;
  orgId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  totalPrice: number;
  accessCode: string;
  notes?: string;
  createdAt: string;
  isRecurring?: boolean;
  recurringGroupId?: string;
}

export type InvoiceStatus = 'PAID' | 'PENDING' | 'OVERDUE';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orgId: string;
  period: string;
  amount: number;
  status: InvoiceStatus;
  dueDate: string;
  issuedDate: string;
  lineItems: { description: string; amount: number }[];
}

export type NotificationType = 'BOOKING_CONFIRMATION' | 'PARCEL_ALERT' | 'BUILDING_NEWS' | 'INVOICE' | 'MAINTENANCE' | 'GENERAL';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type MaintenanceStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
export type MaintenanceCategory = 'PLUMBING' | 'ELECTRICAL' | 'HVAC' | 'CLEANING' | 'IT' | 'SECURITY' | 'OTHER';

export interface MaintenanceRequest {
  id: string;
  orgId: string;
  userId: string;
  title: string;
  description: string;
  priority: MaintenancePriority;
  category: MaintenanceCategory;
  status: MaintenanceStatus;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export type DocumentCategory = 'NEWSLETTER' | 'ANNUAL_REPORT' | 'POLICY' | 'HOUSE_RULES';

export interface Document {
  id: string;
  title: string;
  category: DocumentCategory;
  date: string;
  fileSize: string;
  gated: boolean;
  allowedRoles?: UserRole[];
}

export interface NoticeboardPost {
  id: string;
  title: string;
  body: string;
  orgId: string;
  userId: string;
  category: 'EVENT' | 'NEWS' | 'OFFER' | 'REQUEST';
  createdAt: string;
}

export interface GrantApplication {
  id: string;
  orgId: string;
  userId: string;
  description: string;
  amountRequested: number;
  purpose: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

export interface KeyRecord {
  id: string;
  orgId: string;
  personName: string;
  keyType: string;
  dateIssued: string;
  returned: boolean;
  returnedDate?: string;
}

export interface ParcelAlert {
  id: string;
  orgId: string;
  description: string;
  sentAt: string;
  sentBy: string;
}
