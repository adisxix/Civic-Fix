import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, Compass, PlusCircle, Bell, User, LogOut, FileText } from 'lucide-react';
import { useLogoutMutation, useGetNotificationsQuery } from '../features/api/civicApi';
import { useAppSelector } from '../app/hooks';
import { cn } from '../lib/cn';
import { CivicFixLogo } from '../components/shared/CivicFixLogo';

export function CitizenLayout() {
  const { user } = useAppSelector((state) => state.auth);
  const [logout] = useLogoutMutation();
  const navigate = useNavigate();
  const { data: notifData } = useGetNotificationsQuery(undefined, {
    pollingInterval: 30000,
  });

  const notifications = notifData?.notifications || notifData?.data || [];
  const unreadCount = Array.isArray(notifications)
    ? notifications.filter((n) => !n.is_read).length
    : 0;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/citizen/dashboard', icon: Home },
    { label: 'Community Feed', path: '/feed', icon: Compass },
    { label: 'My Reports', path: '/citizen/reports', icon: FileText },
    { label: 'Report Issue', path: '/citizen/report', icon: PlusCircle, isPrimary: true },
    { label: 'Alerts', path: '/citizen/notifications', icon: Bell, badge: unreadCount },
    { label: 'Settings', path: '/citizen/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-5 shrink-0 justify-between">
        <div>
          <div className="mb-8">
            <CivicFixLogo size={32} tagline={true} />
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors',
                      item.isPrimary
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                        : isActive
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                    )
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge > 0 && (
                    <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User bar */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-bold text-slate-900 truncate">
                {user?.full_name || user?.email || 'Citizen'}
              </p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30">
          <CivicFixLogo size={28} />

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/citizen/notifications')}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 relative"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden bg-white border-t border-slate-200 grid grid-cols-5 p-2 sticky bottom-0 z-30">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-medium transition-colors',
                    isActive ? 'text-emerald-700 font-bold' : 'text-slate-500',
                  )
                }
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export default CitizenLayout;
