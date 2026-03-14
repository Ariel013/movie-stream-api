'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/shared/lib/api';
import { useAuthStore } from '@/shared/store/auth.store';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    setServerError('');
    try {
      const res = await api.post('/auth/login', data);
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Authentication failed. Please check your credentials.';
      setServerError(typeof msg === 'string' ? msg : 'Authentication failed.');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel – brand illustration */}
      <div className="hidden lg:flex w-1/2 gradient-primary flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decorative icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <span className="material-symbols-outlined text-white" style={{ fontSize: '600px' }}>
            bloodtype
          </span>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <span className="material-symbols-outlined filled text-white text-[20px]">bloodtype</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg font-headline leading-none">HEMOSAFE</h1>
              <p className="text-white/70 text-xs">National Blood Bank Management</p>
            </div>
          </div>

          <div className="max-w-sm">
            <h2 className="text-white font-extrabold text-4xl font-headline leading-tight mb-4">
              National<br />Blood Network
            </h2>
            <p className="text-white/80 text-base leading-relaxed">
              A unified platform connecting hospitals and blood banks across the nation to ensure life-saving blood is always available when needed.
            </p>
          </div>
        </div>

        {/* Stats card */}
        <div className="relative z-10 bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
          <div className="grid grid-cols-3 gap-6">
            {[
              { value: '142', label: 'Hospitals' },
              { value: '38', label: 'Blood Banks' },
              { value: '4.8K', label: 'Bags Available' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-white font-extrabold text-2xl font-headline">{stat.value}</p>
                <p className="text-white/70 text-xs mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel – login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <span className="material-symbols-outlined filled text-white text-[20px]">bloodtype</span>
            </div>
            <h1 className="font-bold text-lg font-headline">HEMOSAFE</h1>
          </div>

          {/* Header */}
          <div>
            <h2 className="text-3xl font-extrabold text-on-surface font-headline">Welcome back</h2>
            <p className="text-on-surface-variant mt-2 text-sm">Sign in to the National Blood Bank Portal</p>
          </div>

          {/* Warning banner */}
          <div className="flex items-center gap-3 p-4 bg-error-container rounded-xl border-l-4 border-primary">
            <span className="material-symbols-outlined text-primary text-[20px]">security</span>
            <div>
              <p className="text-xs font-bold text-on-surface uppercase tracking-wide">Official Personnel Only</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Unauthorized access is strictly prohibited and monitored.</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                  mail
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  placeholder="user@hemosafe.gov"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-error">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password')}
                  placeholder="••••••••••"
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-error">{errors.password.message}</p>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <div className="flex items-center gap-2 p-3 bg-error-container rounded-lg">
                <span className="material-symbols-outlined text-error text-[18px]">error</span>
                <p className="text-xs text-on-error-container font-medium">{serverError}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full gradient-primary text-white font-bold py-3.5 rounded-xl hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>
                  Authenticating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  Authenticate Session
                </>
              )}
            </button>
          </form>

          {/* Footer info */}
          <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-4 border-t border-outline-variant/20">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">devices</span>
              One device session only
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              TLS 1.3 Encryption
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
