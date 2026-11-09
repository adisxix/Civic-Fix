import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ShieldCheck, Mail, Lock, ArrowRight, UserCheck } from 'lucide-react';
import { useLoginMutation } from '../../features/api/civicApi';
import { useAppDispatch } from '../../app/hooks';
import { setCredentials } from '../../features/auth/authSlice';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const DEMO_ACCOUNTS = [
  {
    role: 'Citizen',
    name: 'Asha Sharma',
    email: 'asha@demo.civicfix.test',
    password: 'Demo@1234',
    badge: 'Ward 14 Citizen',
  },
  {
    role: 'Ward Officer',
    name: 'Ramesh Patel',
    email: 'ward14.lead@demo.civicfix.test',
    password: 'Demo@1234',
    badge: 'Ward 14 Lead',
  },
  {
    role: 'Field Worker',
    name: 'Suresh Kumar',
    email: 'roads@demo.civicfix.test',
    password: 'Demo@1234',
    badge: 'Roads Dept Worker',
  },
  {
    role: 'Moderator',
    name: 'Mod Supervisor',
    email: 'mod@demo.civicfix.test',
    password: 'Demo@1234',
    badge: 'Moderation Queue',
  },
];

export default function LoginPage() {
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || null;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      const res = await login(data).unwrap();
      dispatch(setCredentials(res.user));
      toast.success(`Welcome back, ${res.user.full_name || res.user.email}!`);

      if (from) {
        navigate(from, { replace: true });
      } else if (res.user.role === 'citizen') {
        navigate('/citizen/dashboard', { replace: true });
      } else {
        navigate('/ward/queue', { replace: true });
      }
    } catch (err) {
      toast.error(err?.data?.detail || 'Failed to sign in. Please verify your credentials.');
    }
  };

  const handleQuickLogin = (demo) => {
    setValue('email', demo.email);
    setValue('password', demo.password);
    onSubmit({ email: demo.email, password: demo.password });
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600 text-white mb-4 shadow-lg shadow-emerald-600/20">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Sign in to CivicFix
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Or{' '}
          <Link to="/register" className="font-semibold text-emerald-600 hover:text-emerald-500">
            register for a new citizen account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-8 shadow-sm border border-slate-200">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                icon={<Mail className="w-4 h-4 text-slate-400" />}
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4 text-slate-400" />}
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full flex items-center justify-center gap-2"
              loading={isLoading}
            >
              Sign In
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Demo Logins Section */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Quick Demo Logins (One-Click)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((demo) => (
                <button
                  key={demo.email}
                  type="button"
                  onClick={() => handleQuickLogin(demo)}
                  className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-xs group"
                >
                  <p className="font-semibold text-slate-800 group-hover:text-emerald-700">
                    {demo.role}
                  </p>
                  <p className="text-slate-500 truncate text-[11px]">{demo.name}</p>
                  <span className="inline-block mt-1 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                    {demo.badge}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-center text-slate-400">
              Default demo password for all accounts:{' '}
              <code className="text-slate-600 font-mono">Demo@1234</code>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
