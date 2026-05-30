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
    <div className="bg-surface min-h-screen flex flex-col">
      <main className="flex-grow flex flex-col md:flex-row">

        {/* Left – brand illustration */}
        <section className="hidden md:flex md:w-1/2 lg:w-3/5 bg-surface-container-low items-center justify-center p-12 relative overflow-hidden">
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-container/20 rounded-full -ml-48 -mb-48 pointer-events-none" />

          <div className="z-10 w-full max-w-2xl">
            {/* Card */}
            <div className="bg-surface-container-lowest p-8 xl:p-12 rounded-xl shadow-sm border border-outline-variant/15">
              <div className="mb-8">
                <span className="text-[10px] font-bold tracking-wider uppercase bg-primary/10 text-primary px-3 py-1 rounded-full">
                  Clinical Standards
                </span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-extrabold text-on-surface font-headline mb-6 leading-tight">
                Securing the <span className="text-primary">Clinical Pulse</span> of our nation.
              </h2>
              <p className="text-secondary text-lg mb-10 leading-relaxed max-w-lg">
                Access the National Blood Bank Management System with enterprise-grade security protocols. Real-time stock tracking and donor connectivity at your fingertips.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-4 p-4 bg-surface rounded-lg">
                  <div className="w-12 h-12 rounded-lg bg-primary-fixed flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary">shield_lock</span>
                  </div>
                  <div>
                    <p className="text-xs text-secondary font-medium">Data Integrity</p>
                    <p className="text-sm font-bold text-on-surface">ISO 27001 Certified</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-surface rounded-lg">
                  <div className="w-12 h-12 rounded-lg bg-secondary-container flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-secondary">sync</span>
                  </div>
                  <div>
                    <p className="text-xs text-secondary font-medium">Sync Status</p>
                    <p className="text-sm font-bold text-on-surface">Real-time Node</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="mt-12 flex justify-center">
              <img
                alt="Professional medical laboratory setting"
                className="w-full h-64 object-cover rounded-xl shadow-lg grayscale hover:grayscale-0 transition-all duration-500"
                src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80"
              />
            </div>
          </div>
        </section>

        {/* Right – login form */}
        <section className="flex-grow md:w-1/2 lg:w-2/5 flex items-center justify-center p-6 md:p-12 bg-surface-container-lowest">
          <div className="w-full max-w-md">

            {/* Brand header */}
            <div className="flex flex-col items-center mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined filled text-white text-3xl">bloodtype</span>
                </div>
                <h1 className="text-2xl font-extrabold text-on-surface tracking-tight font-headline">BloodConnect</h1>
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-on-surface font-headline mb-1">National Blood Bank</h2>
                <p className="text-sm text-secondary">Management System Portal</p>
              </div>
            </div>

            {/* Warning banner */}
            <div className="mb-8 p-4 rounded-lg bg-surface-container-low border-l-4 border-primary/40 flex items-start gap-4">
              <span className="material-symbols-outlined text-primary mt-0.5">info</span>
              <div>
                <p className="text-sm font-bold text-on-surface">Official Personnel Only</p>
                <p className="text-xs text-secondary leading-normal">
                  Unauthorized access attempt is monitored and reported to the National Healthcare Security Agency.
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2" htmlFor="email">
                  Institutional Email
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-secondary text-xl">mail</span>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register('email')}
                    placeholder="name@healthcare.gov"
                    className="w-full pl-12 pr-4 py-3.5 bg-surface border-none rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  />
                </div>
                {errors.email && <p className="mt-1.5 text-xs text-error">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest" htmlFor="password">
                    Security Password
                  </label>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-secondary text-xl">lock</span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    {...register('password')}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3.5 bg-surface border-none rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-secondary text-xl"
                  >
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </button>
                </div>
                {errors.password && <p className="mt-1.5 text-xs text-error">{errors.password.message}</p>}
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
                className="w-full gradient-primary text-white py-4 rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-primary/20 hover:opacity-95 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">refresh</span>
                    Authenticating...
                  </>
                ) : (
                  <>
                    <span>Authenticate Session</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            {/* Security footer */}
            <div className="mt-12 flex items-center justify-center gap-2 py-4 border-t border-outline-variant/10">
              <span className="material-symbols-outlined text-secondary text-lg">verified_user</span>
              <span className="text-xs font-medium text-secondary">One device session only</span>
              <span className="w-1 h-1 rounded-full bg-outline-variant" />
              <span className="text-xs font-medium text-secondary uppercase tracking-tighter">TLS 1.3 Encryption</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-low px-8 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-secondary font-medium">© 2024 National Healthcare System</div>
          <div className="flex items-center gap-8">
            <a className="text-xs font-bold text-on-surface-variant uppercase tracking-widest hover:text-primary transition-colors" href="#">Privacy Policy</a>
            <a className="text-xs font-bold text-on-surface-variant uppercase tracking-widest hover:text-primary transition-colors" href="#">Legal</a>
            <a className="text-xs font-bold text-on-surface-variant uppercase tracking-widest hover:text-primary transition-colors" href="#">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
