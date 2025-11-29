'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Loader2, Lock, Mail, User, Building2 } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';

export default function Register() {
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        confirm_password: '',
        is_company: false,
        company_name: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirm_password) {
            setError("Passwords don't match");
            return;
        }

        setLoading(true);
        setError('');

        try {
            const payload = {
                full_name: formData.full_name,
                email: formData.email,
                password: formData.password,
                is_company: formData.is_company,
                ...(formData.is_company && { company_name: formData.company_name })
            };

            await api.post('/register', payload);

            // Auto login
            const loginFormData = new FormData();
            loginFormData.append('username', formData.email);
            loginFormData.append('password', formData.password);

            const res = await api.post('/login', loginFormData);
            login(res.data.access_token);
            router.push('/');
        } catch (err: any) {
            setError(JSON.stringify(err.response?.data) || err.message || 'Registration failed');
            console.error("Registration Error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
                <h1 className="text-2xl font-bold text-white mb-6 text-center">Create Account</h1>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-slate-400 text-sm mb-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 text-slate-500" size={18} />
                            <input
                                name="full_name"
                                required
                                value={formData.full_name}
                                onChange={handleChange}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500"
                                placeholder="John Doe"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-slate-400 text-sm mb-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 text-slate-500" size={18} />
                            <input
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_company"
                            name="is_company"
                            checked={formData.is_company}
                            onChange={handleChange}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="is_company" className="text-slate-300 text-sm select-none">
                            I represent a company
                        </label>
                    </div>

                    {formData.is_company && (
                        <div>
                            <label className="block text-slate-400 text-sm mb-1">Company Name</label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-2.5 text-slate-500" size={18} />
                                <input
                                    name="company_name"
                                    required
                                    value={formData.company_name}
                                    onChange={handleChange}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="Acme Inc."
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-slate-400 text-sm mb-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 text-slate-500" size={18} />
                            <input
                                type="password"
                                name="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-slate-400 text-sm mb-1">Confirm Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 text-slate-500" size={18} />
                            <input
                                type="password"
                                name="confirm_password"
                                required
                                value={formData.confirm_password}
                                onChange={handleChange}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : 'Create Account'}
                    </button>
                </form>

                <p className="mt-6 text-center text-slate-400 text-sm">
                    Already have an account?{' '}
                    <Link href="/login" className="text-blue-400 hover:text-blue-300">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}
