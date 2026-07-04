import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

export default function SignInPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Login failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-sm bg-white border rounded-xl p-8">
                <div className="flex items-center gap-2 justify-center mb-6">
                    <Sparkles className="w-6 h-6 text-indigo-600" />
                    <span className="font-bold text-xl">InterviewAce</span>
                </div>

                <h1 className="text-xl font-semibold mb-6 text-center">Sign in to your account</h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in'}
                    </button>
                </form>

                <p className="text-sm text-slate-500 text-center mt-6">
                    Don&apos;t have an account?{' '}
                    <Link to="/sign-up" className="text-indigo-600 font-medium hover:text-indigo-700">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
