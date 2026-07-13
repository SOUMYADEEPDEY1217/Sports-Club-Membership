import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Registration, SPORTS_LIST, ADAMAS_SCHOOLS } from '../types';
import { 
  Trophy, ShieldCheck, User, Mail, Phone, Clock, PlusCircle, 
  Check, X, Trash2, Filter, Search, Eye, AlertTriangle, 
  CheckCircle, XCircle, Sparkles, UserPlus, GraduationCap, RefreshCw, X as CloseIcon 
} from 'lucide-react';
import DigitalCard from './DigitalCard';

interface AdminPortalProps {
  registrations: Registration[];
  onUpdateStatus: (id: string, status: 'Pending' | 'Approved' | 'Rejected') => void;
  onDeleteRegistration: (id: string) => void;
  onAddRegistration: (data: Omit<Registration, 'id' | 'registrationDate'>) => void;
}

export default function AdminPortal({ 
  registrations, 
  onUpdateStatus, 
  onDeleteRegistration, 
  onAddRegistration 
}: AdminPortalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [sportFilter, setSportFilter] = useState<string>('All');
  
  // Modal / side panel states
  const [selectedPreview, setSelectedPreview] = useState<Registration | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Streamlined Form State for Admin adding user
  const [newReg, setNewReg] = useState({
    fullName: '',
    studentId: 'AU/2026/',
    school: 'SOET',
    department: '',
    yearOfStudy: '1st Year',
    email: '',
    phone: '',
    whatsappOptIn: true,
    gender: 'Male',
    primarySport: 'football',
    secondarySport: 'cricket',
    skillLevel: 'Beginner' as Registration['skillLevel'],
    goals: ['Tournament representation'] as string[],
    emergencyContactName: '',
    emergencyContactPhone: '',
    medicalConditions: '',
    bloodGroup: 'B+',
    avatarPresetId: 'av-soccer',
    cardSkin: 'royal-gold'
  });

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // Compute stats
  const stats = useMemo(() => {
    const total = registrations.length;
    const pending = registrations.filter(r => r.status === 'Pending').length;
    const approved = registrations.filter(r => r.status === 'Approved' || !r.status).length;
    const rejected = registrations.filter(r => r.status === 'Rejected').length;

    // Favorite sport
    const counts: Record<string, number> = {};
    registrations.forEach(r => {
      counts[r.primarySport] = (counts[r.primarySport] || 0) + 1;
    });
    let faveSport = 'None';
    let max = 0;
    Object.entries(counts).forEach(([sport, count]) => {
      if (count > max) {
        max = count;
        const found = SPORTS_LIST.find(s => s.id === sport);
        faveSport = found ? `${found.emoji} ${found.name}` : sport;
      }
    });

    return { total, pending, approved, rejected, faveSport };
  }, [registrations]);

  // Filter registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter(reg => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        reg.fullName.toLowerCase().includes(q) ||
        reg.studentId.toLowerCase().includes(q) ||
        reg.email.toLowerCase().includes(q) ||
        (reg.phone && reg.phone.includes(q)) ||
        reg.id.toLowerCase().includes(q);

      const resolvedStatus = reg.status || 'Approved';
      const matchesStatus = statusFilter === 'All' || resolvedStatus === statusFilter;
      const matchesSport = sportFilter === 'All' || reg.primarySport === sportFilter;

      return matchesSearch && matchesStatus && matchesSport;
    });
  }, [registrations, searchQuery, statusFilter, sportFilter]);

  // Handle Admin Form Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess(false);

    if (!newReg.fullName.trim()) {
      setFormError('Full Name is required');
      return;
    }
    
    const studentIdUpper = newReg.studentId.trim().toUpperCase();
    const isAUFormat = /^AU\/\d{4}\/[A-Z0-9\/-]+$/i.test(studentIdUpper);
    const isUGFormat = /^UG\/[A-Z0-9]+\/[A-Z0-9\/-]+$/i.test(studentIdUpper);
    if (!isAUFormat && !isUGFormat) {
      setFormError('Student ID must be format: AU/YYYY/XXXX or UG/SCHOOL/XX/XX/XXX');
      return;
    }

    if (!newReg.department.trim()) {
      setFormError('Department is required');
      return;
    }

    if (!newReg.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newReg.email.trim())) {
      setFormError('Valid Email is required');
      return;
    }

    if (!newReg.phone.trim() || !/^\+?[\d\s-]{10,15}$/.test(newReg.phone.trim())) {
      setFormError('Valid Phone Number is required');
      return;
    }

    if (newReg.primarySport === newReg.secondarySport) {
      setFormError('Primary and Secondary sports cannot be identical');
      return;
    }

    // Assign appropriate avatar presets based on sport
    let avatarPresetId = 'av-soccer';
    if (newReg.primarySport === 'cricket') avatarPresetId = 'av-cricket';
    else if (newReg.primarySport === 'basketball') avatarPresetId = 'av-basketball';
    else if (newReg.primarySport === 'badminton') avatarPresetId = 'av-badminton';
    else if (newReg.primarySport === 'athletics') avatarPresetId = 'av-runner';
    else if (newReg.primarySport === 'chess') avatarPresetId = 'av-chess';

    onAddRegistration({
      ...newReg,
      avatarPresetId,
      goals: ['Fitness', 'Tournament representation', 'Skill building'],
      emergencyContactName: newReg.emergencyContactName || 'Club Officer',
      emergencyContactPhone: newReg.emergencyContactPhone || newReg.phone,
      status: 'Approved' // Admin creations are auto-approved
    });

    setFormSuccess(true);
    // Reset essential fields
    setNewReg(prev => ({
      ...prev,
      fullName: '',
      studentId: 'AU/2026/',
      department: '',
      email: '',
      phone: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      medicalConditions: ''
    }));

    setTimeout(() => {
      setFormSuccess(false);
      setShowAddForm(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-display font-black text-xl sm:text-2xl text-white uppercase tracking-tight">
              Administrative Control Board
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage registrations, verify athlete student cards, approve enrollments, and mint new memberships.
          </p>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] cursor-pointer flex items-center gap-2 self-start"
        >
          <UserPlus className="w-4 h-4" />
          <span>New Athlete Enrollment</span>
        </button>
      </div>

      {/* Stats Summary Matrix */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[9px] font-mono uppercase text-slate-500 tracking-wider">Total Enrolled</span>
          <p className="text-2xl font-black text-white mt-1">{stats.total}</p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
          <span className="text-[9px] font-mono uppercase text-slate-500 tracking-wider">Pending Audit</span>
          <p className="text-2xl font-black text-amber-500 mt-1">{stats.pending}</p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[9px] font-mono uppercase text-slate-500 tracking-wider">Approved Members</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">{stats.approved}</p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[9px] font-mono uppercase text-slate-500 tracking-wider">Rejected Audits</span>
          <p className="text-2xl font-black text-rose-500 mt-1">{stats.rejected}</p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between col-span-2 lg:col-span-1">
          <span className="text-[9px] font-mono uppercase text-slate-500 tracking-wider">Hot Discipline</span>
          <p className="text-sm font-black text-amber-400 truncate mt-1.5">{stats.faveSport}</p>
        </div>
      </div>

      {/* Table Filters & Actions Controls */}
      <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          
          {/* Search bar */}
          <div className="relative flex-grow">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by student name, email, phone or AU/UG number..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500/40 text-slate-200 placeholder-slate-500 text-xs px-4 py-2.5 pl-10 rounded-xl outline-none transition-all"
            />
          </div>

          {/* Filters Row */}
          <div className="flex gap-2.5">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-zinc-500" />
              <select 
                value={statusFilter} 
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs px-3 py-2 rounded-lg outline-none font-mono tracking-wide"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending Audit</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <select 
              value={sportFilter} 
              onChange={(e) => setSportFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs px-3 py-2 rounded-lg outline-none font-mono tracking-wide"
            >
              <option value="All">All Sports</option>
              {SPORTS_LIST.map(s => (
                <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Registrations Table */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {filteredRegistrations.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <AlertTriangle className="w-7 h-7 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs">No matching athletes found</p>
            <p className="text-[10px] text-zinc-600 mt-1">Try relaxing your search parameters or check filters.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 bg-slate-950/50 text-[9px] font-mono uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Athlete ID / Details</th>
                    <th className="py-3 px-4">University ID & Contact</th>
                    <th className="py-3 px-4">Focus Discipline</th>
                    <th className="py-3 px-4">Campus Dept</th>
                    <th className="py-3 px-4">Audit Status</th>
                    <th className="py-3 px-4 text-center">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-xs">
                  {filteredRegistrations.map((reg) => {
                    const resolvedStatus = reg.status || 'Approved';
                    const primarySportConfig = SPORTS_LIST.find(s => s.id === reg.primarySport);
                    const secondarySportConfig = SPORTS_LIST.find(s => s.id === reg.secondarySport);

                    return (
                      <tr key={reg.id} className="hover:bg-slate-900/20 transition-colors">
                        {/* Name & ID */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-sm overflow-hidden shrink-0">
                              {reg.avatarUrl ? (
                                <img src={reg.avatarUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span>{primarySportConfig?.emoji || '🏅'}</span>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-100">{reg.fullName}</p>
                              <p className="text-[9px] font-mono text-amber-500 mt-0.5">{reg.id}</p>
                            </div>
                          </div>
                        </td>

                        {/* University ID & Contact */}
                        <td className="py-3.5 px-4 font-mono">
                          <p className="text-[11px] text-zinc-200 font-bold">{reg.studentId}</p>
                          <div className="flex items-center gap-2.5 text-[9px] text-slate-500 mt-0.5">
                            <span className="flex items-center gap-0.5"><Mail className="w-2.5 h-2.5" /> {reg.email}</span>
                            <span className="flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" /> {reg.phone}</span>
                          </div>
                        </td>

                        {/* Focus Discipline */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1">
                            <span className="text-sm shrink-0">{primarySportConfig?.emoji}</span>
                            <div className="text-left">
                              <span className="font-bold text-slate-200 block text-[11px]">{primarySportConfig?.name || reg.primarySport}</span>
                              <span className="text-[9px] font-mono text-zinc-500">Secondary: {secondarySportConfig?.emoji} {secondarySportConfig?.name || reg.secondarySport}</span>
                            </div>
                          </div>
                        </td>

                        {/* Department / School */}
                        <td className="py-3.5 px-4 font-mono text-[10px] text-zinc-400">
                          <span className="font-black text-amber-500/80">{reg.school}</span>
                          <p className="text-[9px] text-zinc-500 truncate max-w-[150px]">{reg.department} ({reg.yearOfStudy})</p>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
                            resolvedStatus === 'Approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : resolvedStatus === 'Pending'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            <span className={`w-1 h-1 rounded-full ${
                              resolvedStatus === 'Approved' ? 'bg-emerald-400' : resolvedStatus === 'Pending' ? 'bg-amber-400 animate-ping' : 'bg-rose-400'
                            }`} />
                            {resolvedStatus}
                          </span>
                        </td>

                        {/* Quick Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            
                            {/* Card Preview */}
                            <button
                              onClick={() => setSelectedPreview(reg)}
                              title="Verify Athlete ID Card"
                              className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 rounded-lg transition-all cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {resolvedStatus === 'Pending' && (
                              <>
                                {/* Approve Button */}
                                <button
                                  onClick={() => onUpdateStatus(reg.id, 'Approved')}
                                  title="Approve Registration"
                                  className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 border border-emerald-500/20 rounded-lg transition-all cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>

                                {/* Reject Button */}
                                <button
                                  onClick={() => onUpdateStatus(reg.id, 'Rejected')}
                                  title="Decline Audit"
                                  className="p-1.5 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 border border-rose-500/20 rounded-lg transition-all cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {resolvedStatus !== 'Pending' && (
                              <button
                                onClick={() => onUpdateStatus(reg.id, resolvedStatus === 'Approved' ? 'Rejected' : 'Approved')}
                                title={resolvedStatus === 'Approved' ? 'Decline Audit' : 'Approve Audit'}
                                className={`p-1.5 border rounded-lg transition-all cursor-pointer text-slate-400 ${
                                  resolvedStatus === 'Approved' 
                                    ? 'bg-slate-950 hover:bg-rose-500/10 hover:text-rose-400 border-slate-800' 
                                    : 'bg-slate-950 hover:bg-emerald-500/10 hover:text-emerald-400 border-slate-800'
                                }`}
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete Action */}
                            <button
                              onClick={() => setConfirmDeleteId(reg.id)}
                              title="Purge Registration"
                              className="p-1.5 bg-slate-950 hover:bg-red-500/10 hover:border-red-500/20 text-slate-500 hover:text-red-400 border border-slate-800 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="block md:hidden divide-y divide-slate-850">
              {filteredRegistrations.map((reg) => {
                const resolvedStatus = reg.status || 'Approved';
                const primarySportConfig = SPORTS_LIST.find(s => s.id === reg.primarySport);
                const secondarySportConfig = SPORTS_LIST.find(s => s.id === reg.secondarySport);

                return (
                  <div key={reg.id} className="p-4 space-y-3.5 hover:bg-slate-900/10 transition-colors">
                    {/* Header: Name, ID, status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-base overflow-hidden shrink-0">
                          {reg.avatarUrl ? (
                            <img src={reg.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span>{primarySportConfig?.emoji || '🏅'}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-100 text-sm">{reg.fullName}</p>
                          <p className="text-[10px] font-mono text-amber-500">{reg.id}</p>
                        </div>
                      </div>

                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
                        resolvedStatus === 'Approved'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : resolvedStatus === 'Pending'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${
                          resolvedStatus === 'Approved' ? 'bg-emerald-400' : resolvedStatus === 'Pending' ? 'bg-amber-400 animate-ping' : 'bg-rose-400'
                        }`} />
                        {resolvedStatus}
                      </span>
                    </div>

                    {/* Meta Fields */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-slate-950/40 border border-slate-850/60 p-3 rounded-xl text-[11px]">
                      <div>
                        <span className="text-slate-500 font-mono text-[9px] block uppercase">University ID</span>
                        <span className="font-mono text-slate-200 font-bold">{reg.studentId}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-mono text-[9px] block uppercase">Campus Dept</span>
                        <span className="text-slate-200 font-bold">{reg.school} • <span className="text-zinc-400 font-medium">{reg.department} ({reg.yearOfStudy})</span></span>
                      </div>
                      <div className="col-span-2 border-t border-slate-850/60 pt-2 mt-1">
                        <span className="text-slate-500 font-mono text-[9px] block uppercase">Sports Discipline</span>
                        <span className="text-slate-200 font-bold text-[11.5px]">
                          {primarySportConfig?.emoji} {primarySportConfig?.name || reg.primarySport}{' '}
                          <span className="text-zinc-500 font-normal">
                            (Sec: {secondarySportConfig?.emoji} {secondarySportConfig?.name || reg.secondarySport})
                          </span>
                        </span>
                      </div>
                      <div className="col-span-2 border-t border-slate-850/60 pt-2">
                        <span className="text-slate-500 font-mono text-[9px] block uppercase">Contact Details</span>
                        <div className="flex flex-col gap-0.5 text-[10px] text-zinc-400 font-mono mt-0.5">
                          <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-zinc-600" /> {reg.email}</span>
                          <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-zinc-600" /> {reg.phone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setSelectedPreview(reg)}
                        className="flex-1 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Verify Card</span>
                      </button>

                      {resolvedStatus === 'Pending' && (
                        <>
                          <button
                            onClick={() => onUpdateStatus(reg.id, 'Approved')}
                            className="flex-1 py-2 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>

                          <button
                            onClick={() => onUpdateStatus(reg.id, 'Rejected')}
                            className="flex-1 py-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-white text-rose-400 text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Decline</span>
                          </button>
                        </>
                      )}

                      {resolvedStatus !== 'Pending' && (
                        <button
                          onClick={() => onUpdateStatus(reg.id, resolvedStatus === 'Approved' ? 'Rejected' : 'Approved')}
                          className="py-2 px-3 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-amber-400 rounded-xl transition-all"
                          title={resolvedStatus === 'Approved' ? 'Change to Rejected' : 'Change to Approved'}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => setConfirmDeleteId(reg.id)}
                        className="py-2 px-3 bg-slate-900 border border-slate-800 hover:bg-rose-500/10 text-slate-500 hover:text-red-400 hover:border-rose-500/20 rounded-xl transition-all"
                        title="Purge Registration"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* MODAL 1: Verify & View Athlete Interactive Digital Card */}
      <AnimatePresence>
        {selectedPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full relative space-y-4"
            >
              <button 
                onClick={() => setSelectedPreview(null)}
                className="absolute top-4 right-4 p-1.5 bg-slate-950 text-slate-400 hover:text-white rounded-lg border border-slate-850 cursor-pointer"
              >
                <CloseIcon className="w-4 h-4" />
              </button>

              <div className="text-center">
                <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">MEMBER VERIFICATION SKIN ACTIVE</span>
                <h4 className="font-display font-black text-lg text-white mt-1">
                  Card ID: {selectedPreview.id}
                </h4>
              </div>

              <div className="flex justify-center pt-2">
                <DigitalCard
                  registration={selectedPreview}
                  onSkinChange={(skinId) => onUpdateStatus(selectedPreview.id, selectedPreview.status || 'Approved')} // preview skin mode or fallback
                  onAvatarChange={() => {}}
                  onPhotoUpload={() => {}}
                />
              </div>

              <div className="pt-2 flex justify-center gap-3 font-mono text-[10px]">
                <span className="text-slate-500">Status:</span>
                <span className={selectedPreview.status === 'Approved' ? 'text-emerald-400 font-bold' : selectedPreview.status === 'Rejected' ? 'text-rose-400 font-bold' : 'text-amber-400 font-bold'}>
                  {selectedPreview.status || 'Approved'}
                </span>
                <span className="text-slate-700">•</span>
                <span className="text-slate-500">Department:</span>
                <span className="text-zinc-300">{selectedPreview.school} - {selectedPreview.department}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Purge Registration Confirmation */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div>
                <h4 className="font-display font-black text-base text-white uppercase tracking-tight">Purge Registration?</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  This will completely remove the student enrollment from Firestore and revoke their access to the digital membership card. This action cannot be undone.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 font-mono text-[10px]">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="bg-slate-950 text-slate-400 border border-slate-850 hover:bg-slate-800 px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDeleteRegistration(confirmDeleteId);
                    setConfirmDeleteId(null);
                  }}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Confirm Purge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Side Panel / Slide Over to Add New Athlete */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="bg-[#0c1329] border-l border-slate-800 w-full max-w-md h-full overflow-y-auto p-6 md:p-8 flex flex-col justify-between"
            >
              <div>
                {/* Sidepanel Header */}
                <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-amber-500" />
                    <h4 className="font-display font-black text-lg text-white uppercase tracking-tight">Enroll New Athlete</h4>
                  </div>
                  <button 
                    onClick={() => setShowAddForm(false)}
                    className="p-1.5 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-850 rounded-lg cursor-pointer"
                  >
                    <CloseIcon className="w-4 h-4" />
                  </button>
                </div>

                {formError && (
                  <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-3 rounded-xl mb-4 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {formSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs p-3 rounded-xl mb-4 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>Athlete created and registered successfully on the admin side!</span>
                  </div>
                )}

                {/* Simplified Admin Input Form */}
                <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-mono text-[10px] uppercase block tracking-wider">Full Athlete Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Soumyadeep Dey"
                      value={newReg.fullName}
                      onChange={(e) => setNewReg(p => ({ ...p, fullName: e.target.value }))}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500/40 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none"
                    />
                  </div>

                  {/* Student ID */}
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-mono text-[10px] uppercase block tracking-wider">Student UID *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. AU/2026/0001 or UG/SOET/23/04/004"
                      value={newReg.studentId}
                      onChange={(e) => setNewReg(p => ({ ...p, studentId: e.target.value }))}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500/40 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none font-mono"
                    />
                    <p className="text-[9px] text-zinc-500 font-mono">Must match university registrar standard AU/YYYY/... or UG/...</p>
                  </div>

                  {/* School & Department */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-zinc-400 font-mono text-[10px] uppercase block tracking-wider">School</label>
                      <select 
                        value={newReg.school}
                        onChange={(e) => setNewReg(p => ({ ...p, school: e.target.value }))}
                        className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-xs px-3 py-2.5 rounded-xl outline-none"
                      >
                        {ADAMAS_SCHOOLS.map(s => (
                          <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-zinc-400 font-mono text-[10px] uppercase block tracking-wider">Department *</label>
                      <input 
                        type="text" 
                        placeholder="e.g. CSE"
                        value={newReg.department}
                        onChange={(e) => setNewReg(p => ({ ...p, department: e.target.value }))}
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500/40 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none"
                      />
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-zinc-400 font-mono text-[10px] uppercase block tracking-wider">Email Address *</label>
                      <input 
                        type="email" 
                        placeholder="athlete@gmail.com"
                        value={newReg.email}
                        onChange={(e) => setNewReg(p => ({ ...p, email: e.target.value }))}
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500/40 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-zinc-400 font-mono text-[10px] uppercase block tracking-wider">Mobile Number *</label>
                      <input 
                        type="text" 
                        placeholder="10-digit number"
                        value={newReg.phone}
                        onChange={(e) => setNewReg(p => ({ ...p, phone: e.target.value }))}
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500/40 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none"
                      />
                    </div>
                  </div>

                  {/* Sports Selection */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-zinc-400 font-mono text-[10px] uppercase block tracking-wider">Primary Sport</label>
                      <select 
                        value={newReg.primarySport}
                        onChange={(e) => setNewReg(p => ({ ...p, primarySport: e.target.value }))}
                        className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-xs px-3 py-2.5 rounded-xl outline-none"
                      >
                        {SPORTS_LIST.map(s => (
                          <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-zinc-400 font-mono text-[10px] uppercase block tracking-wider">Secondary Sport</label>
                      <select 
                        value={newReg.secondarySport}
                        onChange={(e) => setNewReg(p => ({ ...p, secondarySport: e.target.value }))}
                        className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-xs px-3 py-2.5 rounded-xl outline-none"
                      >
                        {SPORTS_LIST.map(s => (
                          <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-zinc-400 font-mono text-[10px] uppercase block tracking-wider">Year of Study</label>
                      <select 
                        value={newReg.yearOfStudy}
                        onChange={(e) => setNewReg(p => ({ ...p, yearOfStudy: e.target.value }))}
                        className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-xs px-2.5 py-2.5 rounded-xl outline-none"
                      >
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                        <option value="5th Year">5th Year</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-zinc-400 font-mono text-[10px] uppercase block tracking-wider">Skill Level</label>
                      <select 
                        value={newReg.skillLevel}
                        onChange={(e: any) => setNewReg(p => ({ ...p, skillLevel: e.target.value }))}
                        className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-xs px-2.5 py-2.5 rounded-xl outline-none"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Competitive">Competitive</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-zinc-400 font-mono text-[10px] uppercase block tracking-wider">Blood Group</label>
                      <select 
                        value={newReg.bloodGroup}
                        onChange={(e) => setNewReg(p => ({ ...p, bloodGroup: e.target.value }))}
                        className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-xs px-2.5 py-2.5 rounded-xl outline-none"
                      >
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  </div>

                  {/* Card Skin Preference */}
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-mono text-[10px] uppercase block tracking-wider">Digital Card Skin Pref</label>
                    <select 
                      value={newReg.cardSkin}
                      onChange={(e) => setNewReg(p => ({ ...p, cardSkin: e.target.value }))}
                      className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-xs px-3 py-2.5 rounded-xl outline-none"
                    >
                      <option value="royal-gold">⚜️ Royal Gold Theme</option>
                      <option value="cyber-neon">⚡ Cyber Neon Theme</option>
                      <option value="stealth-carbon">🖤 Stealth Carbon Theme</option>
                      <option value="crimson-pro">❤️ Crimson Pro Theme</option>
                      <option value="emerald">💚 Emerald Active Theme</option>
                    </select>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-mono font-black uppercase tracking-widest py-3 rounded-xl transition-all cursor-pointer shadow-md mt-4 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirm & Mint Membership Card</span>
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
