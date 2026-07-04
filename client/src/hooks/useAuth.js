import { useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../lib/api';

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    const { user, setUser, loading, setLoading } = context;

    const login = async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        setUser(data.user);
        return data.user;
    };

    const register = async (username, email, password) => {
        const { data } = await api.post('/auth/register', { username, email, password });
        setUser(data.user);
        return data.user;
    };

    const logout = async () => {
        try {
            await api.get('/auth/logout');
        } finally {
            setUser(null);
        }
    };

    useEffect(() => {
        const getMe = async () => {
            try {
                const { data } = await api.get('/auth/get-me');
                setUser(data.user);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        getMe();
    }, []);

    return { user, loading, login, register, logout };
};
