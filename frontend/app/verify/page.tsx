'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Search, CheckCircle, XCircle, Loader2, FileText } from 'lucide-react';
import Link from 'next/link';

export default function Verify() {
    const [sigId, setSigId] = useState('');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleVerify = async () => {
        if (!sigId) return;
        setLoading(true);
        setSearched(true);
        try {
            const res = await api.get(`/verify/${sigId}`);
            setResult(res.data);
        } catch (err) {
            console.error(err);
            setResult({ valid: false });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <Link href="/" className="text-slate-400 hover:text-white mb-8 inline-block">&larr; Back to Home</Link>

            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Verify by ID</h1>

                <div className="space-y-8">
                    <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900">
                        <div className="flex gap-4">
                            <input
                                type="text"
                                value={sigId}
                                onChange={(e) => setSigId(e.target.value)}
                                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-3 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                                placeholder="Enter Signature ID..."
                            />
                            <button
                                onClick={handleVerify}
                                disabled={!sigId || loading}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <Search size={20} />}
                                Verify
                            </button>
                        </div>
                    </div>

                    {searched && result && (
                        <div className={`p-6 rounded-2xl border ${result.valid ? 'border-emerald-500 bg-emerald-500/10' : 'border-red-500 bg-red-500/10'}`}>
                            <div className="flex items-center gap-4 mb-6">
                                {result.valid ? (
                                    <CheckCircle className="text-emerald-400" size={32} />
                                ) : (
                                    <XCircle className="text-red-400" size={32} />
                                )}
                                <div>
                                    <h2 className={`text-xl font-bold ${result.valid ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {result.valid ? 'Valid Signature' : 'Invalid Signature'}
                                    </h2>
                                    <p className="text-slate-400 text-sm">
                                        {result.valid ? 'The document signature is authentic.' : 'This signature ID does not exist or is invalid.'}
                                    </p>
                                </div>
                            </div>

                            {result.valid && (
                                <div className="space-y-6 border-t border-slate-800/50 pt-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-slate-400">Signer</p>
                                            <p className="font-medium">{result.signer_email}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-400">Timestamp</p>
                                            <p className="font-medium">{new Date(result.timestamp).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-400">Document Hash</p>
                                        <p className="font-mono text-xs text-slate-500 break-all">{result.doc_hash}</p>
                                    </div>

                                    {/* AI Summary Section */}
                                    {result.summary && (
                                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                            <div className="flex items-center gap-2 mb-2 text-blue-400">
                                                <FileText size={18} />
                                                <h3 className="font-semibold text-sm">Document Summary (AI Generated)</h3>
                                            </div>
                                            <p className="text-slate-300 text-sm leading-relaxed italic">
                                                "{result.summary}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
