# UN Wheels Frontend

Frontend de UN-Wheels construido con **Next.js (App Router)**, TypeScript y Tailwind CSS.

## 🚀 Features

- **User Authentication**: Secure login and registration system
- **Dashboard**: Personalized user dashboard with overview
- **Route Management**: Search, view, and publish routes
- **Booking System**: Manage ride bookings
- **Real-time Chat**: Communicate with other users
- **Profile Management**: Update personal information
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (React 18) con TypeScript
- **Styling**: Tailwind CSS with PostCSS
- **State Management**: React Context API
- **Maps**: Leaflet with React Leaflet
- **Real-time**: Socket.io Client
- **Development Tools**: ESLint, TypeScript

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/UN-Wheels/FrontEnd
   cd FrontEnd
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

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 🔧 Environment variables

Crear `FrontEnd/.env` (o exportar variables en el shell) con:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

En Docker (stack completo), esta variable se pasa al build del frontend desde el `docker-compose.yml` raíz.

## 🐳 Docker Compose (stack completo desde /FrontEnd)

Este repo incluye un [docker-compose.yml](docker-compose.yml) dentro de `FrontEnd/` que levanta **todo el sistema** (Postgres, Mongo, RabbitMQ, microservicios, API Gateway y Frontend).

1) Configurar variables:

- Copia [env.example](env.example) a `FrontEnd/.env` y ajusta `JWT_SHARED_SECRET`.

2) Levantar todo:

```bash
docker compose up --build
```

Servicios:

- Frontend: `http://localhost:3000`
- API Gateway: `http://localhost:8080/health`
- RabbitMQ UI: `http://localhost:15672` (admin/admin)

Nota: este compose asume que existen las carpetas hermanas `../api-gateway`, `../chat-service`, `../notifications-service`, `../routes-reservations-service` y `../loggueo_service` (modo monorepo). Si lo subes a un repo *solo* FrontEnd, tendrás que cambiar los `build.context: ../...` por `image: ...` (imágenes publicadas) o incluir el código de los servicios.

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run start` - Start production server

## 🏗️ Project Structure (resumen)

El routing vive en `app/` (App Router) y el código reusable en `src/`.

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