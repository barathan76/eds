'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2, Save, Upload, Trash2, PenTool, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

export default function Profile() {
    const { user, loading: authLoading, refreshProfile } = useAuth();
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [mode, setMode] = useState<'draw' | 'upload'>('draw');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [authLoading, user, router]);

    // Initialize canvas
    useEffect(() => {
        if (mode === 'draw' && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                ctx.strokeStyle = '#000';
            }
        }
    }, [mode]);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsDrawing(true);
        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
        setHasSignature(true);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    saveSignature(ev.target.result as string);
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const saveCanvasSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/png');
        saveSignature(dataUrl);
    };

    const saveSignature = async (base64Image: string) => {
        setSaving(true);
        try {
            await api.post('/me/signature', { signature_image: base64Image });
            await refreshProfile();
            alert('Signature saved successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to save signature');
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <header className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">My Profile</h1>
                    <Link href="/" className="text-slate-400 hover:text-white">Back to Home</Link>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* User Info */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-fit">
                        <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-3xl font-bold mb-4 mx-auto">
                            {user.full_name[0]}
                        </div>
                        <h2 className="text-xl font-bold text-center mb-1">{user.full_name}</h2>
                        <p className="text-slate-400 text-center text-sm mb-4">{user.email}</p>

                        <div className="border-t border-slate-800 pt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Account Type</span>
                                <span className="text-slate-300">{user.is_company ? 'Company' : 'Individual'}</span>
                            </div>
                            {user.is_company && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Company</span>
                                    <span className="text-slate-300">{user.company_name}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Signature Management */}
                    <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h2 className="text-xl font-bold mb-6">My Signature</h2>

                        {/* Current Signature */}
                        {user.signature_image && (
                            <div className="mb-8 p-4 bg-white rounded-lg">
                                <p className="text-slate-500 text-xs mb-2 uppercase font-bold tracking-wider">Current Signature</p>
                                <img src={user.signature_image} alt="Current Signature" className="max-h-24 object-contain" />
                            </div>
                        )}

                        <div className="flex gap-4 mb-6">
                            <button
                                onClick={() => setMode('draw')}
                                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${mode === 'draw' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                            >
                                <PenTool size={18} /> Draw
                            </button>
                            <button
                                onClick={() => setMode('upload')}
                                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${mode === 'upload' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                            >
                                <ImageIcon size={18} /> Upload
                            </button>
                        </div>

                        {mode === 'draw' ? (
                            <div className="space-y-4">
                                <div className="bg-white rounded-lg overflow-hidden cursor-crosshair touch-none">
                                    <canvas
                                        ref={canvasRef}
                                        width={600}
                                        height={200}
                                        className="w-full h-48"
                                        onMouseDown={startDrawing}
                                        onMouseMove={draw}
                                        onMouseUp={stopDrawing}
                                        onMouseLeave={stopDrawing}
                                    />
                                </div>
                                <div className="flex justify-end gap-4">
                                    <button
                                        onClick={clearCanvas}
                                        className="px-4 py-2 text-slate-400 hover:text-white flex items-center gap-2"
                                    >
                                        <Trash2 size={18} /> Clear
                                    </button>
                                    <button
                                        onClick={saveCanvasSignature}
                                        disabled={!hasSignature || saving}
                                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {saving ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Save Signature</>}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-slate-700 rounded-xl p-12 text-center hover:border-blue-500/50 transition-colors">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    id="sig-upload"
                                />
                                <label htmlFor="sig-upload" className="cursor-pointer flex flex-col items-center gap-4">
                                    <Upload className="text-slate-400" size={48} />
                                    <div>
                                        <p className="text-lg font-medium text-slate-300">Click to upload image</p>
                                        <p className="text-slate-500 text-sm">PNG, JPG up to 2MB</p>
                                    </div>
                                </label>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
