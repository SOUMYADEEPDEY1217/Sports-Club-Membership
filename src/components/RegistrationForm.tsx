import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Registration, SPORTS_LIST, ADAMAS_SCHOOLS, PRESET_AVATARS } from '../types';
import { Trophy, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, HeartPulse, User, Phone, Mail, Award, AlertTriangle } from 'lucide-react';

interface RegistrationFormProps {
  onRegister?: (data: Omit<Registration, 'id' | 'registrationDate'>) => void;
  onSave?: (data: Registration) => void;
  isEdit?: boolean;
  initialData?: Registration;
  currentUser?: any;
}

export default function RegistrationForm({ onRegister, onSave, isEdit = false, initialData, currentUser }: RegistrationFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(() => {
    if (isEdit && initialData) {
      return {
        fullName: initialData.fullName || '',
        studentId: initialData.studentId || '',
        school: initialData.school || 'SOET',
        department: initialData.department || '',
        yearOfStudy: initialData.yearOfStudy || '1st Year',
        email: initialData.email || '',
        phone: initialData.phone || '',
        whatsappOptIn: initialData.whatsappOptIn !== undefined ? initialData.whatsappOptIn : true,
        gender: initialData.gender || 'Male',
        primarySport: initialData.primarySport || 'football',
        secondarySport: initialData.secondarySport || 'cricket',
        skillLevel: initialData.skillLevel || 'Beginner',
        goals: initialData.goals || [],
        emergencyContactName: initialData.emergencyContactName || '',
        emergencyContactPhone: initialData.emergencyContactPhone || '',
        medicalConditions: initialData.medicalConditions || '',
        bloodGroup: initialData.bloodGroup || 'B+',
        avatarPresetId: initialData.avatarPresetId || 'av-soccer',
        cardSkin: initialData.cardSkin || 'royal-gold'
      };
    }
    return {
      fullName: currentUser?.displayName || '',
      studentId: '',
      school: 'SOET',
      department: '',
      yearOfStudy: '1st Year',
      email: currentUser?.email || '',
      phone: '',
      whatsappOptIn: true,
      gender: 'Male',
      primarySport: 'football',
      secondarySport: 'cricket',
      skillLevel: 'Beginner' as Registration['skillLevel'],
      goals: [] as string[],
      emergencyContactName: '',
      emergencyContactPhone: '',
      medicalConditions: '',
      bloodGroup: 'B+',
      avatarPresetId: 'av-soccer',
      cardSkin: 'royal-gold'
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (currentStep: number) => {
    const nextErrors: Record<string, string> = {};
    
    if (currentStep === 1) {
      if (!formData.fullName.trim()) nextErrors.fullName = 'Full Name is required';
      if (!formData.studentId.trim()) {
        nextErrors.studentId = 'Student ID is required';
      } else {
        const studentIdUpper = formData.studentId.trim().toUpperCase();
        const isAUFormat = /^AU\/\d{4}\/[A-Z0-9\/-]+$/i.test(studentIdUpper);
        const isUGFormat = /^UG\/[A-Z0-9]+\/[A-Z0-9\/-]+$/i.test(studentIdUpper);
        const isAPPFormat = /^APP\/[A-Z0-9\/-]+$/i.test(studentIdUpper);
        if (!isAUFormat && !isUGFormat && !isAPPFormat) {
          nextErrors.studentId = 'Invalid format. Must be APP/****/***** (Application No), AU/YYYY/*******, or UG/SCHOOL/**/**/***';
        }
      }
      if (!formData.department.trim()) nextErrors.department = 'Department name is required';
    } else if (currentStep === 2) {
      if (!formData.email.trim()) {
        nextErrors.email = 'Email address is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        nextErrors.email = 'Please enter a valid email address';
      }
      if (!formData.phone.trim()) {
        nextErrors.phone = 'Phone number is required';
      } else if (!/^\+?[\d\s-]{10,15}$/.test(formData.phone.trim())) {
        nextErrors.phone = 'Enter a valid 10-12 digit phone number';
      }
    } else if (currentStep === 3) {
      if (formData.primarySport === formData.secondarySport) {
        nextErrors.secondarySport = 'Primary and Secondary sports cannot be identical';
      }
    } else if (currentStep === 4) {
      if (!formData.emergencyContactName.trim()) nextErrors.emergencyContactName = 'Emergency contact name is required';
      if (!formData.emergencyContactPhone.trim()) {
        nextErrors.emergencyContactPhone = 'Emergency contact phone is required';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep(4)) {
      if (isEdit && onSave && initialData) {
        onSave({
          ...initialData,
          ...formData
        });
      } else if (onRegister) {
        onRegister(formData);
      }
    }
  };

  const handleGoalToggle = (goal: string) => {
    if (formData.goals.includes(goal)) {
      setFormData(prev => ({
        ...prev,
        goals: prev.goals.filter(g => g !== goal)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        goals: [...prev.goals, goal]
      }));
    }
  };

  const goalsList = [
    'Tournament Representation',
    'Skill Improvement',
    'Fitness & Weight Management',
    'Recreational Play',
    'Representing House in Intra-University events',
    'Leadership & Team Management practice'
  ];

  return (
    <div className="w-full bg-slate-900/50 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden backdrop-blur-md">
      {/* Background radial highlight */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

      {/* Steps Indicator Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">REGISTRATION PIPELINE</span>
          <span className="text-xs font-mono text-amber-500 font-bold">STEP {step} OF 4</span>
        </div>
        <div className="h-1.5 w-full bg-slate-850 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 transition-all duration-500 ease-out"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div className="border-b border-slate-800 pb-3 mb-4">
                <h3 className="font-display font-black text-xl text-white flex items-center gap-2 uppercase tracking-tight">
                  <User className="w-5.5 h-5.5 text-amber-500" />
                  Academic Profile
                </h3>
                <p className="text-xs text-slate-400 mt-1">Please provide your official Adamas University student details.</p>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rohan Dey"
                  value={formData.fullName}
                  onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))}
                  className={`w-full bg-slate-950/70 border ${errors.fullName ? 'border-red-500/80' : 'border-slate-800 focus:border-amber-500'} rounded-xl px-4 py-3 text-sm text-slate-100 outline-none transition-all placeholder:text-zinc-600`}
                />
                {errors.fullName && <p className="text-xs text-red-400 mt-1 font-mono">{errors.fullName}</p>}
              </div>

              {/* Student ID / Roll No / Application No */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
                  Roll No / Student ID / Application No <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., APP/2026/1089, AU/2026/SOET/012, or UG/SOET/21/CS/001"
                  value={formData.studentId}
                  onChange={e => setFormData(p => ({ ...p, studentId: e.target.value }))}
                  className={`w-full bg-slate-950/70 border ${errors.studentId ? 'border-red-500/80' : 'border-slate-800 focus:border-amber-500'} rounded-xl px-4 py-3 text-sm text-slate-100 outline-none transition-all placeholder:text-zinc-600 font-mono`}
                />
                <p className="text-[10px] text-zinc-500 font-mono mt-1">Acceptable formats: APP/****/***** (Application No), AU/YYYY/xxxxxxx, or UG/SCHOOL/xx/xx/xxx</p>
                {errors.studentId && <p className="text-xs text-red-400 mt-1 font-mono">{errors.studentId}</p>}
              </div>

              {/* School and Department Group */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
                    School of Study <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.school}
                    onChange={e => {
                      const selSchool = e.target.value;
                      // Auto-select avatar preset theme based on school if helpful
                      setFormData(p => ({ ...p, school: selSchool }));
                    }}
                    className="w-full bg-slate-950/70 border border-slate-800 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-slate-100 outline-none transition-all"
                  >
                    {ADAMAS_SCHOOLS.map(sc => (
                      <option key={sc.code} value={sc.code} className="bg-slate-950 text-slate-100">
                        {sc.code} - {sc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
                    Department / Course <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. B.Tech Computer Science"
                    value={formData.department}
                    onChange={e => setFormData(p => ({ ...p, department: e.target.value }))}
                    className={`w-full bg-slate-950/70 border ${errors.department ? 'border-red-500/80' : 'border-slate-800 focus:border-amber-500'} rounded-xl px-4 py-3 text-sm text-slate-100 outline-none transition-all placeholder:text-zinc-600`}
                  />
                  {errors.department && <p className="text-xs text-red-400 mt-1 font-mono">{errors.department}</p>}
                </div>
              </div>

              {/* Year of Study and Gender */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
                    Year of Study
                  </label>
                  <select
                    value={formData.yearOfStudy}
                    onChange={e => setFormData(p => ({ ...p, yearOfStudy: e.target.value }))}
                    className="w-full bg-slate-950/70 border border-slate-800 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-slate-100 outline-none transition-all"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Post-Graduate">Post-Graduate (PG)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData(p => ({ ...p, gender: e.target.value }))}
                    className="w-full bg-slate-950/70 border border-slate-800 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-slate-100 outline-none transition-all"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div className="border-b border-slate-800 pb-3 mb-4">
                <h3 className="font-display font-black text-xl text-white flex items-center gap-2 uppercase tracking-tight">
                  <Mail className="w-5.5 h-5.5 text-amber-500" />
                  Contact Credentials
                </h3>
                <p className="text-xs text-slate-400 mt-1">Provide your active contact info to receive schedule updates and card details.</p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
                  Primary Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. student@adamas.edu or personal email"
                  value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  className={`w-full bg-slate-950/70 border ${errors.email ? 'border-red-500/80' : 'border-slate-800 focus:border-amber-500'} rounded-xl px-4 py-3 text-sm text-slate-100 outline-none transition-all placeholder:text-zinc-600 font-mono`}
                />
                {errors.email && <p className="text-xs text-red-400 mt-1 font-mono">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
                  Phone / Mobile Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +91 82400 XXXXX"
                  value={formData.phone}
                  onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                  className={`w-full bg-slate-950/70 border ${errors.phone ? 'border-red-500/80' : 'border-slate-800 focus:border-amber-500'} rounded-xl px-4 py-3 text-sm text-slate-100 outline-none transition-all placeholder:text-zinc-600 font-mono`}
                />
                {errors.phone && <p className="text-xs text-red-400 mt-1 font-mono">{errors.phone}</p>}
              </div>

              {/* WhatsApp Opt In */}
              <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 flex items-start gap-3 mt-4">
                <input
                  type="checkbox"
                  id="whatsappOptIn"
                  checked={formData.whatsappOptIn}
                  onChange={e => setFormData(p => ({ ...p, whatsappOptIn: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-800 text-amber-500 focus:ring-amber-500/50 bg-slate-950 mt-0.5 cursor-pointer accent-amber-500"
                />
                <label htmlFor="whatsappOptIn" className="text-xs text-slate-400 leading-normal cursor-pointer">
                  <span className="font-bold text-slate-200 block">Opt-in for WhatsApp Updates</span>
                  Receive trial notifications, slot bookings, equipment allocations, and matches announcements directly on WhatsApp.
                </label>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div className="border-b border-slate-800 pb-3 mb-4">
                <h3 className="font-display font-black text-xl text-white flex items-center gap-2 uppercase tracking-tight">
                  <Trophy className="w-5.5 h-5.5 text-amber-500" />
                  Sports Specialization
                </h3>
                <p className="text-xs text-slate-400 mt-1">Specify your key athletic preferences and current familiarity level.</p>
              </div>

              {/* Primary Sport Grid Selection */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 font-bold">
                  SELECT PRIMARY SPORT OF INTEREST <span className="text-red-400">*</span>
                </label>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {SPORTS_LIST.map(sport => {
                    const isSelected = formData.primarySport === sport.id;
                    return (
                      <button
                        type="button"
                        key={sport.id}
                        onClick={() => {
                          // Auto match avatar preset to primary sport
                          let avPreset = 'av-soccer';
                          if (sport.id === 'cricket') avPreset = 'av-cricket';
                          else if (sport.id === 'basketball') avPreset = 'av-basketball';
                          else if (sport.id === 'badminton') avPreset = 'av-badminton';
                          else if (sport.id === 'athletics') avPreset = 'av-runner';
                          else if (sport.id === 'chess') avPreset = 'av-chess';

                          setFormData(p => ({ 
                            ...p, 
                            primarySport: sport.id,
                            avatarPresetId: avPreset
                          }));
                        }}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all duration-300 ${
                          isSelected 
                            ? 'border-amber-400 bg-amber-500/15 shadow-md shadow-amber-500/5' 
                            : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
                        }`}
                      >
                        <span className="text-xl filter drop-shadow-sm">{sport.emoji}</span>
                        <div>
                          <p className="text-xs font-bold text-slate-200 capitalize">{sport.name}</p>
                          <p className="text-[9px] font-mono text-zinc-500 leading-none mt-0.5">{sport.category}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Primary Sport Level Selection */}
              <div className="pt-1">
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 font-bold">
                  CHOOSE LEVEL OF PLAY FOR PRIMARY SPORT <span className="text-red-400">*</span>
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: 'Beginner', title: 'Beginner (Level 1)', desc: 'Learning basic rules and recreational play.' },
                    { id: 'Intermediate', title: 'Intermediate (Level 2)', desc: 'Play regularly, comfortable with core tactics.' },
                    { id: 'Advanced', title: 'Advanced (Level 3)', desc: 'District level skill and high proficiency.' },
                    { id: 'Competitive', title: 'Competitive (Level 4)', desc: 'Varsity representative or state level athlete.' }
                  ].map(level => {
                    const isSelected = formData.skillLevel === level.id;
                    return (
                      <button
                        type="button"
                        key={level.id}
                        onClick={() => setFormData(p => ({ ...p, skillLevel: level.id as Registration['skillLevel'] }))}
                        className={`p-3 rounded-xl border text-left transition-all duration-300 flex flex-col justify-between ${
                          isSelected 
                            ? 'border-amber-400 bg-amber-500/15 shadow-md shadow-amber-500/5' 
                            : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
                        }`}
                      >
                        <span className="text-xs font-bold text-slate-200">{level.title}</span>
                        <span className="text-[10px] text-zinc-500 mt-1 leading-snug">{level.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Secondary Sport (Back-up) */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
                  Secondary Sport interest (Back-up)
                </label>
                <select
                  value={formData.secondarySport}
                  onChange={e => setFormData(p => ({ ...p, secondarySport: e.target.value }))}
                  className={`w-full bg-slate-950/70 border ${errors.secondarySport ? 'border-red-500/80' : 'border-slate-800 focus:border-amber-500'} rounded-xl px-4 py-3 text-sm text-slate-100 outline-none transition-all`}
                >
                  {SPORTS_LIST.map(sport => (
                    <option key={sport.id} value={sport.id} className="bg-slate-950 text-slate-100 capitalize">
                      {sport.emoji} {sport.name}
                    </option>
                  ))}
                </select>
                {errors.secondarySport && <p className="text-xs text-red-400 mt-1 font-mono">{errors.secondarySport}</p>}
              </div>

              {/* Objectives Multi Selection */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2 font-semibold">
                  GOALS & MOTIVATIONS FOR JOINING
                </label>
                <div className="flex flex-wrap gap-2">
                  {goalsList.map(goal => {
                    const isSelected = formData.goals.includes(goal);
                    return (
                      <button
                        type="button"
                        key={goal}
                        onClick={() => handleGoalToggle(goal)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all duration-200 ${
                          isSelected 
                            ? 'bg-amber-400/10 border-amber-400/60 text-amber-300' 
                            : 'bg-slate-950/40 border-slate-800 text-zinc-400 hover:border-slate-700'
                        }`}
                      >
                        {goal}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div className="border-b border-slate-800 pb-3 mb-4">
                <h3 className="font-display font-black text-xl text-white flex items-center gap-2 uppercase tracking-tight">
                  <HeartPulse className="w-5.5 h-5.5 text-amber-500" />
                  Health & Emergency Profile
                </h3>
                <p className="text-xs text-slate-400 mt-1">Necessary safety credentials for tournament play and medical contingencies.</p>
              </div>

              {/* Emergency Contact Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
                    Emergency Contact Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Manas Dey (Father)"
                    value={formData.emergencyContactName}
                    onChange={e => setFormData(p => ({ ...p, emergencyContactName: e.target.value }))}
                    className={`w-full bg-slate-950/70 border ${errors.emergencyContactName ? 'border-red-500/80' : 'border-slate-800 focus:border-amber-500'} rounded-xl px-4 py-3 text-sm text-slate-100 outline-none transition-all placeholder:text-zinc-600`}
                  />
                  {errors.emergencyContactName && <p className="text-xs text-red-400 mt-1 font-mono">{errors.emergencyContactName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
                    Emergency Contact Phone <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 94330 XXXXX"
                    value={formData.emergencyContactPhone}
                    onChange={e => setFormData(p => ({ ...p, emergencyContactPhone: e.target.value }))}
                    className={`w-full bg-slate-950/70 border ${errors.emergencyContactPhone ? 'border-red-500/80' : 'border-slate-800 focus:border-amber-500'} rounded-xl px-4 py-3 text-sm text-slate-100 outline-none transition-all placeholder:text-zinc-600 font-mono`}
                  />
                  {errors.emergencyContactPhone && <p className="text-xs text-red-400 mt-1 font-mono">{errors.emergencyContactPhone}</p>}
                </div>
              </div>

              {/* Blood Group and Medical Conditions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
                    Blood Group
                  </label>
                  <select
                    value={formData.bloodGroup}
                    onChange={e => setFormData(p => ({ ...p, bloodGroup: e.target.value }))}
                    className="w-full bg-slate-950/70 border border-slate-800 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-slate-100 outline-none transition-all"
                  >
                    <option value="A+">A+ (A Positive)</option>
                    <option value="B+">B+ (B Positive)</option>
                    <option value="O+">O+ (O Positive)</option>
                    <option value="AB+">AB+ (AB Positive)</option>
                    <option value="A-">A- (A Negative)</option>
                    <option value="B-">B- (B Negative)</option>
                    <option value="O-">O- (O Negative)</option>
                    <option value="AB-">AB- (AB Negative)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
                    Medical Conditions / Allergies (If Any)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Asthma, Penicillin allergy (write 'None' if none)"
                    value={formData.medicalConditions}
                    onChange={e => setFormData(p => ({ ...p, medicalConditions: e.target.value }))}
                    className="w-full bg-slate-950/70 border border-slate-800 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-slate-100 outline-none transition-all placeholder:text-zinc-600"
                  />
                </div>
              </div>

              {/* Safety Confirmation Disclaimer */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex gap-3 mt-4 text-xs text-zinc-400 leading-normal">
                <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-200 block mb-0.5">Physical Fitness Declarative Statement</span>
                  I confirm that I am medically fit and healthy to participate in high-intensity sports activities under the guidance of Adamas Sports Club officials, and the emergency contacts provided are valid and active.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Controls Footer */}
        <div className="border-t border-slate-800 pt-5 flex justify-between items-center mt-8">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 hover:bg-slate-800/20 text-slate-300 text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div className="w-4" /> // placeholder spacer
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/10 text-slate-950 text-xs font-mono uppercase tracking-widest font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 hover:shadow-xl hover:shadow-amber-500/10 text-slate-950 text-xs font-mono uppercase tracking-widest font-black transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            >
              <span>{isEdit ? 'Save Changes' : 'Complete Registration'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
