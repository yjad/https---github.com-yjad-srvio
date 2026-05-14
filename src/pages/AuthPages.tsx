import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button, Input } from '@/components/shared';
import { loginSchema, registerSchema } from '@/schemas';
import { mockApi } from '@/api/mockApi';
import { Eye, EyeOff, Mail, Lock, User, Phone, Sparkles, CheckCircle2 } from 'lucide-react';

type RegisterForm = { name: string; email: string; password: string; phone: string; role: 'CUSTOMER' | 'PROVIDER' };

export function LoginPage() {
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        const key = issue.path.join('.');
        if (key) errs[key] = issue.message;
      });
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    try {
      await login(email, password);
      navigate('/');
    } catch { /* store handles error */ }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-900 text-white items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-accent-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl">⚡</div>
            <span className="text-2xl font-bold">srvio</span>
          </div>
          <h2 className="text-4xl font-bold mb-4">Welcome Back!</h2>
          <p className="text-primary-200 text-lg mb-8">Sign in to access your bookings, manage services, and connect with providers.</p>
          <div className="space-y-4">
            {['Book services in minutes', 'Track your orders in real-time', 'Leave reviews for providers'].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-accent-400 shrink-0" />
                <span className="text-primary-100">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center"><span className="text-white text-lg">⚡</span></div>
            <span className="text-xl font-bold">Srvio</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h1>
          <p className="text-gray-500 mb-8">Enter your credentials to access your account</p>

          {error && <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-xl text-danger-700 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-3 top-9 w-5 h-5 text-gray-400" />
              <Input label="Email Address" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} error={fieldErrors.email} className="pl-10" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-9 w-5 h-5 text-gray-400" />
              <Input label="Password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} error={fieldErrors.password} className="pl-10 pr-10" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <Button type="submit" variant="primary" size="lg" className="w-full" loading={isLoading}>Sign In</Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">Don&apos;t have an account? <Link to="/register" className="text-primary-600 font-medium hover:underline">Create one</Link></p>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-xl">
            <p className="text-xs font-medium text-gray-700 mb-2">Demo Accounts:</p>
            <div className="space-y-1 text-xs text-gray-500">
              <p><strong>Customer:</strong> john@email.com / user123</p>
              <p><strong>Provider:</strong> mike@email.com / provider123</p>
              <p><strong>Admin:</strong> admin@srvio.com / admin123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<RegisterForm>({ name: '', email: '', password: '', phone: '', role: 'CUSTOMER' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [pin, setPin] = useState<string[]>(['', '', '', '', '', '']);
  const [pinError, setPinError] = useState('');
  const [isSendingPin, setIsSendingPin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const verifiedEmail = useRef('');

  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const result = registerSchema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        const key = issue.path.join('.');
        if (key) errs[key] = issue.message;
      });
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setIsSendingPin(true);
    try {
      await mockApi.sendVerificationPin(form.email);
      verifiedEmail.current = form.email;
      setStep('verify');
    } catch {
      /* handled by UI */
    } finally {
      setIsSendingPin(false);
    }
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    const fullPin = pin.join('');
    if (fullPin.length !== 6) {
      setPinError('Please enter the complete 6-digit PIN');
      return;
    }
    setIsVerifying(true);
    try {
      await mockApi.verifyEmailPin(verifiedEmail.current, fullPin);
      await register(form);
      navigate('/');
    } catch (err) {
      setPinError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendPin = async () => {
    setIsSendingPin(true);
    setPinError('');
    setPin(['', '', '', '', '', '']);
    try {
      await mockApi.sendVerificationPin(verifiedEmail.current);
    } finally {
      setIsSendingPin(false);
    }
  };

  const handlePinChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, '');
    const newPin = [...pin];
    newPin[i] = digit;
    setPin(newPin);
    if (digit && i < 5) pinRefs.current[i + 1]?.focus();
  };

  const handlePinKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[i] && i > 0) pinRefs.current[i - 1]?.focus();
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-accent-600 to-accent-800 text-white items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-primary-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl">⚡</div>
            <span className="text-2xl font-bold">srvio</span>
          </div>
          <h2 className="text-4xl font-bold mb-4">Join Our Community</h2>
          <p className="text-accent-100 text-lg mb-8">Create an account to book services or offer your expertise to thousands of customers.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center"><span className="text-white text-lg">⚡</span></div>
            <span className="text-xl font-bold">Srvio</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-500 mb-8">Join srvio to book or offer services</p>

          {step === 'form' && error && <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-xl text-danger-700 text-sm">{error}</div>}

          {step === 'verify' ? (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-primary-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
                <p className="text-gray-500">
                  We sent a 6-digit verification PIN to<br />
                  <span className="font-medium text-gray-700">{form.email}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyPin} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                    Enter Verification PIN
                  </label>
                  <div className="flex justify-center gap-2">
                    {[0, 1, 2, 3, 4, 5].map(i => (
                      <input
                        key={i}
                        ref={el => { pinRefs.current[i] = el; }}
                        type="text"
                        maxLength={1}
                        inputMode="numeric"
                        value={pin[i]}
                        onChange={e => handlePinChange(i, e.target.value)}
                        onKeyDown={e => handlePinKeyDown(i, e)}
                        autoFocus={i === 0}
                        className="w-12 h-14 text-center text-xl font-bold border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    ))}
                  </div>
                  {pinError && <p className="text-xs text-danger-600 text-center mt-3">{pinError}</p>}
                </div>

                <Button type="submit" variant="primary" size="lg" className="w-full" loading={isVerifying}>
                  Verify PIN
                </Button>

                <div className="text-center space-y-2">
                  <button
                    type="button"
                    onClick={handleResendPin}
                    disabled={isSendingPin}
                    className="text-sm text-primary-600 hover:underline font-medium disabled:opacity-50"
                  >
                    {isSendingPin ? 'Sending...' : 'Resend PIN'}
                  </button>
                  <br />
                  <button
                    type="button"
                    onClick={() => { setStep('form'); setPin(['', '', '', '', '', '']); setPinError(''); }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    ← Back to registration
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-9 w-5 h-5 text-gray-400 z-10" />
                  <Input label="Full Name" placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} error={fieldErrors.name} className="pl-10" />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-9 w-5 h-5 text-gray-400 z-10" />
                  <Input label="Email Address" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} error={fieldErrors.email} className="pl-10" />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-9 w-5 h-5 text-gray-400 z-10" />
                  <Input label="Phone Number" placeholder="555-000-0000" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} error={fieldErrors.phone} className="pl-10" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-9 w-5 h-5 text-gray-400 z-10" />
                  <Input label="Password" type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} error={fieldErrors.password} className="pl-10 pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">I want to</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setForm({ ...form, role: 'CUSTOMER' })} className={`p-3 rounded-xl border-2 text-center transition-all ${form.role === 'CUSTOMER' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-gray-300'}`}>
                      <p className="font-medium text-sm">Book Services</p>
                      <p className="text-xs text-gray-500">As a Customer</p>
                    </button>
                    <button type="button" onClick={() => setForm({ ...form, role: 'PROVIDER' })} className={`p-3 rounded-xl border-2 text-center transition-all ${form.role === 'PROVIDER' ? 'border-accent-500 bg-accent-50 text-accent-700' : 'border-gray-200 hover:border-gray-300'}`}>
                      <p className="font-medium text-sm">Offer Services</p>
                      <p className="text-xs text-gray-500">As a Provider</p>
                    </button>
                  </div>
                </div>

                <Button type="submit" variant="primary" size="lg" className="w-full" loading={isLoading || isSendingPin}>Create Account</Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">Already have an account? <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link></p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
