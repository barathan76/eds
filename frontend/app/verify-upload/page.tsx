'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Upload, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function VerifyUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus(null);
        }
    };

    const handleVerify = async () => {
        if (!file) return;
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/verify-upload', formData);
            setStatus(res.data.status);
        } catch (err) {
            console.error(err);
            setStatus('ERROR');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <Link href="/" className="text-slate-400 hover:text-white mb-8 inline-block">&larr; Back to Home</Link>

            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Verify by Upload</h1>

                <div className="space-y-8">
                    <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900">
                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-purple-500/50 transition-colors">
                                <input type="file" onChange={handleFileChange} accept=".pdf" className="hidden" id="file-upload" />
                                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                    <Upload className="text-slate-400" size={32} />
                                    <span className="text-slate-300">{file ? file.name : 'Click to upload PDF to verify'}</span>
                                </label>
                            </div>
                            <button
                                onClick={handleVerify}
                                disabled={!file || loading}
                                className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : 'Check Authenticity'}
                            </button>
                        </div>
                    </div>

                    {status && (
                        <div className={`p-6 rounded-2xl border ${status === 'VALID' ? 'border-emerald-500 bg-emerald-500/10' :
                                status === 'TAMPERED' ? 'border-red-500 bg-red-500/10' :
                                    'border-orange-500 bg-orange-500/10'
                            }`}>
                            <div className="flex items-center gap-4">
                                {status === 'VALID' ? (
                                    <CheckCircle className="text-emerald-400" size={32} />
                                ) : (
                                    <AlertTriangle className={status === 'TAMPERED' ? 'text-red-400' : 'text-orange-400'} size={32} />
                                )}
                                <div>
                                    <h2 className={`text-xl font-bold ${status === 'VALID' ? 'text-emerald-400' :
                                            status === 'TAMPERED' ? 'text-red-400' :
                                                'text-orange-400'
                                        }`}>
                                        {status === 'VALID' ? 'Document is Authentic' :
                                            status === 'TAMPERED' ? 'Tampering Detected' :
                                                'Error Verifying'}
                                    </h2>
                                    <p className="text-slate-400 text-sm">
                                        {status === 'VALID' ? 'This document matches the signature in our database.' :
                                            status === 'TAMPERED' ? 'This document does not match any known signature. It may have been modified.' :
                                                'An error occurred during verification.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
