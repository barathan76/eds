'use client';

import Link from 'next/link';
import { ShieldCheck, FileSignature, Upload, Search, User as UserIcon, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, logout, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  if (!user) return null; // Prevent flash of content before redirect

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-950 text-white relative overflow-hidden">

      {/* Header */}
      <div className="absolute top-0 right-0 p-6 flex items-center gap-4 z-10">
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-full pl-4 pr-2 py-2 hover:bg-slate-800 transition-colors"
          >
            <span className="font-medium text-sm">{user.full_name}</span>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
              {user.full_name[0]}
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
              <Link href="/profile" className="block px-4 py-3 hover:bg-slate-800 flex items-center gap-2 text-sm">
                <UserIcon size={16} /> Profile
              </Link>
              <button onClick={logout} className="w-full text-left px-4 py-3 hover:bg-slate-800 flex items-center gap-2 text-sm text-red-400">
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 pointer-events-none"></div>
      <div className="max-w-4xl w-full text-center space-y-8">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          SecureDoc Sign
        </h1>
        <p className="text-xl text-slate-400">
          The most secure way to sign, verify, and audit your documents.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Link href="/upload-sign" className="group p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/20">
            <div className="h-12 w-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
              <FileSignature className="text-blue-400" size={24} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Sign Document</h3>
            <p className="text-slate-400 text-sm">Upload a PDF and generate a secure digital signature.</p>
          </Link>

          <Link href="/verify" className="group p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500 transition-all hover:shadow-lg hover:shadow-emerald-500/20">
            <div className="h-12 w-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
              <Search className="text-emerald-400" size={24} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Verify by ID</h3>
            <p className="text-slate-400 text-sm">Check the authenticity of a document using its Signature ID.</p>
          </Link>

          <Link href="/verify-upload" className="group p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500 transition-all hover:shadow-lg hover:shadow-purple-500/20">
            <div className="h-12 w-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
              <ShieldCheck className="text-purple-400" size={24} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Verify File</h3>
            <p className="text-slate-400 text-sm">Upload a file to check if it has been tampered with.</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
