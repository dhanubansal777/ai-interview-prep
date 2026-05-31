import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Upload, FileText, Loader2, X, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { setAuthToken } from '../lib/api';

export default function ResumeUpload({ onUploaded }) {
    const { getToken } = useAuth();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (!selected) return;

        if (selected.type !== 'application/pdf') {
            toast.error('Please select a PDF file');
            return;
        }
        if (selected.size > 5 * 1024 * 1024) {
            toast.error('File too large (max 5MB)');
            return;
        }
        setFile(selected);
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        try {
            // Get the Clerk JWT and attach it to axios
            const token = await getToken();
            setAuthToken(token);

            // Build form data
            const formData = new FormData();
            formData.append('resume', file);

            // Send to backend
            const { data } = await api.post('/resumes/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            toast.success('Resume uploaded successfully!');
            setFile(null);

            // Tell the parent component (Dashboard) to refresh its list
            onUploaded?.(data.resume);
        } catch (err) {
            const message = err.response?.data?.error || 'Upload failed';
            toast.error(message);
            console.error('Upload error:', err);
        } finally {
            setUploading(false);
        }
    };

    // Format file size nicely
    const formatSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    };

    return (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-8 hover:border-indigo-300 transition">
            {!file ? (
                <label className="flex flex-col items-center cursor-pointer">
                    <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mb-3">
                        <Upload className="w-7 h-7 text-indigo-600" />
                    </div>
                    <span className="font-medium text-slate-800 mb-1">
                        Click to upload your resume
                    </span>
                    <span className="text-sm text-slate-500">
                        PDF only, max 5MB
                    </span>
                    <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </label>
            ) : (
                <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg w-full max-w-md">
                        <FileText className="w-8 h-8 text-indigo-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-800 truncate">{file.name}</p>
                            <p className="text-sm text-slate-500">{formatSize(file.size)}</p>
                        </div>
                        {!uploading && (
                            <button
                                onClick={() => setFile(null)}
                                className="p-1 hover:bg-slate-200 rounded"
                                aria-label="Remove file"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                Upload Resume
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}