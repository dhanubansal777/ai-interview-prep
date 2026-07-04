import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, FileText, ChevronRight, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ResumeUpload from '../components/ResumeUpload';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [jdDrafts, setJdDrafts] = useState({}); // { [resumeId]: jobDescription text }
    const [openJdFor, setOpenJdFor] = useState(null); // resumeId whose JD box is expanded
    const [generatingId, setGeneratingId] = useState(null); // resumeId currently generating a PDF

    // Fetch user's resumes when the page loads
    useEffect(() => {
        const fetchResumes = async () => {
            try {
                const { data } = await api.get('/resumes');
                setResumes(data.resumes);
            } catch (err) {
                console.error('Failed to fetch resumes:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchResumes();
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    // Called when a new resume is uploaded — add it to the list
    const handleUploaded = (newResume) => {
        setResumes((prev) => [newResume, ...prev]);
    };

    const handleGenerateResumePdf = async (resumeId) => {
        setGeneratingId(resumeId);
        try {
            const response = await api.post(
                `/resumes/${resumeId}/resume-pdf`,
                { jobDescription: jdDrafts[resumeId] || '' },
                { responseType: 'blob' }
            );
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `tailored-resume-${resumeId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Tailored resume generated!');
            setOpenJdFor(null);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to generate resume PDF');
        } finally {
            setGeneratingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <nav className="flex justify-between items-center px-8 py-4 border-b bg-white">
                <Link to="/" className="flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-indigo-600" />
                    <span className="font-bold text-xl">InterviewAce</span>
                </Link>
                <button onClick={handleLogout} className="px-4 py-2 text-slate-700 hover:text-slate-900">
                    Sign out
                </button>
            </nav>

            <main className="max-w-5xl mx-auto px-8 py-12">
                <h1 className="text-3xl font-bold mb-2">
                    Welcome, {user?.username || 'there'} 👋
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
                            {resumes.map((r) => {
                                const resumeId = r._id || r.id;
                                const isJdOpen = openJdFor === resumeId;
                                const isGenerating = generatingId === resumeId;
                                return (
                                    <li key={resumeId} className="bg-white border rounded-xl p-4 hover:shadow-sm transition">
                                        <div className="flex items-center gap-4">
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
                                            <button
                                                onClick={() => setOpenJdFor(isJdOpen ? null : resumeId)}
                                                className="px-3 py-2 border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-medium rounded-lg flex items-center gap-1 shrink-0"
                                            >
                                                <Download className="w-4 h-4" />
                                                Tailored resume
                                            </button>
                                            <Link
                                                to={`/interview/${resumeId}`}
                                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg flex items-center gap-1 shrink-0"
                                            >
                                                Start interview
                                                <ChevronRight className="w-4 h-4" />
                                            </Link>
                                        </div>

                                        {isJdOpen && (
                                            <div className="mt-4 pt-4 border-t">
                                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                                    Target job description (optional)
                                                </label>
                                                <textarea
                                                    value={jdDrafts[resumeId] || ''}
                                                    onChange={(e) =>
                                                        setJdDrafts((prev) => ({ ...prev, [resumeId]: e.target.value }))
                                                    }
                                                    placeholder="Paste a job description to tailor the resume, or leave blank for a general-purpose version..."
                                                    className="w-full h-24 p-3 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none resize-none text-sm"
                                                />
                                                <button
                                                    onClick={() => handleGenerateResumePdf(resumeId)}
                                                    disabled={isGenerating}
                                                    className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {isGenerating ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            Generating PDF...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Download className="w-4 h-4" />
                                                            Generate & download PDF
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            </main>
        </div>
    );
}