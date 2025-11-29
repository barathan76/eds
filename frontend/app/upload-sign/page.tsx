'use client';

import { useState, useRef, useEffect, memo } from 'react';
import { api } from '@/lib/api';
import { Upload, FileText, CheckCircle, Loader2, Download, MousePointer2, Home, RotateCcw, AlertTriangle, ShieldCheck, X, PenTool, Hash, Sparkles, Scale, FileSearch, Calendar, Users, DollarSign, Globe } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Draggable from 'react-draggable';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Dynamically import react-pdf components to avoid SSR issues
const Document = dynamic(() => import('react-pdf').then(mod => mod.Document), {
    ssr: false,
    loading: () => <div className="text-slate-500">Loading PDF...</div>
});
const Page = dynamic(() => import('react-pdf').then(mod => mod.Page), {
    ssr: false,
    loading: () => <div className="text-slate-500">Loading Page...</div>
});

type PlacedItem = {
    id: string;
    type: 'digital' | 'user';
    x: number;
    y: number;
};

// Separate component to handle individual refs for Draggable
const DraggableItem = memo(({ item, sigId, userImage, onStop, onRemove, disabled }: {
    item: PlacedItem,
    sigId: string,
    userImage?: string,
    onStop: (id: string, x: number, y: number) => void,
    onRemove: (id: string) => void,
    disabled?: boolean
}) => {
    const nodeRef = useRef(null);

    return (
        <Draggable
            nodeRef={nodeRef}
            bounds="parent"
            position={{ x: item.x, y: item.y }}
            onStop={(e, data) => onStop(item.id, data.x, data.y)}
            disabled={disabled}
        >
            <div
                ref={nodeRef}
                className={`absolute top-0 left-0 z-10 bg-emerald-500/90 text-white px-4 py-2 rounded shadow-lg border border-emerald-400 flex items-center gap-2 whitespace-nowrap group ${disabled ? 'cursor-default opacity-80' : 'cursor-move'}`}
            >
                {item.type === 'user' ? (
                    userImage ? (
                        <img
                            src={userImage}
                            alt="Sig"
                            className="h-8 bg-white rounded p-0.5 pointer-events-none select-none"
                            draggable={false}
                        />
                    ) : (
                        <PenTool size={16} />
                    )
                ) : (
                    <Hash size={16} />
                )}

                <span className="font-mono text-sm select-none">
                    {item.type === 'user' ? 'My Signature' : sigId}
                </span>

                {!disabled && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(item.id);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove"
                    >
                        <X size={10} />
                    </button>
                )}
            </div>
        </Draggable>
    );
});

DraggableItem.displayName = 'DraggableItem';

export default function UploadSign() {
    const router = useRouter();
    const { user } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [email, setEmail] = useState('');
    const [step, setStep] = useState(1);
    const [docHash, setDocHash] = useState('');
    const [summary, setSummary] = useState('');
    const [isSigned, setIsSigned] = useState(false);
    const [sigData, setSigData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });
    const [placedItems, setPlacedItems] = useState<{ [page: number]: PlacedItem[] }>({});
    const [suggestedPlaces, setSuggestedPlaces] = useState<any[]>([]);
    const [legalAnalysis, setLegalAnalysis] = useState<any>(null);
    const [autoPlaced, setAutoPlaced] = useState(false);

    const pdfWrapperRef = useRef<HTMLDivElement>(null);
    const pageRef = useRef<HTMLDivElement>(null);

    // Configure PDF worker on mount
    useEffect(() => {
        import('react-pdf').then(mod => {
            mod.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.mjs`;
        });
    }, []);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    };

    const onPageLoadSuccess = (page: any) => {
        setPdfDimensions({ width: page.originalWidth, height: page.originalHeight });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStep(1);
            setIsSigned(false);
            setDocHash('');
            setSummary('');
            setPlacedItems({});
            setSuggestedPlaces([]);
            setLegalAnalysis(null);
            setAutoPlaced(false);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/upload-document', formData);
            setDocHash(res.data.doc_hash);
            setSummary(res.data.summary);
            setSuggestedPlaces(res.data.suggested_places || []);
            // Fallback to ensure it's not null if backend sends null
            setLegalAnalysis(res.data.legal_analysis || { summary_points: ["No analysis data"], red_flags: [], risk_score: 0 });

            if (res.data.is_signed) {
                setIsSigned(true);
            } else {
                setIsSigned(false);
                setStep(2);
            }
        } catch (err) {
            console.error(err);
            alert('Upload failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSign = async () => {
        const signerEmail = user ? user.email : email;
        if (!signerEmail || !docHash) return;
        setLoading(true);
        try {
            const res = await api.post('/sign', {
                doc_hash: docHash,
                signer_email: signerEmail,
                summary: summary
            });
            setSigData(res.data);
            setStep(3);
        } catch (err) {
            console.error(err);
            alert('Signing failed');
        } finally {
            setLoading(false);
        }
    };

    const addItem = (type: 'digital' | 'user') => {
        const newItem: PlacedItem = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            x: 50,
            y: 50 + (placedItems[pageNumber]?.length || 0) * 60 // Offset slightly
        };

        setPlacedItems(prev => ({
            ...prev,
            [pageNumber]: [...(prev[pageNumber] || []), newItem]
        }));
    };

    const autoPlaceItems = () => {
        if (suggestedPlaces.length === 0 || autoPlaced) return;

        const newItems: { [key: number]: PlacedItem[] } = { ...placedItems };
        const pageHeight = pdfDimensions.height || 842; // Fallback to A4 height if unknown

        suggestedPlaces.forEach(sp => {
            // Convert PDF coordinates (bottom-left) to Frontend (top-left)
            // Subtract ~40px to place signature ABOVE the line/text
            const y = pageHeight - sp.y - 40;

            if (!newItems[sp.page]) newItems[sp.page] = [];
            newItems[sp.page].push({
                id: Math.random().toString(36).substr(2, 9),
                type: 'user', // Default to user signature
                x: sp.x,
                y: y
            });
        });

        setPlacedItems(newItems);
        setAutoPlaced(true);
    };

    const updateItemPosition = (id: string, x: number, y: number) => {
        setPlacedItems(prev => ({
            ...prev,
            [pageNumber]: prev[pageNumber].map(item =>
                item.id === id ? { ...item, x, y } : item
            )
        }));
    };

    const removeItem = (id: string) => {
        setPlacedItems(prev => ({
            ...prev,
            [pageNumber]: prev[pageNumber].filter(item => item.id !== id)
        }));
    };

    const handleStampAndDownload = async () => {
        if (!file || !sigData || !pageRef.current || Object.keys(placedItems).length === 0) return;
        setLoading(true);

        const pageRect = pageRef.current.getBoundingClientRect();
        const scaleX = pdfDimensions.width / pageRect.width;
        const scaleY = pdfDimensions.height / pageRect.height;

        // Estimate signature height (approx 50px)
        const sigHeightPixels = 50;
        const sigHeightPoints = sigHeightPixels * scaleY;

        const stamps: any[] = [];
        Object.entries(placedItems).forEach(([pageNumStr, items]) => {
            const pageNum = parseInt(pageNumStr);
            items.forEach(item => {
                const x = item.x * scaleX;
                const y = pdfDimensions.height - (item.y * scaleY) - sigHeightPoints;
                stamps.push({ page: pageNum, x, y, type: item.type });
            });
        });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('sig_id', sigData.sig_id);
        formData.append('stamps', JSON.stringify(stamps));

        // Pass full signature data for deferred storage
        const signaturePayload = {
            sig_id: sigData.sig_id,
            doc_hash: docHash,
            signer_email: user ? user.email : email,
            signature: sigData.signature,
            timestamp: sigData.timestamp,
            summary: summary,
            user_image: user?.signature_image // Pass user image
        };
        formData.append('signature_data', JSON.stringify(signaturePayload));

        try {
            const res = await api.post('/stamp', formData, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `signed_${file.name}`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            setStep(4);
        } catch (err) {
            console.error(err);
            alert('Stamping failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col">
            <header className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-slate-400 hover:text-white">&larr; Back</Link>
                    <h1 className="text-xl font-bold">Sign Document</h1>
                </div>
                <div className="flex items-center gap-4">
                    {step >= 2 && <span className="text-sm text-slate-400">Hash: {docHash.substring(0, 8)}...</span>}
                    {step >= 3 && <span className="text-sm text-emerald-400">Signed</span>}
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: PDF Viewer */}
                <div className="flex-1 bg-slate-900/50 p-8 overflow-auto flex justify-center relative">
                    {file ? (
                        <div className="relative shadow-2xl" ref={pdfWrapperRef}>
                            <Document
                                file={file}
                                onLoadSuccess={onDocumentLoadSuccess}
                                className="border border-slate-700"
                            >
                                <div ref={pageRef} className="relative">
                                    <Page
                                        pageNumber={pageNumber}
                                        scale={scale}
                                        onLoadSuccess={onPageLoadSuccess}
                                        renderTextLayer={false}
                                        renderAnnotationLayer={false}
                                    />

                                    {/* Draggable Items - Step 3 & 4 */}
                                    {step >= 3 && placedItems[pageNumber]?.map(item => (
                                        <DraggableItem
                                            key={item.id}
                                            item={item}
                                            sigId={sigData.sig_id}
                                            userImage={user?.signature_image}
                                            onStop={updateItemPosition}
                                            onRemove={removeItem}
                                            disabled={step === 4}
                                        />
                                    ))}
                                </div>
                            </Document>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-slate-500">
                            <FileText size={64} className="mb-4 opacity-20" />
                            <p>Upload a document to view it here</p>
                        </div>
                    )}

                    {/* Page Controls */}
                    {numPages > 1 && (
                        <div className="absolute bottom-8 bg-slate-800 rounded-full px-4 py-2 flex items-center gap-4 shadow-lg">
                            <button disabled={pageNumber <= 1} onClick={() => setPageNumber(p => p - 1)} className="disabled:opacity-50">&larr;</button>
                            <span>{pageNumber} / {numPages}</span>
                            <button disabled={pageNumber >= numPages} onClick={() => setPageNumber(p => p + 1)} className="disabled:opacity-50">&rarr;</button>
                        </div>
                    )}
                </div>

                {/* Right: Sidebar Controls */}
                <div className="w-96 bg-slate-900 border-l border-slate-800 p-6 flex flex-col gap-8 overflow-y-auto">
                    {/* Step 1: Upload */}
                    <div className={`transition-opacity ${step !== 1 && 'opacity-50 pointer-events-none'}`}>
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">1</span>
                            Upload
                        </h2>
                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center hover:border-blue-500/50 transition-colors">
                                <input type="file" onChange={handleFileChange} accept=".pdf" className="hidden" id="file-upload" />
                                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                    <Upload className="text-slate-400" size={24} />
                                    <span className="text-slate-300 text-sm">{file ? file.name : 'Choose PDF'}</span>
                                </label>
                            </div>

                            {isSigned ? (
                                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg text-amber-200 space-y-3">
                                    <div className="flex items-center gap-2 text-amber-400 font-semibold">
                                        <AlertTriangle size={20} />
                                        <h3>Already Signed</h3>
                                    </div>
                                    <p className="text-sm opacity-80">This document has already been signed and registered in our system.</p>
                                    <Link href="/verify-upload" className="block w-full py-2 bg-slate-800 hover:bg-slate-700 rounded text-center text-sm font-medium transition-colors flex items-center justify-center gap-2">
                                        <ShieldCheck size={16} />
                                        Verify Document
                                    </Link>
                                </div>
                            ) : (
                                <button
                                    onClick={handleUpload}
                                    disabled={!file || loading}
                                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={16} /> : 'Process'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Step 2: Sign */}
                    <div className={`transition-opacity ${step !== 2 && 'opacity-50 pointer-events-none'}`}>
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">2</span>
                            Sign
                        </h2>
                        <div className="space-y-4">
                            {/* Smart Document Intelligence Card */}
                            {legalAnalysis && (
                                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold flex items-center gap-2 text-indigo-300">
                                            <FileSearch size={18} />
                                            Document Intelligence
                                        </h3>
                                        <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                                            {legalAnalysis.document_type || 'Unknown'}
                                        </span>
                                    </div>

                                    {/* Executive Summary */}
                                    {legalAnalysis.executive_summary && (
                                        <div className="text-xs text-slate-300 bg-slate-900/50 p-2 rounded border border-slate-700/50">
                                            <p className="opacity-80">{legalAnalysis.executive_summary}</p>
                                        </div>
                                    )}

                                    {/* Extracted Entities Table */}
                                    {legalAnalysis.entities && (
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            {legalAnalysis.entities.effective_date && (
                                                <div className="bg-slate-900/30 p-2 rounded flex items-center gap-2">
                                                    <Calendar size={14} className="text-slate-400" />
                                                    <div>
                                                        <p className="text-slate-500 text-[10px] uppercase">Effective Date</p>
                                                        <p className="text-slate-200">{legalAnalysis.entities.effective_date}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {legalAnalysis.entities.monetary_value && (
                                                <div className="bg-slate-900/30 p-2 rounded flex items-center gap-2">
                                                    <DollarSign size={14} className="text-slate-400" />
                                                    <div>
                                                        <p className="text-slate-500 text-[10px] uppercase">Value</p>
                                                        <p className="text-slate-200">{legalAnalysis.entities.monetary_value}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {legalAnalysis.entities.jurisdiction && (
                                                <div className="bg-slate-900/30 p-2 rounded flex items-center gap-2 col-span-2">
                                                    <Globe size={14} className="text-slate-400" />
                                                    <div>
                                                        <p className="text-slate-500 text-[10px] uppercase">Jurisdiction</p>
                                                        <p className="text-slate-200">{legalAnalysis.entities.jurisdiction}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {legalAnalysis.entities.parties && legalAnalysis.entities.parties.length > 0 && (
                                                <div className="bg-slate-900/30 p-2 rounded flex flex-col gap-1 col-span-2">
                                                    <div className="flex items-center gap-2">
                                                        <Users size={14} className="text-slate-400" />
                                                        <p className="text-slate-500 text-[10px] uppercase">Parties Involved</p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {legalAnalysis.entities.parties.map((party: string, i: number) => (
                                                            <span key={i} className="bg-slate-700 px-1.5 py-0.5 rounded text-[10px] text-slate-300">
                                                                {party}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Risk Score */}
                                    <div className="flex items-center gap-2 text-sm pt-2 border-t border-slate-700/50">
                                        <span className="text-slate-400">Risk Score:</span>
                                        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${legalAnalysis.risk_score > 50 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                style={{ width: `${legalAnalysis.risk_score}%` }}
                                            />
                                        </div>
                                        <span className={legalAnalysis.risk_score > 50 ? 'text-red-400' : 'text-emerald-400'}>
                                            {legalAnalysis.risk_score}/100
                                        </span>
                                    </div>

                                    {/* Red Flags */}
                                    {legalAnalysis.red_flags && legalAnalysis.red_flags.length > 0 && (
                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-red-400 flex items-center gap-1">
                                                <AlertTriangle size={12} /> Red Flags:
                                            </p>
                                            <ul className="text-xs text-red-300 list-disc list-inside pl-1">
                                                {legalAnalysis.red_flags.map((flag: string, i: number) => (
                                                    <li key={i}>{flag}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Validity Check */}
                                    {legalAnalysis.validity_check && (
                                        <div className="text-xs flex items-center justify-between text-slate-400 pt-1">
                                            <span>Status: {legalAnalysis.validity_check.status}</span>
                                            {legalAnalysis.validity_check.is_valid_format ? (
                                                <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={10} /> Valid Format</span>
                                            ) : (
                                                <span className="text-amber-400 flex items-center gap-1"><AlertTriangle size={10} /> Check Format</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <input
                                type="email"
                                value={user ? user.email : email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={!!user}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder="Signer Email"
                            />
                            <button
                                onClick={handleSign}
                                disabled={(!email && !user) || loading}
                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={16} /> : 'Generate Signature'}
                            </button>
                        </div>
                    </div>

                    {/* Step 3: Place & Download */}
                    <div className={`transition-opacity ${step !== 3 && 'opacity-50 pointer-events-none'}`}>
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">3</span>
                            Place & Download
                        </h2>
                        <div className="space-y-4">
                            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg text-sm text-blue-300 flex gap-2">
                                <MousePointer2 size={16} className="shrink-0 mt-0.5" />
                                <p>
                                    Place your Digital ID and Personal Signature on the document. You can place multiple items on any page.
                                </p>
                            </div>

                            {suggestedPlaces.length > 0 && (
                                <button
                                    onClick={autoPlaceItems}
                                    disabled={autoPlaced}
                                    className={`w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 rounded-lg font-medium text-white shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 ${autoPlaced ? 'opacity-50 cursor-not-allowed' : 'animate-pulse'}`}
                                >
                                    <Sparkles size={16} />
                                    {autoPlaced ? 'Auto-Placed' : `Auto-Place (${suggestedPlaces.length} found)`}
                                </button>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => addItem('digital')}
                                    className="py-3 border border-blue-500 text-blue-400 hover:bg-blue-500/10 rounded-lg font-medium transition-colors flex flex-col items-center gap-2"
                                >
                                    <Hash size={20} />
                                    <span className="text-xs">Add Digital ID</span>
                                </button>
                                <button
                                    onClick={() => addItem('user')}
                                    disabled={!user?.signature_image}
                                    className="py-3 border border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 rounded-lg font-medium transition-colors flex flex-col items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <PenTool size={20} />
                                    <span className="text-xs">Add My Signature</span>
                                </button>
                            </div>

                            {!user?.signature_image && (
                                <p className="text-xs text-amber-400 text-center">
                                    <Link href="/profile" className="underline hover:text-amber-300">Set up your signature</Link> to use it here.
                                </p>
                            )}

                            <button
                                onClick={handleStampAndDownload}
                                disabled={loading || Object.keys(placedItems).length === 0}
                                className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                            >
                                {loading ? <Loader2 className="animate-spin" size={16} /> : (
                                    <>
                                        <Download size={16} />
                                        Finish & Download
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Success */}
                    {step === 4 && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-xl text-center space-y-6">
                            <div>
                                <CheckCircle className="mx-auto text-emerald-400 mb-2" size={48} />
                                <h3 className="text-xl font-bold text-emerald-400">Success!</h3>
                                <p className="text-emerald-300/80 text-sm">Document signed and downloaded.</p>
                            </div>

                            <div className="space-y-3">
                                <Link
                                    href="/"
                                    className="block w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <Home size={18} />
                                    Back to Home
                                </Link>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="block w-full py-3 border border-slate-700 hover:bg-slate-800 rounded-lg font-medium transition-colors text-slate-400 hover:text-white flex items-center justify-center gap-2"
                                >
                                    <RotateCcw size={18} />
                                    Sign Another
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
