import { useState, useEffect } from 'react';
import { useUser, useAuth, UserButton } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { Sparkles, FileText } from 'lucide-react';
import ResumeUpload from '../components/ResumeUpload';
import api, { setAuthToken } from '../lib/api';

export default function Dashboard() {
    const { user } = useUser();
    const { getToken } = useAuth();
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch user's resumes when the page loads
    useEffect(() => {
        const fetchResumes = async () => {
            try {
                const token = await getToken();
                setAuthToken(token);
                const { data } = await api.get('/resumes');
                setResumes(data.resumes);
            } catch (err) {
                console.error('Failed to fetch resumes:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchResumes();
    }, [getToken]);

    // Called when a new resume is uploaded — add it to the list
    const handleUploaded = (newResume) => {
        setResumes((prev) => [newResume, ...prev]);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <nav className="flex justify-between items-center px-8 py-4 border-b bg-white">
                <Link to="/" className="flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-indigo-600" />
                    <span className="font-bold text-xl">InterviewAce</span>
                </Link>
                <UserButton afterSignOutUrl="/" />
            </nav>

            <main className="max-w-5xl mx-auto px-8 py-12">
                <h1 className="text-3xl font-bold mb-2">
                    Welcome, {user?.firstName || 'there'} 👋
                </h1>
                <p className="text-slate-600 mb-8">
                    Upload your resume to start practicing.
                </p>

                {/* Upload section */}
                <section className="mb-12">
                    <h2 className="text-xl font-semibold mb-4">Upload a resume</h2>
                    <ResumeUpload onUploaded={handleUploaded} />
                </section>

                {/* Resume list section */}
                <section>
                    <h2 className="text-xl font-semibold mb-4">Your resumes</h2>
                    {loading ? (
                        <div className="bg-white border rounded-xl p-8 text-center text-slate-500">
                            Loading...
                        </div>
                    ) : resumes.length === 0 ? (
                        <div className="bg-white border rounded-xl p-12 text-center text-slate-500">
                            No resumes yet. Upload one above to get started!
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {resumes.map((r) => (
                                <li
                                    key={r._id || r.id}
                                    className="bg-white border rounded-xl p-4 flex items-center gap-4 hover:shadow-sm transition"
                                >
                                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                                        <FileText className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-800 truncate">
                                            {r.fileName}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            Uploaded {new Date(r.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </main>
        </div>
    );
}