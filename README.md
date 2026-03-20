# UniWheels Frontend

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
- **Routing**: React Router DOM
- **State Management**: React Context API
- **Development Tools**: ESLint, TypeScript

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
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
├── components/
│   ├── layout/          # Layout components (AuthLayout, DashboardLayout, etc.)
│   └── ui/             # Reusable UI components (Button, Card, etc.)
├── context/            # React contexts (AuthContext)
├── hooks/              # Custom React hooks (useApi, useForm)
├── pages/              # Page components
│   ├── auth/           # Authentication pages
│   ├── bookings/       # Booking related pages
│   ├── chat/           # Chat functionality
│   ├── dashboard/      # Dashboard page
│   ├── profile/        # Profile management
│   └── routes/         # Route search and management
├── services/           # API services and mock data
└── types/              # TypeScript type definitions
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