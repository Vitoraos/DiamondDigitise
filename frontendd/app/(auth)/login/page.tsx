
'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const { signInWithEmail } = useAuth();
  const searchParams = useSearchParams();
  const expired = searchParams.get('expired') === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');
    try {
      await signInWithEmail(email);
      setStatus('sent');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send magic link');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-4"> {/* Enhanced background, added padding */}
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-200"> {/* Increased shadow, added border */}
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">Staff Login</h1> {/* Larger, bolder title, centered */}
        {expired && <p className="text-sm text-amber-600 mb-4 text-center">Session expired. Please log in again.</p>} {/* Centered message */}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@yourhotel.com"
          className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent" {/* Enhanced input focus */}
          required
        />
        <button
          type="submit"
          disabled={status === 'sending'}
          className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition duration-300 ease-in-out transform hover:scale-105" {/* Added transition and scale on hover */}
        >
          {status === 'sending' ? 'Sending...' : status === 'sent' ? 'Check your email' : 'Send Magic Link'}
        </button>
        {status === 'sent' && <p className="mt-4 text-green-600 text-sm text-center">Magic link sent. Open the email to continue.</p>} {/* Centered message */}
        {errorMsg && <p className="mt-4 text-red-600 text-sm text-center">{errorMsg}</p>} {/* Centered message */}
      </form>
    </div>
  );
}
