export interface Registration {
  id: string; // Format: APP/2026/XXXX or APP/****/*****
  fullName: string;
  studentId: string;
  department: string;
  school: string;
  yearOfStudy: string; // "1st Year", "2nd Year", etc.
  email: string;
  phone: string;
  whatsappOptIn: boolean;
  gender: string;
  primarySport: string;
  secondarySport: string;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Competitive';
  goals: string[]; // ["Fitness", "Tournament representation", etc.]
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicalConditions: string;
  avatarUrl?: string; // custom base64 or preset path
  avatarPresetId: string; // ID of the preset sports avatar
  cardSkin: string; // 'royal-gold' | 'cyber-neon' | 'stealth-carbon' | 'crimson-pro' | 'emerald'
  registrationDate: string;
  bloodGroup?: string;
  status?: 'Pending' | 'Approved' | 'Rejected';
}

export interface SportConfig {
  id: string;
  name: string;
  emoji: string;
  iconName: string; // Lucide icon name
  description: string;
  category: 'Outdoor' | 'Indoor' | 'Athletics';
}

export interface CardSkinConfig {
  id: string;
  name: string;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  accentColor: string;
  glowColor: string;
  chipBg: string;
  backPattern: string;
}

export const SPORTS_LIST: SportConfig[] = [
  { id: 'football', name: 'Football', emoji: '⚽', iconName: 'Trophy', description: 'Experience the beautiful game on our FIFA-standard turf.', category: 'Outdoor' },
  { id: 'cricket', name: 'Cricket', emoji: '🏏', iconName: 'Shield', description: 'Perfect your shots and spin at our professional nets and oval.', category: 'Outdoor' },
  { id: 'basketball', name: 'Basketball', emoji: '🏀', iconName: 'Flame', description: 'High-octane drills and court tournaments in our indoor stadium.', category: 'Indoor' },
  { id: 'badminton', name: 'Badminton', emoji: '🏸', iconName: 'Zap', description: 'Fast reflexes and intense rallies on our multi-court arena.', category: 'Indoor' },
  { id: 'table_tennis', name: 'Table Tennis', emoji: '🏓', iconName: 'Activity', description: 'Precision, spin, and fast-paced indoor competitive matches.', category: 'Indoor' },
  { id: 'volleyball', name: 'Volleyball', emoji: '🏐', iconName: 'Globe', description: 'Smash and dig on our premium beach and hardcourt facilities.', category: 'Outdoor' },
  { id: 'chess', name: 'Chess', emoji: '♟️', iconName: 'Crown', description: 'Master strategy and tactical depth in our mental sports wing.', category: 'Indoor' },
  { id: 'athletics', name: 'Athletics', emoji: '🏃', iconName: 'Timer', description: 'Track events, sprints, high jump, and long jump arenas.', category: 'Athletics' }
];

export const ADAMAS_SCHOOLS = [
  { code: 'SOET', name: 'School of Engineering & Technology' },
  { code: 'SOS', name: 'School of Science' },
  { code: 'SOSS', name: 'School of Social Sciences' },
  { code: 'SOBE', name: 'School of Business & Economics' },
  { code: 'SOLJ', name: 'School of Law & Justice' },
  { code: 'SOMC', name: 'School of Media & Communication' },
  { code: 'SOMS', name: 'School of Medical Sciences' },
  { code: 'SOE', name: 'School of Education' },
  { code: 'SOLB', name: 'School of Life Science & Biotechnology' }
];

export const CARD_SKINS: CardSkinConfig[] = [
  {
    id: 'royal-gold',
    name: 'Royal Gold (Official)',
    bgGradient: 'from-slate-900 via-blue-950 to-slate-950',
    borderColor: 'border-amber-400/80',
    textColor: 'text-amber-100',
    accentColor: 'text-amber-400',
    glowColor: 'shadow-amber-500/20',
    chipBg: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
    backPattern: 'radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.15) 1px, transparent 1px)'
  },
  {
    id: 'cyber-neon',
    name: 'Cyber Neon',
    bgGradient: 'from-zinc-950 via-slate-900 to-zinc-900',
    borderColor: 'border-cyan-400/80',
    textColor: 'text-cyan-100',
    accentColor: 'text-cyan-400',
    glowColor: 'shadow-cyan-500/20',
    chipBg: 'bg-cyan-400/10 text-cyan-300 border-cyan-400/30',
    backPattern: 'linear-gradient(rgba(18, 18, 18, 0.2) 50%, rgba(0, 0, 0, 0.4) 50%)'
  },
  {
    id: 'stealth-carbon',
    name: 'Stealth Carbon',
    bgGradient: 'from-neutral-900 via-stone-950 to-neutral-950',
    borderColor: 'border-zinc-700',
    textColor: 'text-zinc-200',
    accentColor: 'text-zinc-400',
    glowColor: 'shadow-zinc-500/10',
    chipBg: 'bg-zinc-800/50 text-zinc-300 border-zinc-700',
    backPattern: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 10px)'
  },
  {
    id: 'crimson-pro',
    name: 'Crimson Ignite',
    bgGradient: 'from-slate-950 via-rose-950 to-stone-950',
    borderColor: 'border-rose-500/80',
    textColor: 'text-rose-100',
    accentColor: 'text-rose-400',
    glowColor: 'shadow-rose-500/25',
    chipBg: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    backPattern: 'radial-gradient(circle at 100% 100%, rgba(244, 63, 94, 0.15) 0%, transparent 50%)'
  },
  {
    id: 'emerald',
    name: 'Emerald Club',
    bgGradient: 'from-slate-950 via-emerald-950 to-zinc-950',
    borderColor: 'border-emerald-400/80',
    textColor: 'text-emerald-100',
    accentColor: 'text-emerald-400',
    glowColor: 'shadow-emerald-500/20',
    chipBg: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30',
    backPattern: 'radial-gradient(circle at 0% 0%, rgba(52, 211, 153, 0.15) 0%, transparent 50%)'
  }
];

export const PRESET_AVATARS = [
  { id: 'av-soccer', label: 'Striker', emoji: '⚽', bgColor: 'bg-blue-600/20 text-blue-400' },
  { id: 'av-cricket', label: 'All-Rounder', emoji: '🏏', bgColor: 'bg-amber-600/20 text-amber-400' },
  { id: 'av-basketball', label: 'Dunker', emoji: '🏀', bgColor: 'bg-orange-600/20 text-orange-400' },
  { id: 'av-badminton', label: 'Smasher', emoji: '🏸', bgColor: 'bg-teal-600/20 text-teal-400' },
  { id: 'av-runner', label: 'Sprinter', emoji: '⚡', bgColor: 'bg-violet-600/20 text-violet-400' },
  { id: 'av-chess', label: 'Tactician', emoji: '🧠', bgColor: 'bg-pink-600/20 text-pink-400' }
];

export const INITIAL_REGISTRATIONS: Registration[] = [
  {
    id: 'ASC-2026-1089',
    fullName: 'Rohan Dey',
    studentId: 'AU/2025/SOS/0129',
    school: 'SOS',
    department: 'Applied Mathematics',
    yearOfStudy: '2nd Year',
    email: 'rohan.dey1206@gmail.com',
    phone: '+91 82400 99887',
    whatsappOptIn: true,
    gender: 'Male',
    primarySport: 'cricket',
    secondarySport: 'chess',
    skillLevel: 'Competitive',
    goals: ['Tournament Representation', 'Recreational Play', 'Team Leadership'],
    emergencyContactName: 'Manas Dey (Father)',
    emergencyContactPhone: '+91 94330 98765',
    medicalConditions: 'None',
    avatarPresetId: 'av-cricket',
    cardSkin: 'cyber-neon',
    registrationDate: '2026-07-12T09:40:00Z',
    bloodGroup: 'B+',
    status: 'Approved'
  }
];
