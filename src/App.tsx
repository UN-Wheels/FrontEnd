import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout, AuthLayout } from './components/layout';
import {
  LoginPage,
  RegisterPage,
  DashboardPage,
  ProfilePage,
  SearchRoutesPage,
  RouteDetailPage,
  PublishRoutePage,
  BookingsPage,
  ChatPage,
} from './pages';

function App() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protected dashboard routes */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/search" element={<SearchRoutesPage />} />
        <Route path="/routes/:id" element={<RouteDetailPage />} />
        <Route path="/publish" element={<PublishRoutePage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
