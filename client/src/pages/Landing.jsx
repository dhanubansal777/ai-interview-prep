import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { Sparkles } from 'lucide-react';

export default function Landing() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
            {/* Navigation */}
            <nav className="flex justify-between items-center px-8 py-4 border-b bg-white/50 backdrop-blur">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-indigo-600" />
                    <span className="font-bold text-xl">InterviewAce</span>
                </div>
                <div className="flex items-center gap-4">
                    <SignedOut>
                        <Link to="/sign-in">
                            <button className="px-4 py-2 text-slate-700 hover:text-slate-900">
                                Sign In
                            </button>
                        </Link>
                        <Link to="/sign-up">
                            <button className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                                Get Started
                            </button>
                        </Link>
                    </SignedOut>
                    <SignedIn>
                        <Link to="/dashboard">
                            <button className="px-4 py-2 text-slate-700 hover:text-slate-900">
                                Dashboard
                            </button>
                        </Link>
                        <UserButton afterSignOutUrl="/" />
                    </SignedIn>
                </div>
            </nav>

            {/* Hero */}
            <main className="max-w-5xl mx-auto px-8 py-20 text-center">
                <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Ace your tech interviews with AI
                </h1>
                <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
                    Upload your resume, pick a role, and practice with an AI interviewer that tailors questions to your background.
                </p>
                <SignedOut>
                    <Link to="/sign-up">
                        <button className="px-8 py-4 bg-indigo-600 text-white rounded-lg text-lg hover:bg-indigo-700 transition">
                            Start free practice →
                        </button>
                    </Link>
                </SignedOut>
                <SignedIn>
                    <Link to="/dashboard">
                        <button className="px-8 py-4 bg-indigo-600 text-white rounded-lg text-lg hover:bg-indigo-700 transition">
                            Go to dashboard →
                        </button>
                    </Link>
                </SignedIn>
            </main>
        </div>
    );
}