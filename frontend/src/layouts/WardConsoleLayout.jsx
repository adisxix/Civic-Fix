import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Inbox, BarChart3, ShieldAlert, LogOut, Building2 } from 'lucide-react';
import { useLogoutMutation } from '../features/api/civicApi';
import { useAppSelector } from '../app/hooks';
import { cn } from '../lib/cn';
import { CivicFixLogo } from '../components/shared/CivicFixLogo';

export function WardConsoleLayout() {
  const { user } = useAppSelector((state) => state.auth);
  const [logout] = useLogoutMutation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { label: 'Triage Queue', path: '/ward/queue', icon: Inbox },
    { label: 'Analytics & Scorecard', path: '/ward/analytics', icon: BarChart3 },
    { label: 'Moderation Queue', path: '/ward/moderation', icon: ShieldAlert },
  ];

  const wardLabel = user?.ward_id ? `Ward ${user.ward_id} Operations` : 'City-Wide Console';

  return (
    <div className="min-h-screen bg-slate-100 flex text-slate-900">
      {/* Dark Slate/Forest Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col justify-between p-5 border-r border-slate-800 shrink-0 hidden md:flex">
        <div>
          <div className="mb-8">
            <CivicFixLogo size={32} textClassName="text-white" tagline={true} />
          </div>

          <div className="mb-6 p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
              <Building2 className="w-3.5 h-3.5" />
              {wardLabel}
            </div>
            <div className="text-[11px] text-slate-400">
              Logged in as{' '}
              <span className="text-white font-medium">{user?.full_name || 'Officer'}</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors',
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                    )
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User bar */}
        <div className="pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-bold text-white truncate">
                {user?.full_name || user?.email}
              </p>
              <p className="text-[11px] text-slate-400 capitalize truncate">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 h-16 px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-800 text-sm md:text-base">
              Ward Command Console
            </span>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Operations
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/feed')}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200"
            >
              View Public Feed
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default WardConsoleLayout;
