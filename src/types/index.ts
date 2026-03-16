// User types
export interface User {
  id: string;
  fullName: string;
  email: string;
  university: string;
  profilePicture?: string;
  averageRating: number;
  totalTrips: number;
  createdAt: string;
}

// Auth types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  fullName: string;
  email: string;
  university: string;
  password: string;
  confirmPassword: string;
}

// Route types
export interface Route {
  id: string;
  driver: User;
  origin: string;
  destination: string;
  departureTime: string;
  availableSeats: number;
  totalSeats: number;
  price: number;
  vehicle: Vehicle;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  color: string;
  plateNumber: string;
  year: number;
}

export interface RouteFilters {
  origin?: string;
  destination?: string;
  date?: string;
}

// Booking types
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';

export interface Booking {
  id: string;
  route: Route;
  passenger: User;
  status: BookingStatus;
  seatsRequested: number;
  createdAt: string;
  updatedAt: string;
}

// Chat types
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  bookingId: string;
}

// Trip history
export interface Trip {
  id: string;
  route: Route;
  role: 'DRIVER' | 'PASSENGER';
  date: string;
  rating?: number;
}

// Form validation
export interface ValidationError {
  field: string;
  message: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Notification types
export interface Notification {
  id: string;
  type: 'BOOKING_REQUEST' | 'BOOKING_CONFIRMED' | 'BOOKING_REJECTED' | 'NEW_MESSAGE' | 'TRIP_REMINDER';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
