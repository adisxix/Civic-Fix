import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Home } from 'lucide-react';
import Button from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mb-6">
        <ShieldCheck className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">404</h1>
      <h2 className="text-xl font-bold text-slate-700 mt-2">Page Not Found</h2>
      <p className="text-slate-500 text-sm max-w-md mt-2">
        The civic page or report you requested does not exist or may have been moved.
      </p>
      <div className="flex items-center gap-3 mt-6">
        <Link to="/">
          <Button variant="primary" className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            Go to Homepage
          </Button>
        </Link>
        <Link to="/feed">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Community Feed
          </Button>
        </Link>
      </div>
    </div>
  );
}
