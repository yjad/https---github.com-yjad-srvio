import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Avatar } from '@/components/shared';
import { Menu, X, Home, Briefcase, Calendar, User, LogOut, LayoutDashboard, Shield, Settings, ChevronDown, LifeBuoy, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { notifications, removeNotification } = useUIStore();
  const { t } = useTranslation();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/', label: t('nav.home'), icon: Home },
    { path: '/services', label: t('nav.services'), icon: Briefcase },
  ];

  if (isAuthenticated) {
    if (user?.role === 'CUSTOMER') {
      navLinks.push({ path: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard });
      navLinks.push({ path: '/bookings', label: t('nav.bookings'), icon: Calendar });
    }
    if (user?.role === 'PROVIDER') {
      navLinks.push({ path: '/provider', label: t('nav.dashboard'), icon: LayoutDashboard });
      navLinks.push({ path: '/bookings', label: t('nav.bookings'), icon: Calendar });
    }
    if (user?.role === 'ADMIN') {
      navLinks.push({ path: '/admin', label: t('nav.admin'), icon: Shield });
      navLinks.push({ path: '/admin/settings', label: t('nav.settings'), icon: Settings });
    }
    if (user?.role === 'CUSTOMER_SERVICE') {
      navLinks.push({ path: '/customer-service', label: t('nav.support', 'Support'), icon: LifeBuoy });
      navLinks.push({ path: '/bookings', label: t('nav.bookings'), icon: Calendar });
    }
    navLinks.push({ path: '/disputes', label: 'Disputes', icon: ShieldAlert });
  }

  return (
    <>
      {/* Notification Toast */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map(n => (
            <div key={n.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium animate-fade-in min-w-[280px] ${n.type === 'success' ? 'bg-accent-600' : n.type === 'error' ? 'bg-danger-600' : 'bg-primary-600'}`}>
              <span className="flex-1">{n.message}</span>
              <button onClick={() => removeNotification(n.id)} className="p-0.5 hover:bg-white/20 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">⚡</span>
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:block">Srvio</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(link.path) ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {isAuthenticated && user ? (
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Avatar name={user.name} size="sm" />
                    <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">{user.name}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20 animate-fade-in">
                        <div className="px-4 py-2 border-b">
                          <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                          <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${user.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                              user.role === 'PROVIDER' ? 'bg-green-100 text-green-700' :
                                user.role === 'CUSTOMER_SERVICE' ? 'bg-purple-100 text-purple-700' :
                                  'bg-blue-100 text-blue-700'
                            }`}>
                            {user.role}
                          </span>
                        </div>
                        <div className="py-1">
                          <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <User className="w-4 h-4" /> {t('nav.profile')}
                          </Link>
                          {user.role === 'ADMIN' && (
                            <>
                              <Link to="/admin" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                <Shield className="w-4 h-4" /> {t('nav.admin')}
                              </Link>
                              <Link to="/admin/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                <Settings className="w-4 h-4" /> System Parameters
                              </Link>
                            </>
                          )}
                          {user.role === 'CUSTOMER_SERVICE' && (
                            <>
                              <Link to="/customer-service" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                <LifeBuoy className="w-4 h-4" /> Support
                              </Link>
                              <Link to="/customer-service/disputes" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                <ShieldAlert className="w-4 h-4" /> Disputes
                              </Link>
                            </>
                          )}
                          <Link to="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <Settings className="w-4 h-4" /> {t('nav.settings')}
                          </Link>
                        </div>
                        <div className="border-t py-1">
                          <button
                            onClick={() => { logout(); setProfileOpen(false); }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-danger-600 hover:bg-danger-50"
                          >
                            <LogOut className="w-4 h-4" /> {t('nav.sign_out')}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2">{t('nav.sign_in')}</Link>
                  <Link to="/register" className="text-sm font-medium bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">{t('nav.get_started')}</Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-2 animate-fade-in">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${isActive(link.path) ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <div className="flex gap-2 px-4 pt-2">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2 text-sm font-medium border border-gray-300 rounded-lg">{t('nav.sign_in')}</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2 text-sm font-medium bg-primary-600 text-white rounded-lg">{t('nav.get_started')}</Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </>
  );
}
