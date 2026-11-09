import { Link, Outlet, useNavigate } from 'react-router-dom';
import { PlusCircle, LogIn, LayoutDashboard } from 'lucide-react';
import Button from '../components/ui/Button';
import { useAppSelector } from '../app/hooks';
import { CivicFixLogo } from '../components/shared/CivicFixLogo';

export function PublicLayout() {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-paper flex flex-col text-ink">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-sage-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <CivicFixLogo size={32} />
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/feed"
              className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-forest-800 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-mist transition-colors"
            >
              <span className="hidden sm:inline">Public Feed & Map</span>
              <span className="sm:hidden">Feed</span>
            </Link>

            {user ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  navigate(
                    ['ward_admin', 'worker', 'admin', 'moderator'].includes(user.role)
                      ? '/ward/queue'
                      : '/citizen/dashboard',
                  )
                }
                className="text-xs sm:text-sm"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {['ward_admin', 'worker', 'admin', 'moderator'].includes(user.role)
                    ? 'Ward Console'
                    : 'My Dashboard'}
                </span>
                <span className="sm:hidden">Dashboard</span>
              </Button>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/login')}
                  className="text-xs sm:text-sm px-2.5 sm:px-3"
                >
                  <LogIn className="w-3.5 h-3.5" /> Log in
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/register')}
                  className="text-xs sm:text-sm px-2.5 sm:px-3"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Join Ward 14</span>
                  <span className="sm:hidden">Join</span>
                </Button>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Clean Modern Footer */}
      <footer className="bg-forest-900 text-slate-300 py-8 border-t border-forest-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div className="flex items-center gap-3">
              <CivicFixLogo size={28} textClassName="text-white" />
              <span className="hidden sm:inline text-slate-600">|</span>
              <span className="text-xs text-slate-400 font-medium">
                Transparent Neighbourhood Problem Resolution
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-400 font-medium">
              <Link to="/feed" className="hover:text-white transition-colors">
                Public Feed
              </Link>
              <Link to="/login" className="hover:text-white transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="hover:text-white transition-colors">
                Register Citizen
              </Link>
            </div>

            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} CivicFix. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default PublicLayout;
