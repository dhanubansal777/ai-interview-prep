import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Protected({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
                Loading...
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/sign-in" replace />;
    }

    return children;
}
