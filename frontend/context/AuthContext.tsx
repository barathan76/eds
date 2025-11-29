'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface User {
    id: number;
    full_name: string;
    email: string;
    is_company: boolean;
    company_name?: string;
    signature_image?: string;
}

interface AuthContextType {
    user: User | null;
    login: (token: string) => void;
    logout: () => void;
    loading: boolean;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchProfile(token);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchProfile = async (token: string) => {
        try {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const res = await api.get('/me');
            setUser(res.data);
        } catch (err) {
            console.error("Failed to fetch profile", err);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = (token: string) => {
        localStorage.setItem('token', token);
        fetchProfile(token);
    };

    const logout = () => {
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
        router.push('/login');
    };

    const refreshProfile = async () => {
        const token = localStorage.getItem('token');
        if (token) await fetchProfile(token);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
