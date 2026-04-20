# UN Wheels Frontend

A modern React-based frontend application for UniWheels, a platform designed to connect university students for ride-sharing and route management.

## 🚀 Features

- **User Authentication**: Secure login and registration system
- **Dashboard**: Personalized user dashboard with overview
- **Route Management**: Search, view, and publish routes
- **Booking System**: Manage ride bookings
- **Real-time Chat**: Communicate with other users
- **Profile Management**: Update personal information
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## 🛠️ Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with PostCSS
- **Routing**: React Router DOM v6
- **State Management**: React Context API
- **Maps**: Leaflet with React Leaflet
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

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## 🏗️ Project Structure

```
src/
├── App.tsx                      # Main application component
├── main.tsx                     # Application entry point
├── index.css                    # Global styles
├── vite-env.d.ts               # Vite environment types
├── assets/                      # Static assets (images, icons, etc.)
├── components/
│   ├── layout/                  # Layout components (Header, Sidebar, etc.)
│   └── ui/                      # Reusable UI components (Button, Card, Form, etc.)
├── context/
│   ├── AuthContext.tsx          # Authentication state management
│   └── mockAuthContext.tsx      # Mock authentication for testing
├── hooks/
│   ├── useApi.ts                # Custom hook for API requests
│   └── useForm.ts               # Custom hook for form handling
├── pages/
│   ├── auth/                    # Authentication pages (Login, Register, etc.)
│   ├── bookings/                # Ride bookings pages
│   ├── chat/                    # Chat and messaging functionality
│   ├── dashboard/               # User dashboard
│   ├── landing/                 # Landing page
│   ├── profile/                 # User profile management
│   └── routes/                  # Route search and management
├── services/
│   ├── api.ts                   # API client and request handling
│   ├── mockData.ts              # Mock data for development
│   └── index.ts                 # Services exports
└── types/                       # TypeScript type definitions
```

## 🔧 Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Code Style

This project uses ESLint for code linting. Make sure to run `npm run lint` before committing your changes.

### Building for Production

```bash
npm run build
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
