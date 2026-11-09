import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Mail, Lock, ArrowRight, UserCheck, Sparkles } from 'lucide-react';
import { useLoginMutation } from '../../features/api/civicApi';
import { useAppDispatch } from '../../app/hooks';
import { setCredentials } from '../../features/auth/authSlice';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { CivicFixLogo } from '../../components/shared/CivicFixLogo';

const loginSchema = z.object({
  email: z.string().min(3, 'Please enter an email address'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

const DEMO_ACCOUNTS = [
  {
    role: 'Citizen',
    name: 'Asha Sharma',
    email: 'asha@demo.civicfix.test',
    password: 'Demo@1234',
    badge: 'Ward 14 Resident',
    desc: 'File complaints & verify fixes',
  },
  {
    role: 'Ward Lead',
    name: 'Ward 14 Lead',
    email: 'ward14.lead@demo.civicfix.test',
    password: 'Demo@1234',
    badge: 'Triage Admin',
    desc: 'Review queue & assign teams',
  },
  {
    role: 'Roads Officer',
    name: 'Roads Dept',
    email: 'roads@demo.civicfix.test',
    password: 'Demo@1234',
    badge: 'Field Specialist',
    desc: 'Upload proof & complete work',
  },
  {
    role: 'City Ops',
    name: 'City-Wide View',
    email: 'cityview@demo.civicfix.test',
    password: 'Demo@1234',
    badge: 'Central Analytics',
    desc: 'City-wide metrics & backlogs',
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
      const user = res?.data || res?.user || res;

      if (!user || !user.role) {
        throw new Error('Invalid user payload received from server');
      }

      dispatch(setCredentials(user));
      if (user.token) {
        localStorage.setItem('civicfix_token', user.token);
      }

      toast.success(`Welcome back, ${user.name || user.email}!`);

      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'citizen') {
        navigate('/citizen/dashboard', { replace: true });
      } else {
        navigate('/ward/queue', { replace: true });
      }
    } catch (err) {
      const msg =
        err?.data?.error?.message ||
        err?.data?.message ||
        err?.data?.detail ||
        err?.message ||
        'Failed to sign in. Please verify your credentials.';
      toast.error(msg);
    }
  };

  const handleQuickLogin = (demo) => {
    setValue('email', demo.email);
    setValue('password', demo.password);
    onSubmit({ email: demo.email, password: demo.password });
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <CivicFixLogo size={48} showText={false} />
        </div>
        <h2 className="text-3xl font-extrabold text-ink tracking-tight">Sign in to CivicFix</h2>
        <p className="mt-2 text-sm text-moss">
          Access your neighbourhood dashboard or{' '}
          <Link
            to="/register"
            className="font-semibold text-forest-800 hover:text-forest-700 underline"
          >
            create a new citizen account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-8 shadow-xl border border-sage-300 bg-white rounded-2xl">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <Input
                label="Email address"
                type="text"
                placeholder="you@example.com"
                icon={<Mail className="w-4 h-4 text-moss" />}
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4 text-moss" />}
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            <Button
              type="submit"
              variant="lime"
              className="w-full flex items-center justify-center gap-2 text-ink font-bold shadow-md mt-2"
              loading={isLoading}
            >
              Sign In
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Quick Demo Login Grid */}
          <div className="mt-8 pt-6 border-t border-sage-200">
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest-800">
                <UserCheck className="w-4 h-4 text-forest-700" />
                Demo Accounts (1-Click)
              </span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-forest-700 bg-lime-soft px-2 py-0.5 rounded-full border border-lime/50">
                <Sparkles className="w-3 h-3 text-forest-800" /> Instant Access
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {DEMO_ACCOUNTS.map((demo) => (
                <button
                  key={demo.email}
                  type="button"
                  onClick={() => handleQuickLogin(demo)}
                  className="text-left p-3 rounded-xl border border-sage-300 bg-paper/60 hover:border-forest-700 hover:bg-lime-soft/40 transition-all text-xs group cursor-pointer shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-ink group-hover:text-forest-800">{demo.role}</p>
                    <span className="text-[10px] font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-sage-300 text-forest-800">
                      {demo.badge}
                    </span>
                  </div>
                  <p className="text-moss truncate text-[11px] mt-0.5 font-medium">{demo.name}</p>
                  <p className="text-[10px] text-moss/80 mt-1 line-clamp-1">{demo.desc}</p>
                </button>
              ))}
            </div>

            <p className="mt-4 text-[11px] text-center text-moss font-medium">
              Default password for all demo accounts:{' '}
              <code className="text-forest-800 font-bold bg-mist px-1.5 py-0.5 rounded">
                Demo@1234
              </code>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
