import { Route, Booking, User, Conversation, Message, Trip, Notification } from '../types';

// Mock users
export const mockUsers: User[] = [
  {
    id: '1',
    fullName: 'Juan García',
    email: 'juan.garcia@universidad.edu.co',
    university: 'Universidad de los Andes',
    profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    averageRating: 4.8,
    totalTrips: 23,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    fullName: 'María López',
    email: 'maria.lopez@javeriana.edu.co',
    university: 'Pontificia Universidad Javeriana',
    profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    averageRating: 4.9,
    totalTrips: 45,
    createdAt: '2023-08-20',
  },
  {
    id: '3',
    fullName: 'Carlos Rodríguez',
    email: 'carlos.rodriguez@unal.edu.co',
    university: 'Universidad Nacional de Colombia',
    profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    averageRating: 4.5,
    totalTrips: 12,
    createdAt: '2024-02-10',
  },
  {
    id: '4',
    fullName: 'Ana Martínez',
    email: 'ana.martinez@urosario.edu.co',
    university: 'Universidad del Rosario',
    profilePicture: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    averageRating: 4.7,
    totalTrips: 30,
    createdAt: '2023-11-05',
  },
];

// Mock routes
export const mockRoutes: Route[] = [
  {
    id: '1',
    driver: mockUsers[1],
    origin: 'Centro Comercial Andino',
    destination: 'Universidad de los Andes',
    departureTime: '2026-03-06T07:30:00',
    availableSeats: 3,
    totalSeats: 4,
    price: 8000,
    vehicle: {
      id: 'v1',
      brand: 'Mazda',
      model: '3',
      color: 'Rojo',
      plateNumber: 'ABC123',
      year: 2022,
    },
    status: 'ACTIVE',
    createdAt: '2026-03-01',
  },
  {
    id: '2',
    driver: mockUsers[2],
    origin: 'Portal del Norte',
    destination: 'Universidad Nacional',
    departureTime: '2026-03-06T08:00:00',
    availableSeats: 2,
    totalSeats: 4,
    price: 6000,
    vehicle: {
      id: 'v2',
      brand: 'Chevrolet',
      model: 'Spark',
      color: 'Blanco',
      plateNumber: 'XYZ789',
      year: 2021,
    },
    status: 'ACTIVE',
    createdAt: '2026-03-02',
  },
  {
    id: '3',
    driver: mockUsers[3],
    origin: 'Usaquén',
    destination: 'Universidad Javeriana',
    departureTime: '2026-03-06T07:00:00',
    availableSeats: 1,
    totalSeats: 3,
    price: 10000,
    vehicle: {
      id: 'v3',
      brand: 'Renault',
      model: 'Sandero',
      color: 'Gris',
      plateNumber: 'DEF456',
      year: 2023,
    },
    status: 'ACTIVE',
    createdAt: '2026-03-01',
  },
  {
    id: '4',
    driver: mockUsers[1],
    origin: 'Chapinero',
    destination: 'Universidad del Rosario',
    departureTime: '2026-03-07T09:00:00',
    availableSeats: 4,
    totalSeats: 4,
    price: 7000,
    vehicle: {
      id: 'v1',
      brand: 'Mazda',
      model: '3',
      color: 'Rojo',
      plateNumber: 'ABC123',
      year: 2022,
    },
    status: 'ACTIVE',
    createdAt: '2026-03-03',
  },
];

// Mock bookings
export const mockBookings: Booking[] = [
  {
    id: 'b1',
    route: mockRoutes[0],
    passenger: mockUsers[0],
    status: 'PENDING',
    seatsRequested: 1,
    createdAt: '2026-03-04T10:00:00',
    updatedAt: '2026-03-04T10:00:00',
  },
  {
    id: 'b2',
    route: mockRoutes[1],
    passenger: mockUsers[0],
    status: 'CONFIRMED',
    seatsRequested: 2,
    createdAt: '2026-03-03T14:00:00',
    updatedAt: '2026-03-03T15:00:00',
  },
  {
    id: 'b3',
    route: mockRoutes[2],
    passenger: mockUsers[0],
    status: 'REJECTED',
    seatsRequested: 1,
    createdAt: '2026-03-02T11:00:00',
    updatedAt: '2026-03-02T12:00:00',
  },
];

// Mock conversations
export const mockConversations: Conversation[] = [
  {
    id: 'c1',
    participants: [mockUsers[0], mockUsers[1]],
    lastMessage: {
      id: 'm3',
      senderId: '2',
      receiverId: '1',
      content: '¡Perfecto! Nos vemos mañana entonces.',
      timestamp: '2026-03-05T16:30:00',
      isRead: false,
    },
    unreadCount: 1,
    bookingId: 'b2',
  },
  {
    id: 'c2',
    participants: [mockUsers[0], mockUsers[2]],
    lastMessage: {
      id: 'm6',
      senderId: '1',
      receiverId: '3',
      content: 'Gracias por confirmar.',
      timestamp: '2026-03-05T14:00:00',
      isRead: true,
    },
    unreadCount: 0,
    bookingId: 'b2',
  },
];

// Mock messages
export const mockMessages: Record<string, Message[]> = {
  c1: [
    {
      id: 'm1',
      senderId: '1',
      receiverId: '2',
      content: 'Hola María, ¿está confirmado el viaje para mañana?',
      timestamp: '2026-03-05T16:00:00',
      isRead: true,
    },
    {
      id: 'm2',
      senderId: '2',
      receiverId: '1',
      content: 'Sí, salimos a las 7:30 AM desde el C.C. Andino.',
      timestamp: '2026-03-05T16:15:00',
      isRead: true,
    },
    {
      id: 'm3',
      senderId: '2',
      receiverId: '1',
      content: '¡Perfecto! Nos vemos mañana entonces.',
      timestamp: '2026-03-05T16:30:00',
      isRead: false,
    },
  ],
  c2: [
    {
      id: 'm4',
      senderId: '3',
      receiverId: '1',
      content: 'Tu reserva ha sido confirmada.',
      timestamp: '2026-03-05T13:45:00',
      isRead: true,
    },
    {
      id: 'm5',
      senderId: '1',
      receiverId: '3',
      content: '¡Excelente! ¿En qué punto exacto nos recoge?',
      timestamp: '2026-03-05T13:50:00',
      isRead: true,
    },
    {
      id: 'm6',
      senderId: '1',
      receiverId: '3',
      content: 'Gracias por confirmar.',
      timestamp: '2026-03-05T14:00:00',
      isRead: true,
    },
  ],
};

// Mock trip history
export const mockTripHistory: Trip[] = [
  {
    id: 't1',
    route: mockRoutes[0],
    role: 'PASSENGER',
    date: '2026-02-28',
    rating: 5,
  },
  {
    id: 't2',
    route: mockRoutes[1],
    role: 'PASSENGER',
    date: '2026-02-25',
    rating: 4,
  },
  {
    id: 't3',
    route: mockRoutes[2],
    role: 'DRIVER',
    date: '2026-02-20',
    rating: 5,
  },
];

// Mock notifications
export const mockNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'BOOKING_REQUEST',
    title: 'Nueva solicitud de reserva',
    message: 'Carlos Rodríguez ha solicitado unirse a tu ruta.',
    isRead: false,
    createdAt: '2026-03-05T15:00:00',
  },
  {
    id: 'n2',
    type: 'NEW_MESSAGE',
    title: 'Nuevo mensaje',
    message: 'María López te ha enviado un mensaje.',
    isRead: false,
    createdAt: '2026-03-05T14:30:00',
  },
  {
    id: 'n3',
    type: 'TRIP_REMINDER',
    title: 'Recordatorio de viaje',
    message: 'Tu viaje sale mañana a las 7:30 AM.',
    isRead: true,
    createdAt: '2026-03-05T10:00:00',
  },
];

// Service functions with simulated delays
export const mockService = {
  // Routes
  async getRoutes(filters?: { origin?: string; destination?: string; date?: string }): Promise<Route[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    let routes = [...mockRoutes];
    
    if (filters?.origin) {
      routes = routes.filter(r => 
        r.origin.toLowerCase().includes(filters.origin!.toLowerCase())
      );
    }
    if (filters?.destination) {
      routes = routes.filter(r => 
        r.destination.toLowerCase().includes(filters.destination!.toLowerCase())
      );
    }
    
    return routes;
  },

  async getRouteById(id: string): Promise<Route | undefined> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockRoutes.find(r => r.id === id);
  },

  // Bookings
  async getBookings(): Promise<Booking[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockBookings;
  },

  async createBooking(routeId: string, seats: number): Promise<Booking> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const route = mockRoutes.find(r => r.id === routeId);
    if (!route) throw new Error('Route not found');
    
    return {
      id: `b${Date.now()}`,
      route,
      passenger: mockUsers[0],
      status: 'PENDING',
      seatsRequested: seats,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async updateBookingStatus(bookingId: string, status: 'CONFIRMED' | 'REJECTED'): Promise<Booking> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const booking = mockBookings.find(b => b.id === bookingId);
    if (!booking) throw new Error('Booking not found');
    
    return { ...booking, status, updatedAt: new Date().toISOString() };
  },

  // Chat
  async getConversations(): Promise<Conversation[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockConversations;
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockMessages[conversationId] || [];
  },

  async sendMessage(conversationId: string, content: string, senderId: string, receiverId: string): Promise<Message> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const newMessage: Message = {
      id: `m${Date.now()}`,
      senderId,
      receiverId,
      content,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    
    if (mockMessages[conversationId]) {
      mockMessages[conversationId].push(newMessage);
    }
    
    return newMessage;
  },

  // Trip history
  async getTripHistory(): Promise<Trip[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockTripHistory;
  },

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockNotifications;
  },
};
