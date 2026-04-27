# UN Wheels Frontend

A modern Next.js-based frontend application for UniWheels, a platform designed to connect university students for ride-sharing and route management.

## 🚀 Features

- **User Authentication**: Secure login and registration system
- **Dashboard**: Personalized user dashboard with overview
- **Route Management**: Search, view, and publish routes
- **Booking System**: Manage ride bookings
- **Real-time Chat**: Communicate with other users
- **Profile Management**: Update personal information
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with React 18 and TypeScript
- **Styling**: Tailwind CSS
- **Routing**: Next.js App Router
- **State Management**: React Context API + TanStack Query
- **Maps**: Leaflet with React Leaflet
- **Real-time**: Socket.io Client
- **Development Tools**: ESLint, TypeScript

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/UN-Wheels/FrontEnd
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your API configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🏗️ Project Structure

```
app/                              # Next.js App Router
├── (auth)/                       # Authentication routes (grouped)
│   ├── login/
│   └── register/
├── (dashboard)/                  # Protected dashboard routes
│   ├── dashboard/
│   ├── routes/
│   ├── bookings/
│   └── profile/
├── api/                          # API routes
├── globals.css                   # Global styles
├── layout.tsx                    # Root layout
├── page.tsx                      # Home/Landing page
└── providers.tsx                 # Client providers (Query, Auth, etc.)

src/
├── assets/                       # Static assets (images, icons, etc.)
├── components/
│   ├── layout/                   # Layout components (Header, Sidebar, etc.)
│   └── ui/                       # Reusable UI components (Button, Card, Form, etc.)
├── context/
│   └── AuthContext.tsx           # Authentication state management
├── hooks/
│   ├── useApi.ts                 # Custom hook for API requests
│   └── useForm.ts                # Custom hook for form handling
├── services/
│   ├── api.ts                    # API client and request handling
│   └── index.ts                  # Services exports
├── types/                        # TypeScript type definitions
└── views/                        # Page-level components
```

## 🔧 Development

### Prerequisites

- Node.js (v18 or higher)
- npm

### Environment Variables

Create a `.env.local` file with the following variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### Building for Production

```bash
npm run build
npm run start
```
```

The built files will be in the `dist/` directory.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.