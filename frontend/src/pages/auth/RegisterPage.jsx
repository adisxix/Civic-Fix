import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Mail, Lock, User, Phone, ArrowRight } from 'lucide-react';
import { useRegisterMutation, useGetMetaQuery } from '../../features/api/civicApi';
import { useAppDispatch } from '../../app/hooks';
import { setCredentials } from '../../features/auth/authSlice';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Card from '../../components/ui/Card';
import { CivicFixLogo } from '../../components/shared/CivicFixLogo';

const registerSchema = z
  .object({
    full_name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z
      .string()
      .regex(/^[0-9+ -]{10,15}$/, 'Enter a valid phone number (optional)')
      .optional()
      .or(z.literal('')),
    ward_id: z.coerce.number().optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  });

export default function RegisterPage() {
  const [registerUser, { isLoading }] = useRegisterMutation();
  const { data: meta } = useGetMetaQuery();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      ward_id: undefined,
      password: '',
      confirm_password: '',
    },
  });

  const onSubmit = async (values) => {
    try {
      const payload = {
        name: values.full_name,
        full_name: values.full_name,
        email: values.email,
        password: values.password,
        phone: values.phone || null,
        ward_id: values.ward_id ? Number(values.ward_id) : null,
      };

      const res = await registerUser(payload).unwrap();
      const user = res?.data || res?.user || res;

      if (!user || !user.role) {
        throw new Error('Invalid user payload received from server');
      }

      dispatch(setCredentials(user));
      if (user.token) {
        localStorage.setItem('civicfix_token', user.token);
      }

      toast.success('Account created successfully! Welcome to CivicFix.');
      navigate('/citizen/dashboard', { replace: true });
    } catch (err) {
      const msg =
        err?.data?.error?.message ||
        err?.data?.message ||
        err?.data?.detail ||
        err?.error ||
        err?.message ||
        'Failed to create account. Please try again.';
      toast.error(msg);
    }
  };

  const wardOptions = (meta?.wards || []).map((w) => ({
    value: w.id,
    label: `${w.name} (Ward ${w.code || w.id})`,
  }));

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <CivicFixLogo size={48} showText={false} />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Create Citizen Account
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-500">
            Sign in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <Card className="p-8 shadow-sm border border-slate-200">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <Input
                label="Full Name"
                placeholder="e.g. Asha Sharma"
                icon={<User className="w-4 h-4 text-slate-400" />}
                error={errors.full_name?.message}
                {...register('full_name')}
              />
            </div>

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Phone number (Optional)"
                  type="tel"
                  placeholder="+91 98765 43210"
                  icon={<Phone className="w-4 h-4 text-slate-400" />}
                  error={errors.phone?.message}
                  {...register('phone')}
                />
              </div>

              <div>
                <Select
                  label="Your Ward (Optional)"
                  placeholder="Select your ward"
                  options={wardOptions}
                  error={errors.ward_id?.message}
                  {...register('ward_id')}
                />
              </div>
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                placeholder="At least 8 characters"
                icon={<Lock className="w-4 h-4 text-slate-400" />}
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            <div>
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Re-enter password"
                icon={<Lock className="w-4 h-4 text-slate-400" />}
                error={errors.confirm_password?.message}
                {...register('confirm_password')}
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full flex items-center justify-center gap-2"
                loading={isLoading}
              >
                Create Account
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </form>

          <p className="mt-4 text-xs text-center text-slate-500">
            By creating an account, you agree to report accurate civic information. Your personal
            contact details are never made public.
          </p>
        </Card>
      </div>
    </div>
  );
}
