import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Registration, SPORTS_LIST, INITIAL_REGISTRATIONS } from './types';
import DigitalCard from './components/DigitalCard';
import RegistrationForm from './components/RegistrationForm';
import { 
  Trophy, Search, Award, Activity, Flame, 
  Menu, X, Info, Check, UserCheck, Sparkles, Layout, Mail, Phone, ExternalLink, ShieldCheck, Edit3, CheckCircle, XCircle, LogOut
} from 'lucide-react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, updateDoc, collection, onSnapshot, query, where, deleteDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import AuthScreen from './components/AuthScreen';
import AdminPortal from './components/AdminPortal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Load registrations from localStorage or fallback to INITIAL_REGISTRATIONS
  const [registrations, setRegistrations] = useState<Registration[]>(() => {
    const saved = localStorage.getItem('asc_registrations_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Registration[];
        return parsed.filter(r => r.id !== 'ASC-2026-1024' && r.id !== 'ASC-2026-1152');
      } catch (e) {
        console.error("Failed to parse registrations", e);
      }
    }
    return INITIAL_REGISTRATIONS; // pre-populate with default registrations
  });

  const [activeTab, setActiveTab] = useState<'home' | 'register' | 'student-corner' | 'admin'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Registration | null>(null);
  const [searchError, setSearchError] = useState('');
  const [successRegistration, setSuccessRegistration] = useState<Registration | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (!user || user.email !== 'rohan.dey1206@gmail.com') {
        setActiveTab(prev => prev === 'admin' ? 'home' : prev);
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to Firestore registrations with elegant error catching (swallows permission errors)
  useEffect(() => {
    const q = query(collection(db, 'registrations'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Registration[] = [];
      snapshot.forEach((docSnap) => {
        const reg = docSnap.data() as Registration;
        if (reg.id !== 'ASC-2026-1024' && reg.id !== 'ASC-2026-1152') {
          list.push(reg);
        } else {
          // Attempt to delete it from Firestore permanently if it exists
          deleteDoc(docSnap.ref).catch((err) => console.warn("Failed to delete stale registration:", err));
        }
      });
      
      if (list.length > 0) {
        // Merge list with any unique INITIAL_REGISTRATIONS
        const merged = [...list];
        INITIAL_REGISTRATIONS.forEach(init => {
          if (!merged.some(r => r.id === init.id || r.email === init.email || r.studentId === init.studentId)) {
            merged.push(init);
          }
        });
        setRegistrations(merged);
      } else {
        // Seed if empty
        setRegistrations(INITIAL_REGISTRATIONS);
        INITIAL_REGISTRATIONS.forEach(async (init) => {
          try {
            await setDoc(doc(db, 'registrations', init.id), init);
          } catch (e) {
            console.warn("Failed to seed registration to Firestore (likely permission denied):", e);
          }
        });
      }
    }, (error) => {
      console.warn("Firestore collection list read restricted or permission denied:", error.message);
    });
    return () => unsubscribe();
  }, []);

  // Listen specifically to the logged-in user's registration (bypasses full collection read restrictions)
  useEffect(() => {
    if (!currentUser || !currentUser.email) return;

    const q = query(
      collection(db, 'registrations'), 
      where('email', '==', currentUser.email)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.forEach((doc) => {
        const data = doc.data() as Registration;
        setRegistrations(prev => {
          if (prev.some(r => r.id === data.id)) {
            return prev.map(r => r.id === data.id ? data : r);
          } else {
            return [data, ...prev];
          }
        });
      });
    }, (error) => {
      console.warn("Firestore user-specific registration read restricted or permission denied:", error.message);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Sync registrations with localStorage
  useEffect(() => {
    localStorage.setItem('asc_registrations_v2', JSON.stringify(registrations));
  }, [registrations]);

  // Sync default selectedStudent if empty
  useEffect(() => {
    if (registrations.length > 0 && !selectedStudent) {
      // If user is logged in, find their own registration
      const userReg = currentUser 
        ? registrations.find(r => r.email === currentUser.email || (r as any).userId === currentUser.uid)
        : null;
      setSelectedStudent(userReg || registrations[0]);
    }
  }, [registrations, selectedStudent, currentUser]);

  // Handle a new student registration
  const handleRegister = async (newRegData: Omit<Registration, 'id' | 'registrationDate'>) => {
    if (!currentUser) return;
    const nextNumericId = 1000 + registrations.length + 1;
    const registrationId = `ASC-2026-${nextNumericId}`;
    const newReg: Registration & { userId?: string } = {
      ...newRegData,
      id: registrationId,
      userId: currentUser.uid,
      registrationDate: new Date().toISOString(),
      status: 'Pending'
    };

    try {
      await setDoc(doc(db, 'registrations', registrationId), newReg);
      setSuccessRegistration(newReg);
      setSelectedStudent(newReg);
      setActiveTab('student-corner');
    } catch (e) {
      console.error("Error saving registration to Firestore", e);
    }
  };

  // Update registration status
  const handleUpdateStatus = async (id: string, status: 'Pending' | 'Approved' | 'Rejected') => {
    setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    if (selectedStudent && selectedStudent.id === id) {
      setSelectedStudent(prev => prev ? { ...prev, status } : null);
    }
    try {
      await updateDoc(doc(db, 'registrations', id), { status });
    } catch (e) {
      console.error("Failed to update status in Firestore:", e);
    }
  };

  // Delete registration
  const handleDeleteRegistration = async (id: string) => {
    setRegistrations(prev => prev.filter(r => r.id !== id));
    if (selectedStudent && selectedStudent.id === id) {
      setSelectedStudent(null);
    }
    try {
      await deleteDoc(doc(db, 'registrations', id));
    } catch (e) {
      console.error("Failed to delete from Firestore:", e);
    }
  };

  // Add registration from admin side
  const handleAdminAddRegistration = async (newRegData: Omit<Registration, 'id' | 'registrationDate'>) => {
    const nextNumericId = 1000 + registrations.length + 1;
    const registrationId = `ASC-2026-${nextNumericId}`;
    const newReg: Registration = {
      ...newRegData,
      id: registrationId,
      registrationDate: new Date().toISOString(),
      status: 'Approved' // auto-approved from admin end
    };

    setRegistrations(prev => [newReg, ...prev]);

    try {
      await setDoc(doc(db, 'registrations', registrationId), newReg);
    } catch (e) {
      console.error("Error saving admin-created registration:", e);
    }
  };

  // Update card skins and avatar selections dynamically
  const handleSkinChange = async (studentId: string, skinId: string) => {
    setRegistrations(prev => prev.map(reg => 
      reg.id === studentId ? { ...reg, cardSkin: skinId } : reg
    ));
    if (selectedStudent && selectedStudent.id === studentId) {
      setSelectedStudent(prev => prev ? { ...prev, cardSkin: skinId } : null);
    }

    try {
      await updateDoc(doc(db, 'registrations', studentId), { cardSkin: skinId });
    } catch (e) {
      console.warn("Could not sync skin to Firestore:", e);
    }
  };

  const handleAvatarChange = async (studentId: string, avatarId: string) => {
    setRegistrations(prev => prev.map(reg => 
      reg.id === studentId ? { ...reg, avatarPresetId: avatarId, avatarUrl: undefined } : reg
    ));
    if (selectedStudent && selectedStudent.id === studentId) {
      setSelectedStudent(prev => prev ? { ...prev, avatarPresetId: avatarId, avatarUrl: undefined } : null);
    }

    try {
      await updateDoc(doc(db, 'registrations', studentId), { avatarPresetId: avatarId, avatarUrl: null });
    } catch (e) {
      console.warn("Could not sync avatar to Firestore:", e);
    }
  };

  const handlePhotoUpload = async (studentId: string, base64: string) => {
    setRegistrations(prev => prev.map(reg => 
      reg.id === studentId ? { ...reg, avatarUrl: base64 } : reg
    ));
    if (selectedStudent && selectedStudent.id === studentId) {
      setSelectedStudent(prev => prev ? { ...prev, avatarUrl: base64 } : null);
    }

    try {
      await updateDoc(doc(db, 'registrations', studentId), { avatarUrl: base64 });
    } catch (e) {
      console.warn("Could not sync photo to Firestore:", e);
    }
  };

  const [editingStudent, setEditingStudent] = useState<Registration | null>(null);

  const handleSaveStudent = async (updatedStudent: Registration) => {
    setRegistrations(prev => prev.map(reg => 
      reg.id === updatedStudent.id ? updatedStudent : reg
    ));
    if (selectedStudent && selectedStudent.id === updatedStudent.id) {
      setSelectedStudent(updatedStudent);
    }
    setEditingStudent(null);

    try {
      await setDoc(doc(db, 'registrations', updatedStudent.id), updatedStudent);
    } catch (e) {
      console.error("Error saving updated student to Firestore:", e);
    }
  };

  // Student Corner Card Search lookup
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setSearchError('Please enter a Student ID or Email address.');
      return;
    }

    const found = registrations.find(reg => 
      reg.studentId.toLowerCase() === query || 
      reg.email.toLowerCase() === query ||
      reg.fullName.toLowerCase().includes(query)
    );

    if (found) {
      setSelectedStudent(found);
      setSearchError('');
    } else {
      setSearchError('No matching enrollment found. Please check your Student ID or register a new membership.');
    }
  };

  const currentUserRegistration = currentUser 
    ? registrations.find(r => r.email === currentUser.email || (r as any).userId === currentUser.uid)
    : null;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-amber-500/30 selection:text-amber-100 overflow-x-hidden pb-12">
      
      {/* Dynamic Cyber Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Floating Header Nav Bar */}
      <header className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-md border-b border-slate-900 px-4 py-3.5 sm:px-6 md:px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 flex items-center justify-center rounded-lg shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <Trophy className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex flex-col">
                <h1 className="text-xl font-black tracking-tighter uppercase leading-none text-white">Adamas</h1>
                <p className="text-[9px] text-amber-500 font-bold tracking-[0.2em] uppercase leading-none mt-1">Sports Club</p>
              </div>
            </div>
          </div>

          {/* Desktop Tab Controllers & Auth Actions */}
          <div className="hidden md:flex items-center gap-4">
            <nav className="flex gap-1.5 bg-slate-900/50 border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => { setActiveTab('home'); setSuccessRegistration(null); }}
                className={`px-3.5 py-1.5 rounded-lg text-[10px] font-mono tracking-widest font-bold uppercase transition-all duration-300 cursor-pointer ${
                  activeTab === 'home' 
                    ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)] font-black' 
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => { setActiveTab('register'); setSuccessRegistration(null); }}
                className={`px-3.5 py-1.5 rounded-lg text-[10px] font-mono tracking-widest font-bold uppercase transition-all duration-300 cursor-pointer ${
                  activeTab === 'register' 
                    ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)] font-black' 
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                Registration
              </button>
              <button
                onClick={() => { setActiveTab('student-corner'); setSuccessRegistration(null); }}
                className={`px-3.5 py-1.5 rounded-lg text-[10px] font-mono tracking-widest font-bold uppercase transition-all duration-300 cursor-pointer flex items-center gap-1 ${
                  activeTab === 'student-corner' 
                    ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)] font-black' 
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                <span>Student Corner</span>
                <Sparkles className="w-3.5 h-3.5" />
              </button>
              {currentUser?.email === 'rohan.dey1206@gmail.com' && (
                <button
                  onClick={() => { setActiveTab('admin'); setSuccessRegistration(null); }}
                  className={`px-3.5 py-1.5 rounded-lg text-[10px] font-mono tracking-widest font-bold uppercase transition-all duration-300 cursor-pointer flex items-center gap-1 ${
                    activeTab === 'admin' 
                      ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)] font-black' 
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  <span>Admin Panel</span>
                  <ShieldCheck className="w-3.5 h-3.5" />
                </button>
              )}
            </nav>

            {currentUser ? (
              <div className="flex items-center gap-3 bg-slate-900/40 border border-slate-800 pl-3.5 pr-2 py-1.5 rounded-xl">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-white leading-tight">{currentUser.displayName || 'Athlete'}</span>
                  <span className="text-[9px] font-mono text-zinc-500 leading-none">{currentUser.email}</span>
                </div>
                <button
                  onClick={() => signOut(auth)}
                  title="Sign Out"
                  className="p-2 bg-slate-950 hover:bg-red-500/10 hover:border-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800 rounded-lg transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setActiveTab('register'); setSuccessRegistration(null); }}
                className="px-4 py-2 bg-slate-950 border border-slate-800 hover:border-amber-500/30 text-amber-500 font-mono text-[10px] font-bold tracking-widest uppercase rounded-xl transition-all cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle button */}
          <div className="flex md:hidden items-center gap-2">
            {currentUser && (
              <div className="flex items-center gap-1.5 bg-slate-900/40 border border-slate-800 px-2.5 py-1 rounded-lg">
                <span className="text-[10px] font-bold text-slate-300 max-w-[80px] truncate">{currentUser.displayName || 'Athlete'}</span>
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg cursor-pointer transition-all"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 text-white" /> : <Menu className="w-4 h-4 text-slate-300" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden sticky top-[71px] z-40 bg-[#020617] border-b border-slate-900 overflow-hidden"
          >
            <div className="px-4 py-5 space-y-4 max-w-7xl mx-auto bg-[#020617]/95 backdrop-blur-md">
              <nav className="flex flex-col gap-2">
                <button
                  onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); setSuccessRegistration(null); }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-mono tracking-wider font-bold uppercase transition-all duration-300 flex items-center gap-3 ${
                    activeTab === 'home' 
                      ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.25)] font-black' 
                      : 'bg-slate-900/40 border border-slate-850 text-slate-400 hover:text-slate-100'
                  }`}
                >
                  <Layout className="w-4 h-4 shrink-0" />
                  <span>Overview</span>
                </button>
                
                <button
                  onClick={() => { setActiveTab('register'); setMobileMenuOpen(false); setSuccessRegistration(null); }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-mono tracking-wider font-bold uppercase transition-all duration-300 flex items-center gap-3 ${
                    activeTab === 'register' 
                      ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.25)] font-black' 
                      : 'bg-slate-900/40 border border-slate-850 text-slate-400 hover:text-slate-100'
                  }`}
                >
                  <Edit3 className="w-4 h-4 shrink-0" />
                  <span>Registration</span>
                </button>

                <button
                  onClick={() => { setActiveTab('student-corner'); setMobileMenuOpen(false); setSuccessRegistration(null); }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-mono tracking-wider font-bold uppercase transition-all duration-300 flex items-center justify-between ${
                    activeTab === 'student-corner' 
                      ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.25)] font-black' 
                      : 'bg-slate-900/40 border border-slate-850 text-slate-400 hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>Student Corner</span>
                  </div>
                  <span className="text-[9px] bg-slate-950 px-2 py-0.5 rounded text-amber-400 font-normal">Active Card</span>
                </button>

                {currentUser?.email === 'rohan.dey1206@gmail.com' && (
                  <button
                    onClick={() => { setActiveTab('admin'); setMobileMenuOpen(false); setSuccessRegistration(null); }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-mono tracking-wider font-bold uppercase transition-all duration-300 flex items-center gap-3 ${
                      activeTab === 'admin' 
                        ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.25)] font-black' 
                        : 'bg-slate-900/40 border border-slate-850 text-slate-400 hover:text-slate-100'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Admin Panel</span>
                  </button>
                )}
              </nav>

              {/* Mobile User Profile Info & Session Actions */}
              <div className="border-t border-slate-900 pt-4 mt-2">
                {currentUser ? (
                  <div className="flex items-center justify-between bg-slate-900/30 border border-slate-850 p-3 rounded-xl">
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-white leading-tight">{currentUser.displayName || 'Athlete'}</span>
                      <span className="text-[10px] font-mono text-zinc-500 truncate max-w-[180px] mt-0.5">{currentUser.email}</span>
                    </div>
                    <button
                      onClick={() => { signOut(auth); setMobileMenuOpen(false); }}
                      className="px-3.5 py-2 bg-red-950/40 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/30 text-red-400 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setActiveTab('register'); setMobileMenuOpen(false); setSuccessRegistration(null); }}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-black tracking-widest uppercase rounded-xl transition-all cursor-pointer text-center shadow-md"
                  >
                    Sign In / Authenticate
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Welcome Announcement */}
      <section className="relative pt-12 pb-8 px-4 sm:px-6 md:px-8 text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-4"
        >
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full text-xs text-amber-400 font-mono tracking-wider font-semibold">
            <Award className="w-4 h-4 text-amber-500" />
            <span>SESSION 2026-2027 CLUB MEMBERSHIP REGISTRATION IS LIVE</span>
          </div>

          <h2 className="font-display font-black text-4xl sm:text-5xl md:text-6xl text-white tracking-tighter leading-none uppercase">
            Elevate Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-300">Athletic Vibe</span>
          </h2>

          <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Welcome to the home of champions! Register for <strong>Adamas Sports Club</strong> to unlock your dynamic, double-sided 3D sports membership card.
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 max-w-xl mx-auto pt-4 text-center">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 shadow-md">
              <p className="text-lg sm:text-xl font-display font-black text-amber-500 leading-none">10+</p>
              <p className="text-[9px] font-mono uppercase text-slate-500 mt-1 tracking-widest font-bold">Sport Fields</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 shadow-md">
              <p className="text-lg sm:text-xl font-display font-black text-amber-500 leading-none">3.2K+</p>
              <p className="text-[9px] font-mono uppercase text-slate-500 mt-1 tracking-widest font-bold">Active Members</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 shadow-md">
              <p className="text-lg sm:text-xl font-display font-black text-white leading-none">100%</p>
              <p className="text-[9px] font-mono uppercase text-slate-500 mt-1 tracking-widest font-bold">Digital Cards</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
        
        {/* ========================================================= */}
        {/* OVERVIEW TAB - SPORTS BENTO GRID DIRECTORY */}
        {/* ========================================================= */}
        {activeTab === 'home' && (
          <div className="space-y-10">
            {/* Bento Grid Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 border-b border-slate-900 pb-4">
              <div>
                <h3 className="font-display font-black text-xl sm:text-2xl text-white uppercase tracking-tight">
                  Explore Sports Venues & Disciplines
                </h3>
                <p className="text-xs text-slate-400 mt-1">Select from our premier outdoor, indoor, and track athletics facilities.</p>
              </div>
              <button 
                onClick={() => setActiveTab('register')}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-black uppercase tracking-wider px-5 py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] cursor-pointer"
              >
                Start Registration Form
              </button>
            </div>

            {/* The Sports Bento Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SPORTS_LIST.map((sport, index) => (
                <motion.div
                  key={sport.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  whileHover={{ y: -3 }}
                  className="bg-slate-900/50 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-900/70 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 relative overflow-hidden group"
                >
                  {/* Subtle hover accent element */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all pointer-events-none" />
                  
                  <div>
                    {/* Header Emoji and Category Tag */}
                    <div className="flex justify-between items-center mb-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-xl shadow-inner border border-slate-800">
                        {sport.emoji}
                      </div>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                        sport.category === 'Outdoor' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : sport.category === 'Indoor'
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {sport.category}
                      </span>
                    </div>

                    <h4 className="font-display font-black text-base text-slate-100 tracking-tight mb-1.5 capitalize">
                      {sport.name}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {sport.description}
                    </p>
                  </div>

                  {/* Micro footer actions */}
                  <div className="mt-5 pt-3 border-t border-slate-950 flex justify-between items-center">
                    <span className="text-[10px] font-mono text-slate-500">TRIALS SCHEDULED WEEKLY</span>
                    <button
                      onClick={() => setActiveTab('register')}
                      className="text-[10px] font-mono text-amber-500 hover:text-amber-400 flex items-center gap-1"
                    >
                      <span>Join Arena</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Detailed Registration Instructions banner */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[60px] rounded-full pointer-events-none" />
              <div className="max-w-3xl">
                <h4 className="font-display font-black text-lg text-white mb-2 uppercase tracking-tight">How to Obtain Your Digital Membership Card:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs text-slate-300">
                  <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-mono font-black text-xs mb-2">1</div>
                    <p className="font-bold text-slate-100">Submit Registration</p>
                    <p className="text-[11px] text-slate-400 mt-1">Complete our online form providing your official student details and sports focus.</p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-mono font-black text-xs mb-2">2</div>
                    <p className="font-bold text-slate-100">Personalize Card</p>
                    <p className="text-[11px] text-slate-400 mt-1">Select from five dynamic colorway skins, upload an avatar or actual photo.</p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-mono font-black text-xs mb-2">3</div>
                    <p className="font-bold text-slate-100">Scan & Check-In</p>
                    <p className="text-[11px] text-slate-400 mt-1">Use your secure QR code back-face to enter the stadium and check out sport gear.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* REGISTRATION TAB - STEP WIZARD FORM */}
        {/* ========================================================= */}
        {activeTab === 'register' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {!currentUser ? (
              <div className="space-y-6">
                <div className="text-center mb-2">
                  <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">Athlete Onboarding</h3>
                  <p className="text-xs text-slate-400 mt-1">Please sign in or sign up to complete your sports club registration.</p>
                </div>
                <AuthScreen onSuccess={() => {}} />
              </div>
            ) : currentUserRegistration ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 text-center max-w-lg mx-auto space-y-4">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center rounded-2xl mx-auto">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h4 className="font-display font-black text-lg text-white uppercase tracking-tight">Already Registered!</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  You have already registered for a sports club membership card. You can view, personalize, and share your digital card in the Student Corner.
                </p>
                <button
                  onClick={() => setActiveTab('student-corner')}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Go to Student Corner
                </button>
              </div>
            ) : (
              <>
                <div className="text-center md:text-left mb-2">
                  <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">Club Enrollment Portal</h3>
                  <p className="text-xs text-slate-400 mt-1">Enter your details exactly as per your Adamas registrar records.</p>
                </div>
                
                <RegistrationForm onRegister={handleRegister} currentUser={currentUser} />
              </>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* STUDENT CORNER TAB - SEARCH & MEMBERSHIP DIGITAL CARDS */}
        {/* ========================================================= */}
        {activeTab === 'student-corner' && (
          <div className="space-y-8">
            {!currentUser ? (
              <div className="max-w-md mx-auto space-y-6">
                <div className="text-center mb-2">
                  <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">Student Corner</h3>
                  <p className="text-xs text-slate-400 mt-1">Sign in to access, customize, and display your interactive digital membership card.</p>
                </div>
                <AuthScreen onSuccess={() => {}} />
              </div>
            ) : !currentUserRegistration ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 text-center max-w-lg mx-auto space-y-4">
                <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center rounded-2xl mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="font-display font-black text-lg text-white uppercase tracking-tight">No Active Card Found</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Hi <strong>{currentUser.displayName || 'Athlete'}</strong>! You haven't registered your sports club membership yet. Start your enrollment to get your personalized, dynamic 3D membership card!
                </p>
                <button
                  onClick={() => setActiveTab('register')}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Start Registration Now
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Banner of dynamic card creation success */}
                {successRegistration && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-400"
                  >
                    <div className="flex items-start gap-2.5">
                      <UserCheck className="w-5.5 h-5.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-display font-bold text-sm text-slate-100">Card Minted Successfully!</h4>
                        <p className="text-xs text-zinc-400 mt-0.5">Welcome to the club, <strong>{successRegistration.fullName}</strong>. Your custom ID <strong>{successRegistration.id}</strong> has been assigned.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSuccessRegistration(null)}
                      className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono tracking-wider font-bold px-3 py-1.5 rounded-lg border border-emerald-500/30 self-start sm:self-center uppercase cursor-pointer"
                    >
                      Dismiss Notification
                    </button>
                  </motion.div>
                )}

                {/* Showcase Section */}
                <div className="max-w-2xl mx-auto w-full">
                  <AnimatePresence mode="wait">
                    {editingStudent ? (
                      <motion.div
                        key="editing-student-form"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 md:p-8"
                      >
                        <div className="flex justify-between items-center mb-6">
                          <div>
                            <h4 className="font-display font-black text-xl text-white uppercase tracking-tight">Edit Registration Details</h4>
                            <p className="text-xs text-slate-400 mt-1">Update your information below. Changes will be saved and updated immediately on your digital card.</p>
                          </div>
                          <button 
                            onClick={() => setEditingStudent(null)}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>

                        <RegistrationForm 
                          isEdit={true} 
                          initialData={editingStudent} 
                          onSave={(updated) => {
                            const withApproved = { ...updated, status: 'Approved' as const };
                            handleSaveStudent(withApproved);
                          }} 
                        />
                      </motion.div>
                    ) : selectedStudent ? (
                      <motion.div
                        key={selectedStudent.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3 }}
                        className="w-full flex flex-col items-center"
                      >
                        {/* Active Showcase Header */}
                        <div className="text-center mb-5">
                          <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">ATHLETIC CARD</span>
                          <h4 className="font-display font-black text-xl text-white capitalize leading-none mt-1">
                            {selectedStudent.fullName}'s Profile
                          </h4>
                        </div>

                        {/* Card Component */}
                        <DigitalCard
                          registration={selectedStudent}
                          onSkinChange={(skinId) => handleSkinChange(selectedStudent.id, skinId)}
                          onAvatarChange={(avatarId) => handleAvatarChange(selectedStudent.id, avatarId)}
                          onPhotoUpload={(base64) => handlePhotoUpload(selectedStudent.id, base64)}
                        />

                        {/* Student Edit Profile Button Options */}
                        <div className="mt-6 w-full max-w-[328px]">
                          <button
                            onClick={() => setEditingStudent(selectedStudent)}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-amber-500 border border-slate-800 hover:border-amber-500/20 text-xs font-mono font-black uppercase tracking-widest py-3 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                          >
                            <Edit3 className="w-4 h-4" />
                            <span>Edit Profile Details</span>
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="w-full flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl p-12 text-center text-slate-500 min-h-[400px]">
                        <Sparkles className="w-8 h-8 text-zinc-700 mb-2 animate-pulse" />
                        <p className="text-xs">No active membership card generated yet</p>
                        <p className="text-[11px] text-zinc-600 mt-1 max-w-xs">Complete a new registration to generate and personalize your dynamic 3D sports membership card.</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* ADMIN PORTAL TAB */}
        {/* ========================================================= */}
        {activeTab === 'admin' && (
          <div className="max-w-7xl mx-auto pb-10">
            {currentUser?.email === 'rohan.dey1206@gmail.com' ? (
              <AdminPortal 
                registrations={registrations} 
                onUpdateStatus={handleUpdateStatus} 
                onDeleteRegistration={handleDeleteRegistration} 
                onAddRegistration={handleAdminAddRegistration} 
              />
            ) : (
              <div className="max-w-md mx-auto space-y-6 py-10">
                <div className="text-center">
                  <div className="inline-flex p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-3">
                    <ShieldCheck className="w-8 h-8 text-amber-500" />
                  </div>
                  <h3 className="font-display font-black text-xl text-white uppercase tracking-tight">
                    Admin Access Portal
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Please authenticate with administrator credentials to manage club rosters.</p>
                </div>
                
                {/* Embedded sleek admin login wrapper */}
                <AuthScreen onSuccess={() => {}} />
                
                {/* Help indicator */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-[11px] font-mono leading-relaxed text-amber-400">
                  <span className="font-bold uppercase block mb-1 text-center">Testing Admin Credentials:</span>
                  <div className="mt-1.5 flex flex-col gap-1 text-[11px] text-slate-300">
                    <div>Email: <span className="text-white select-all font-bold">rohan.dey1206@gmail.com</span></div>
                    <div>Password: <span className="text-white select-all font-bold">Soumya@1206</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Footer copyright */}
      <footer className="mt-20 border-t border-slate-900 pt-8 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-slate-500 font-mono">
        <div className="text-center md:text-left">
          <p>© 2026 ADAMAS SPORTS CLUB • ALL RIGHTS RESERVED</p>
          <p className="text-[10px] text-zinc-600 mt-0.5">ESTABLISHED FOR ATHLETIC INTEGRITY AND ACADEMIC BALANCE</p>
        </div>

        <div className="bg-slate-950/40 border border-slate-900/60 rounded-2xl px-4 py-2.5 hover:border-slate-800 transition-colors text-left">
          <p className="text-slate-300 font-bold uppercase tracking-wider text-[11px]">Developed by Soumyadeep Dey</p>
          <a 
            href="mailto:rohan.dey1206@gmail.com" 
            className="text-[10px] text-zinc-500 hover:text-amber-500 transition-colors flex items-center gap-1 mt-0.5"
          >
            <Mail className="w-3.5 h-3.5 shrink-0" />
            rohan.dey1206@gmail.com
          </a>
        </div>
      </footer>
    </div>
  );
}
