import { Link, Outlet, useNavigate } from 'react-router-dom';
import { PlusCircle, LogIn, LayoutDashboard } from 'lucide-react';
import Button from '../components/ui/Button';
import { useAppSelector } from '../app/hooks';

export function PublicLayout() {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-emerald-800 font-extrabold text-xl tracking-tight"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-base shadow-sm">
              CF
            </div>
            <span>CivicFix</span>
          </Link>

          <nav className="flex items-center gap-3">
            <Link
              to="/feed"
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Public Feed & Map
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
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                {['ward_admin', 'worker', 'admin', 'moderator'].includes(user.role)
                  ? 'Ward Console'
                  : 'My Dashboard'}
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                  <LogIn className="w-3.5 h-3.5" /> Log in
                </Button>
                <Button variant="primary" size="sm" onClick={() => navigate('/register')}>
                  <PlusCircle className="w-3.5 h-3.5" /> Join Ward 14
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

      {/* Required Footer per SPEC 14.2 */}
      <footer className="bg-slate-900 text-slate-300 py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
          <p className="text-xs text-emerald-400 font-mono tracking-wide">
            CivicFix: Prototype proposal. Municipal integrations would need local-body approval and
            access.
          </p>
          <p className="text-xs text-slate-500">
            Built with React, FastAPI, aiomysql & Groq AI. Demonstrating transparent citizen
            engagement and ward triage.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default PublicLayout;
