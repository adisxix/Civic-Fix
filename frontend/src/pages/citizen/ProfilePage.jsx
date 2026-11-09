import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { User, Mail, Phone, Shield, Check } from 'lucide-react';
import { useGetMetaQuery, useUpdateProfileMutation } from '../../features/api/civicApi';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { setCredentials } from '../../features/auth/authSlice';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z
    .string()
    .regex(/^[0-9+ -]{10,15}$/, 'Enter a valid phone number (optional)')
    .optional()
    .or(z.literal('')),
  ward_id: z.coerce.number().optional(),
});

export default function ProfilePage() {
  const { user } = useAppSelector((state) => state.auth);
  const { data: meta } = useGetMetaQuery();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const dispatch = useAppDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      phone: user?.phone || '',
      ward_id: user?.ward_id || undefined,
    },
  });

  const onSubmit = async (values) => {
    try {
      const payload = {
        full_name: values.full_name,
        phone: values.phone || null,
        ward_id: values.ward_id ? Number(values.ward_id) : null,
      };

      const res = await updateProfile(payload).unwrap();
      const updatedUser = res.user || { ...user, ...payload };
      dispatch(setCredentials(updatedUser));
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err?.data?.detail || 'Failed to update profile');
    }
  };

  const wardOptions = (meta?.wards || []).map((w) => ({
    value: w.id,
    label: `${w.name} (Ward ${w.code || w.id})`,
  }));

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Your Account Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal details, primary ward preference, and contact information.
        </p>
      </div>

      {/* Profile Card */}
      <Card className="p-6 sm:p-8 space-y-6">
        {/* Account Info Pill */}
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl">
            {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user?.full_name || 'Civic User'}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                <Shield className="w-3 h-3 text-emerald-600" />
                {user?.role?.replace('_', ' ')}
              </span>
              <span className="text-xs text-slate-400">
                Member since {new Date(user?.created_at || Date.now()).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              label="Email Address (Locked)"
              value={user?.email || ''}
              disabled
              icon={<Mail className="w-4 h-4 text-slate-400" />}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Your email is used for account security and status notifications.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Phone Number"
                type="tel"
                placeholder="+91 98765 43210"
                icon={<Phone className="w-4 h-4 text-slate-400" />}
                error={errors.phone?.message}
                {...register('phone')}
              />
            </div>

            <div>
              <Select
                label="Primary Ward"
                placeholder="Select ward"
                options={wardOptions}
                error={errors.ward_id?.message}
                {...register('ward_id')}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              disabled={!isDirty || isLoading}
              loading={isLoading}
              className="flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Privacy Notice Card */}
      <Card className="p-5 bg-slate-50 border-slate-200 text-xs text-slate-600 space-y-1.5">
        <h4 className="font-bold text-slate-800">Privacy Guarantee</h4>
        <p>
          In accordance with CivicFix Non-negotiable Rule #10: Your email, phone number, and name
          are NEVER made public on the community feed or public issue detail pages. Only municipal
          staff and assigned ward workers can contact you regarding your reported civic issues.
        </p>
      </Card>
    </div>
  );
}
