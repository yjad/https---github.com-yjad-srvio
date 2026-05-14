import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';

// Pages
import HomePage from '@/pages/HomePage';
import { LoginPage, RegisterPage } from '@/pages/AuthPages';
import ServiceListPage from '@/pages/ServiceListPage';
import ServiceDetailPage from '@/pages/ServiceDetailPage';
import BookingsPage from '@/pages/BookingsPage';
import ProviderDashboardPage from '@/pages/ProviderDashboardPage';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import CustomerDashboardPage from '@/pages/CustomerDashboardPage';
import CustomerServiceDashboardPage from '@/pages/CustomerServiceDashboardPage';
import ProfilePage from '@/pages/ProfilePage';
import AdminSettingsPage from '@/pages/AdminSettingsPage';
import BrowseDBPage from '@/pages/BrowseDBPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const init = useAuthStore(state => state.init);
  const user = useAuthStore(state => state.user);
  const { i18n } = useTranslation();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (user?.preferredLanguage && i18n.language !== user.preferredLanguage) {
      i18n.changeLanguage(user.preferredLanguage);
    }
  }, [user?.preferredLanguage, i18n]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/services" element={<ServiceListPage />} />
              <Route path="/services/:id" element={<ServiceDetailPage />} />
              
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />

              <Route path="/dashboard" element={
                <ProtectedRoute role="CUSTOMER">
                  <CustomerDashboardPage />
                </ProtectedRoute>
              } />
              
              <Route path="/bookings" element={
                <ProtectedRoute>
                  <BookingsPage />
                </ProtectedRoute>
              } />
              
              <Route path="/provider" element={
                <ProtectedRoute role="PROVIDER">
                  <ProviderDashboardPage />
                </ProtectedRoute>
              } />
              
              <Route path="/admin" element={
                <ProtectedRoute role="ADMIN">
                  <AdminDashboardPage />
                </ProtectedRoute>
              } />

              <Route path="/admin/settings" element={
                <ProtectedRoute role="ADMIN">
                  <AdminSettingsPage />
                </ProtectedRoute>
              } />

              <Route path="/customer-service" element={
                <ProtectedRoute role="CUSTOMER_SERVICE">
                  <CustomerServiceDashboardPage />
                </ProtectedRoute>
              } />
              <Route path="/browsedb" element={<BrowseDBPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
