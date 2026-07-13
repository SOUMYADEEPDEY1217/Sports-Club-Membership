import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { toPng } from 'html-to-image';
import { Registration, CARD_SKINS, PRESET_AVATARS, CardSkinConfig } from '../types';
import { Trophy, Phone, Heart, Award, Sparkles, RefreshCw, Eye, EyeOff, Check, Upload, HelpCircle, Download, ShieldCheck, AlertCircle, Lock } from 'lucide-react';

interface DigitalCardProps {
  registration: Registration;
  onSkinChange?: (skinId: string) => void;
  onAvatarChange?: (avatarId: string) => void;
  onPhotoUpload?: (base64: string) => void;
}

export default function DigitalCard({
  registration,
  onSkinChange,
  onAvatarChange,
  onPhotoUpload
}: DigitalCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [downloadingFront, setDownloadingFront] = useState(false);
  const [downloadingBack, setDownloadingBack] = useState(false);
  const currentSkin = CARD_SKINS.find(s => s.id === registration.cardSkin) || CARD_SKINS[0];

  const frontCaptureRef = useRef<HTMLDivElement>(null);
  const backCaptureRef = useRef<HTMLDivElement>(null);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  // Helper to trigger custom local picture upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (onPhotoUpload && typeof reader.result === 'string') {
          onPhotoUpload(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate barcode bars based on Student ID to make it look highly authentic
  const renderBarcode = (id: string) => {
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const barsCount = 36;
    const bars: React.ReactNode[] = [];
    
    for (let i = 0; i < barsCount; i++) {
      const isWide = ((hash + i) % 3 === 0) || ((i * 7) % 5 === 0);
      const isSpacing = (i % 4 === 0) && (i !== 0);
      
      if (isSpacing) {
        bars.push(<div key={`space-${i}`} className="w-1 h-full bg-transparent" />);
      }
      
      bars.push(
        <div 
          key={i} 
          className={`h-full bg-current`} 
          style={{ 
            width: isWide ? '3px' : '1px',
            opacity: ((hash + i) % 7 === 0) ? 0.4 : 0.85
          }} 
        />
      );
    }
    return <div className="flex items-center justify-center h-10 gap-[1px] text-zinc-300 overflow-hidden">{bars}</div>;
  };

  // Shared dot matrix generator for local rendering and high-res canvas exports
  const generateQRCodeMatrix = (text: string): boolean[][] => {
    const size = 18;
    const dots: boolean[][] = [];
    
    // Seeded random matrix generation
    let seed = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const pseudoRandom = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    for (let r = 0; r < size; r++) {
      dots[r] = [];
      for (let c = 0; c < size; c++) {
        // Finder patterns in corners
        const isFinder = 
          (r < 5 && c < 5) || 
          (r < 5 && c >= size - 5) || 
          (r >= size - 5 && c < 5);
        
        if (isFinder) {
          // Standard finder pattern square
          const innerR = r < 5 ? r : (r >= size - 5 ? r - (size - 5) : 0);
          const innerC = c < 5 ? c : (c >= size - 5 ? c - (size - 5) : 0);
          const isBorder = innerR === 0 || innerR === 4 || innerC === 0 || innerC === 4;
          const isCenter = innerR === 2 && innerC === 2;
          dots[r][c] = isBorder || isCenter;
        } else {
          dots[r][c] = pseudoRandom() > 0.45;
        }
      }
    }
    return dots;
  };

  // Custom visual QR-Code Matrix generator mapped to ID
  const renderQRCode = (text: string) => {
    const dots = generateQRCodeMatrix(text);

    return (
      <div className="grid grid-cols-18 gap-[1px] p-2 bg-white rounded-md w-28 h-28 items-center justify-center">
        {dots.map((row, rIdx) => 
          row.map((active, cIdx) => (
            <div 
              key={`${rIdx}-${cIdx}`} 
              className={`w-[5px] h-[5px] rounded-[1px] ${active ? 'bg-slate-900' : 'bg-transparent'}`} 
            />
          ))
        )}
      </div>
    );
  };

  const activeAvatar = PRESET_AVATARS.find(a => a.id === registration.avatarPresetId) || PRESET_AVATARS[0];

  const renderCardFront = (isCapture: boolean = false) => {
    return (
      <div className={`${isCapture ? 'relative w-[328px] h-[520px] shrink-0' : 'absolute inset-0 w-full h-full'} rounded-2xl border ${currentSkin.borderColor} bg-gradient-to-br ${currentSkin.bgGradient} p-6 flex flex-col justify-between overflow-hidden shadow-2xl ${!isCapture ? 'backface-hidden' : ''} ${currentSkin.glowColor} border-2`}>
        
        {/* Holographic background pattern glow overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: currentSkin.backPattern }} />
        <div className="absolute top-[-20%] right-[-20%] w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-15%] left-[-15%] w-48 h-48 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

        {/* Header branding */}
        <div className="flex justify-between items-start relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-tr from-blue-600 to-amber-500 p-1.5 rounded-lg shadow-md border border-amber-400/30">
              <Trophy className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-sm tracking-wide text-white leading-tight">ADAMAS</h3>
              <p className="text-[10px] font-mono tracking-widest text-amber-400 font-bold uppercase leading-none">SPORTS CLUB</p>
            </div>
          </div>
          
          <div className="text-right">
            <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 bg-slate-900/60 px-2 py-1 rounded-md border border-slate-800">
              ESTD 2026
            </span>
          </div>
        </div>

        {/* Microchip & Active Status */}
        <div className="flex justify-between items-center my-4 relative z-10">
          {/* Metallic Chip Visual */}
          <div className="w-11 h-8 rounded-md bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400 relative border border-amber-500/30 overflow-hidden flex flex-col justify-between p-1 shadow-inner">
            <div className="flex justify-between">
              <div className="w-2.5 h-1.5 border-r border-b border-amber-600/30" />
              <div className="w-2.5 h-1.5 border-l border-b border-amber-600/30" />
            </div>
            <div className="h-0.5 w-full bg-amber-600/25" />
            <div className="flex justify-between">
              <div className="w-2.5 h-1.5 border-r border-t border-amber-600/30" />
              <div className="w-2.5 h-1.5 border-l border-t border-amber-600/30" />
            </div>
          </div>

          {/* Status Badge - Dynamic depending on verification status */}
          {registration.status === 'Pending' ? (
            <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/40 px-2.5 py-1 rounded-full text-amber-400 font-mono text-[9px] font-semibold tracking-wider uppercase">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              PENDING
            </div>
          ) : registration.status === 'Rejected' ? (
            <div className="flex items-center gap-1.5 bg-red-500/15 border border-red-500/40 px-2.5 py-1 rounded-full text-red-400 font-mono text-[9px] font-semibold tracking-wider uppercase">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
              REJECTED
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/40 px-2.5 py-1 rounded-full text-emerald-400 font-mono text-[9px] font-semibold tracking-wider uppercase">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              ACTIVE MEMBER
            </div>
          )}
        </div>

        {/* Avatar & Core Profile Information */}
        <div className="flex gap-4 items-center my-3 relative z-10">
          {/* Profile Image / Avatar container */}
          <div className="relative">
            <div className={`w-20 h-20 rounded-xl overflow-hidden border-2 ${currentSkin.borderColor} bg-slate-950 flex items-center justify-center shadow-lg relative group/avatar`}>
              {registration.avatarUrl ? (
                <img 
                  src={registration.avatarUrl} 
                  alt={registration.fullName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className={`w-full h-full flex flex-col items-center justify-center ${activeAvatar.bgColor}`}>
                  <span className="text-3xl filter drop-shadow-md">{activeAvatar.emoji}</span>
                  <span className="text-[8px] font-mono tracking-tighter mt-1 text-center font-bold uppercase opacity-80">{activeAvatar.label}</span>
                </div>
              )}

              {/* Tiny edit button helper */}
              {!isCapture && (
                <div 
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity cursor-pointer duration-200"
                  onClick={(e) => {
                    e.stopPropagation(); // prevent flipping
                  }}
                >
                  <label htmlFor="file-upload-card" className="cursor-pointer flex flex-col items-center text-center p-1">
                    <Upload className="w-4 h-4 text-white" />
                    <span className="text-[8px] text-zinc-300 font-sans mt-1">Upload</span>
                  </label>
                  <input 
                    type="file" 
                    id="file-upload-card" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileChange} 
                  />
                </div>
              )}
            </div>
            
            {/* Overlay Badge for primary sport */}
            <div className="absolute -bottom-2 -right-1.5 bg-amber-500 text-slate-950 p-1 rounded-lg border border-amber-400 shadow-md">
              <span className="text-xs">{registration.primarySport === 'football' ? '⚽' : registration.primarySport === 'cricket' ? '🏏' : registration.primarySport === 'basketball' ? '🏀' : registration.primarySport === 'badminton' ? '🏸' : registration.primarySport === 'table_tennis' ? '🏓' : registration.primarySport === 'chess' ? '♟️' : registration.primarySport === 'volleyball' ? '🏐' : registration.primarySport === 'athletics' ? '🏃' : '🏆'}</span>
            </div>
          </div>

          {/* Student Details */}
          <div className="flex-1 min-w-0">
            <h4 className="font-display font-bold text-base text-white tracking-tight leading-snug truncate" title={registration.fullName}>
              {registration.fullName}
            </h4>
            
            <p className="text-xs font-mono font-medium text-amber-400 mt-0.5 tracking-wide">
              {registration.studentId}
            </p>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md ${currentSkin.chipBg}`}>
                {registration.school}
              </span>
              <span className="text-[9px] font-mono bg-slate-800/80 text-zinc-300 px-2 py-0.5 rounded-md border border-slate-700/60">
                {registration.yearOfStudy}
              </span>
            </div>
          </div>
        </div>

        {/* Card Footer with Sport detail grids */}
        <div className="border-t border-slate-800/80 pt-3.5 mt-2 relative z-10">
          <div className="grid grid-cols-2 gap-4 text-left">
            <div>
              <p className="text-[8px] font-mono uppercase tracking-widest text-zinc-500">PRIMARY ATHLETIC FOCUS</p>
              <p className={`text-xs font-display font-semibold ${currentSkin.accentColor} mt-0.5 capitalize`}>
                {registration.primarySport.replace('_', ' ')}
              </p>
            </div>
            <div>
              <p className="text-[8px] font-mono uppercase tracking-widest text-zinc-500">SKILL RATING</p>
              <p className="text-xs font-sans font-bold text-slate-200 mt-0.5">
                {registration.skillLevel}
              </p>
            </div>
          </div>

          {/* Dynamic Barcode Visual */}
          <div className="mt-4 pt-1 flex flex-col items-center">
            {renderBarcode(registration.studentId)}
            <span className="text-[8px] font-mono tracking-[4px] text-zinc-400 mt-1 uppercase">
              {registration.id}
            </span>
          </div>
        </div>
        
      </div>
    );
  };

  const renderCardBack = (isCapture: boolean = false) => {
    return (
      <div className={`${isCapture ? 'relative w-[328px] h-[520px] shrink-0' : 'absolute inset-0 w-full h-full'} rounded-2xl border ${currentSkin.borderColor} bg-gradient-to-br ${currentSkin.bgGradient} p-6 flex flex-col justify-between shadow-2xl ${!isCapture ? 'backface-hidden rotate-y-180' : ''} border-2`}>
        
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: currentSkin.backPattern }} />
        
        {/* Header bar */}
        <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono tracking-wider font-semibold text-white">ADAMAS MEMBER PORTAL</span>
          </div>
          <span className="text-[9px] font-mono bg-red-900/40 text-red-300 px-2 py-0.5 rounded border border-red-800/60">
            OFFICIAL USE
          </span>
        </div>

        {/* Medical & Emergency Grid */}
        <div className="my-3 space-y-3 flex-1 overflow-y-auto pr-1">
          {/* Emergency Contacts */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3">
            <p className="text-[8px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1 mb-1.5">
              <Phone className="w-3 h-3 text-emerald-400" />
              EMERGENCY CONTACT
            </p>
            <p className="text-xs font-sans font-semibold text-slate-100 truncate">
              {registration.emergencyContactName || 'Not Provided'}
            </p>
            <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
              {registration.emergencyContactPhone || 'N/A'}
            </p>
          </div>

          {/* Medical Information & Blood Group */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3">
              <p className="text-[8px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1 mb-1">
                <Heart className="w-3 h-3 text-red-400" />
                BLOOD TYPE
              </p>
              <p className="text-sm font-mono font-bold text-red-400">
                {registration.bloodGroup || 'O+'}
              </p>
            </div>
            
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3">
              <p className="text-[8px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1 mb-1">
                <Award className="w-3 h-3 text-blue-400" />
                SECONDARY
              </p>
              <p className="text-xs font-sans font-bold text-slate-200 capitalize truncate">
                {registration.secondarySport.replace('_', ' ') || 'None'}
              </p>
            </div>
          </div>

          {/* Medical Condition Banner */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3">
            <p className="text-[8px] font-mono uppercase tracking-widest text-zinc-400 mb-1">MEDICAL INFO / NOTES</p>
            <p className="text-[11px] font-sans text-zinc-300 italic">
              {registration.medicalConditions || 'No critical conditions disclosed.'}
            </p>
          </div>
        </div>

        {/* Back bottom QR section */}
        <div className="flex gap-4 items-center border-t border-slate-800/80 pt-4 mt-1">
          <div className="flex-1">
            <p className="text-[10px] font-mono font-bold text-white mb-0.5">DIGITAL CARD QR</p>
            <p className="text-[9px] font-sans text-zinc-400 leading-relaxed">
              Scan to verify club enrollment status, access equipment checkout counters, and enter indoor stadium gates.
            </p>
            <div className="mt-2 flex items-center gap-1 text-[8px] font-mono text-amber-400">
              <Sparkles className="w-2.5 h-2.5" />
              <span>SECURE SIGNED STATUS</span>
            </div>
          </div>
          <div className="flex-shrink-0 border border-slate-700 p-1 bg-white rounded-lg shadow-lg">
            {renderQRCode(registration.id)}
          </div>
        </div>
      </div>
    );
  };

  const handleDownload = async (side: 'front' | 'back') => {
    if (side === 'front') setDownloadingFront(true);
    else setDownloadingBack(true);

    // Wait a brief tick to ensure any state updates are completed
    await new Promise(resolve => setTimeout(resolve, 150));

    const element = side === 'front' ? frontCaptureRef.current : backCaptureRef.current;
    if (!element) {
      console.error("Capture element not found");
      if (side === 'front') setDownloadingFront(false);
      else setDownloadingBack(false);
      return;
    }

    try {
      // Capture the element using html-to-image with high resolution pixelRatio
      const dataUrl = await toPng(element, {
        pixelRatio: 2, // 2x resolution for high-res retina output (656x1040 px)
        cacheBust: true,
        backgroundColor: 'transparent',
        style: {
          transform: 'none',
          boxShadow: 'none',
        }
      });

      const link = document.createElement('a');
      link.download = `${registration.fullName.replace(/\s+/g, '_')}_sports_card_${side}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("HTML conversion to PNG failed:", err);
    } finally {
      if (side === 'front') setDownloadingFront(false);
      else setDownloadingBack(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Hidden container for perfect flat captures without 3D transforms */}
      <div className="absolute left-[-9999px] top-[-9999px] pointer-events-none" aria-hidden="true" style={{ width: '328px', height: '520px', overflow: 'hidden' }}>
        <div ref={frontCaptureRef} className="w-[328px] h-[520px]">
          {renderCardFront(true)}
        </div>
        <div ref={backCaptureRef} className="w-[328px] h-[520px]">
          {renderCardBack(true)}
        </div>
      </div>

      {/* Interactive Helper Hint */}
      <p className="text-xs text-amber-500 font-mono mb-4 flex items-center gap-1.5 bg-amber-500/10 px-4 py-2 rounded-full border border-amber-500/20">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" style={{ animationDuration: '6s' }} />
        <span>Click Card to Flip in 3D & View QR Code</span>
      </p>

      {/* 3D Perspective Card Wrapper styled strictly to credit card aspect ratio (1:1.585) */}
      <div 
        id={`card-${registration.id}`}
        className="w-full max-w-[328px] h-[520px] perspective-1000 cursor-pointer group"
        onClick={handleFlip}
      >
        <motion.div 
          className="w-full h-full preserve-3d relative duration-700 select-none"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
        >
          {renderCardFront(false)}
          {renderCardBack(false)}
        </motion.div>
      </div>

      {/* Download Action Option Panel or Verification Lock Alert */}
      {registration.status !== 'Approved' ? (
        <div className="w-full max-w-[328px] mt-4 bg-slate-950/70 border border-amber-500/20 rounded-2xl p-4 text-center space-y-3 shadow-xl backdrop-blur-md relative z-10">
          <div className="w-10 h-10 bg-amber-500/10 text-amber-500 flex items-center justify-center rounded-xl mx-auto border border-amber-500/20">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h5 className="font-display font-bold text-xs text-slate-100 uppercase tracking-wider">
              {registration.status === 'Rejected' ? 'Verification Rejected' : 'Verification In Progress'}
            </h5>
            <p className="text-[11px] text-zinc-400 mt-1 leading-normal">
              {registration.status === 'Rejected' 
                ? 'Your enrollment was rejected by administration. Please click "Edit Profile Details" below to revise and re-submit for verification.'
                : 'The Sports Club administration must verify and accept your enrollment before you can download or activate your digital QR card.'}
            </p>
          </div>
          {registration.status === 'Pending' ? (
            <div className="text-[10px] font-mono text-amber-400 bg-amber-500/5 py-1.5 rounded-lg border border-amber-500/10 uppercase tracking-widest font-bold">
              ⏳ Awaiting Admin Approval
            </div>
          ) : (
            <div className="text-[10px] font-mono text-red-400 bg-red-500/5 py-1.5 rounded-lg border border-red-500/10 uppercase tracking-widest font-bold">
              ❌ REJECTED / NEEDS REVISION
            </div>
          )}
        </div>
      ) : (
        <div className="w-full max-w-[328px] mt-4 grid grid-cols-2 gap-3 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload('front');
            }}
            disabled={downloadingFront}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 text-xs font-mono font-black uppercase tracking-wider py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.15)]"
          >
            {downloadingFront ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download Front</span>
              </>
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload('back');
            }}
            disabled={downloadingBack}
            className="bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-100 border border-slate-700 text-xs font-mono font-black uppercase tracking-wider py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {downloadingBack ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download Back</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Card Skin Customization Controls */}
      <div className="w-full max-w-[328px] mt-6 bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
        <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Card Collectible Skins</span>
        </h4>
        
        <div className="grid grid-cols-5 gap-2">
          {CARD_SKINS.map((skin) => {
            const isSelected = registration.cardSkin === skin.id;
            return (
              <button
                key={skin.id}
                onClick={() => onSkinChange && onSkinChange(skin.id)}
                className={`h-9 rounded-lg border flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 ${
                  isSelected 
                    ? `border-amber-400 scale-105 shadow-md shadow-amber-400/10` 
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/80'
                }`}
                title={skin.name}
              >
                {/* Skin Visual Color Indicator */}
                <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${skin.bgGradient} border border-white/10`} />
                
                {isSelected && (
                  <div className="absolute top-0 right-0 bg-amber-400 text-slate-950 p-[1px] rounded-bl">
                    <Check className="w-2 h-2 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Avatar Presets for Student Profile */}
      <div className="w-full max-w-[328px] mt-3 bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
        <h4 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>Athletic Avatar Style</span>
        </h4>
        
        <div className="grid grid-cols-4 gap-2">
          {PRESET_AVATARS.map((avatar) => {
            const isSelected = registration.avatarPresetId === avatar.id && !registration.avatarUrl;
            return (
              <button
                key={avatar.id}
                onClick={() => onAvatarChange && onAvatarChange(avatar.id)}
                className={`py-1.5 px-2 rounded-lg border text-sm flex flex-col items-center justify-center transition-all duration-300 ${
                  isSelected 
                    ? 'border-amber-400 bg-amber-500/10 scale-105 font-bold' 
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
                }`}
              >
                <span className="text-xl">{avatar.emoji}</span>
                <span className="text-[8px] font-mono text-zinc-400 mt-1 uppercase leading-none">{avatar.label}</span>
              </button>
            );
          })}
        </div>
        
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
          <span className="font-sans">Or upload your custom photograph:</span>
          <label 
            htmlFor="file-upload-footer" 
            className="text-[10px] font-mono text-amber-500 hover:text-amber-400 cursor-pointer flex items-center gap-1 border border-amber-500/30 px-2 py-1 rounded bg-amber-500/5 hover:bg-amber-500/10 transition-colors"
          >
            <Upload className="w-3 h-3" />
            <span>Select File</span>
          </label>
          <input 
            type="file" 
            id="file-upload-footer" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileChange} 
          />
        </div>
      </div>
    </div>
  );
}

