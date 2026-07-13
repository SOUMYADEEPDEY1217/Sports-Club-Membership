import React, { useState } from 'react';
import { motion } from 'motion/react';
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

  // Promise helper to cleanly load images onto a canvas context
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });
  };

  // Helper to wrap notes cleanly inside emergency / health notes box on the canvas
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  };

  // Fallback profile avatar drawer on canvas if base64 load fails
  const drawFallbackAvatar = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, name: string) => {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, y, size, size);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    ctx.fillText(initials, x + size / 2, y + size / 2);
    ctx.textBaseline = 'alphabetic'; // reset
    ctx.textAlign = 'left';
  };

  // Generate and download highly polished, crisp 2x retina HD PNG cards
  const handleDownload = async (side: 'front' | 'back') => {
    if (side === 'front') setDownloadingFront(true);
    else setDownloadingBack(true);

    try {
      // Offscreen canvas matching the exact standard CR80 credit card ratio (1:1.585) in HD
      const width = 656; // 328 * 2
      const height = 1040; // 520 * 2
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 1. Draw rounded card mask path
      const radius = 32;
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.lineTo(width - radius, 0);
      ctx.quadraticCurveTo(width, 0, width, radius);
      ctx.lineTo(width, height - radius);
      ctx.quadraticCurveTo(width, height, width - radius, height);
      ctx.lineTo(radius, height);
      ctx.quadraticCurveTo(0, height, 0, height - radius);
      ctx.lineTo(0, radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
      ctx.closePath();

      // 2. Set background linear gradient matching current skin selection
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      if (registration.cardSkin === 'royal-gold') {
        bgGrad.addColorStop(0, '#0f172a');
        bgGrad.addColorStop(0.5, '#172554');
        bgGrad.addColorStop(1, '#020617');
      } else if (registration.cardSkin === 'cyber-neon') {
        bgGrad.addColorStop(0, '#09090b');
        bgGrad.addColorStop(0.5, '#0f172a');
        bgGrad.addColorStop(1, '#18181b');
      } else if (registration.cardSkin === 'stealth-carbon') {
        bgGrad.addColorStop(0, '#171717');
        bgGrad.addColorStop(0.5, '#0c0a09');
        bgGrad.addColorStop(1, '#0a0a0a');
      } else if (registration.cardSkin === 'crimson-pro') {
        bgGrad.addColorStop(0, '#020617');
        bgGrad.addColorStop(0.5, '#4c0519');
        bgGrad.addColorStop(1, '#1c1917');
      } else { // emerald
        bgGrad.addColorStop(0, '#020617');
        bgGrad.addColorStop(0.5, '#022c22');
        bgGrad.addColorStop(1, '#09090b');
      }

      ctx.fillStyle = bgGrad;
      ctx.fill();

      // 3. Draw outer border outline
      let borderColor = '#fbbf24';
      if (registration.cardSkin === 'royal-gold') {
        borderColor = '#fbbf24';
      } else if (registration.cardSkin === 'cyber-neon') {
        borderColor = '#22d3ee';
      } else if (registration.cardSkin === 'stealth-carbon') {
        borderColor = '#52525b';
      } else if (registration.cardSkin === 'crimson-pro') {
        borderColor = '#f43f5e';
      } else if (registration.cardSkin === 'emerald') {
        borderColor = '#34d399';
      }

      ctx.lineWidth = 6;
      ctx.strokeStyle = borderColor;
      ctx.stroke();

      if (side === 'front') {
        // ==========================================
        // DRAW CARD FRONT (HD EXPORT)
        // ==========================================
        
        // Trophy Emoji Header
        ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
        ctx.fillText('🏆', 40, 72);

        // Header Club Title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
        ctx.fillText('ADAMAS', 90, 60);

        ctx.fillStyle = borderColor;
        ctx.font = 'bold 13px monospace';
        ctx.fillText('SPORTS CLUB', 90, 80);

        // ESTD 2026 Badge
        ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
        const bW = 92;
        const bH = 28;
        const bX = width - 40 - bW;
        const bY = 52;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(bX, bY, bW, bH, 6) : ctx.rect(bX, bY, bW, bH);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#a1a1aa';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ESTD 2026', bX + bW / 2, bY + 18);
        ctx.textAlign = 'left';

        // Metallic Microchip
        const mX = 40;
        const mY = 135;
        const mW = 80;
        const mH = 56;
        const mGrad = ctx.createLinearGradient(mX, mY, mX + mW, mY + mH);
        mGrad.addColorStop(0, '#fde047');
        mGrad.addColorStop(0.5, '#fef08a');
        mGrad.addColorStop(1, '#fbbf24');
        ctx.fillStyle = mGrad;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(mX, mY, mW, mH, 8) : ctx.rect(mX, mY, mW, mH);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Chip detail grids
        ctx.strokeStyle = 'rgba(120, 53, 4, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(mX + mW / 3, mY);
        ctx.lineTo(mX + mW / 3, mY + mH);
        ctx.moveTo(mX + (mW * 2) / 3, mY);
        ctx.lineTo(mX + (mW * 2) / 3, mY + mH);
        ctx.moveTo(mX, mY + mH / 2);
        ctx.lineTo(mX + mW, mY + mH / 2);
        ctx.stroke();

        // ACTIVE MEMBER badge (Static layout, non-blinking)
        const actX = width - 40 - 134;
        const actY = 146;
        const actW = 134;
        const actH = 32;
        ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(actX, actY, actW, actH, 16) : ctx.rect(actX, actY, actW, actH);
        ctx.fill();
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#34d399';
        ctx.beginPath();
        ctx.arc(actX + 16, actY + actH / 2, 4, 0, 2 * Math.PI);
        ctx.fill();

        ctx.font = 'bold 10px monospace';
        ctx.fillText('ACTIVE MEMBER', actX + 28, actY + 20);

        // Profile Photo / Preset Avatar
        const pSize = 140;
        const pX = 40;
        const pY = 220;

        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(pX, pY, pSize, pSize, 16) : ctx.rect(pX, pY, pSize, pSize);
        ctx.fill();
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        if (registration.avatarUrl) {
          try {
            const profileImg = await loadImage(registration.avatarUrl);
            ctx.save();
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(pX, pY, pSize, pSize, 16) : ctx.rect(pX, pY, pSize, pSize);
            ctx.clip();
            ctx.drawImage(profileImg, pX, pY, pSize, pSize);
            ctx.restore();
          } catch (e) {
            drawFallbackAvatar(ctx, pX, pY, pSize, registration.fullName);
          }
        } else {
          const avatar = PRESET_AVATARS.find(a => a.id === registration.avatarPresetId) || PRESET_AVATARS[0];
          ctx.fillStyle = 'rgba(37, 99, 235, 0.15)';
          if (avatar.id === 'av-soccer') ctx.fillStyle = 'rgba(37, 99, 235, 0.15)';
          else if (avatar.id === 'av-cricket') ctx.fillStyle = 'rgba(217, 119, 6, 0.15)';
          else if (avatar.id === 'av-basketball') ctx.fillStyle = 'rgba(234, 88, 12, 0.15)';
          else if (avatar.id === 'av-badminton') ctx.fillStyle = 'rgba(13, 148, 136, 0.15)';
          else if (avatar.id === 'av-runner') ctx.fillStyle = 'rgba(124, 58, 237, 0.15)';
          else if (avatar.id === 'av-chess') ctx.fillStyle = 'rgba(219, 39, 119, 0.15)';

          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(pX, pY, pSize, pSize, 16) : ctx.rect(pX, pY, pSize, pSize);
          ctx.fill();

          ctx.font = '72px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText(avatar.emoji, pX + pSize / 2, pY + pSize / 2 + 20);

          ctx.fillStyle = '#a1a1aa';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(avatar.label.toUpperCase(), pX + pSize / 2, pY + pSize - 12);
          ctx.textAlign = 'left';
        }

        // Primary Sport Emoji Overlapping Badge
        const bIconX = pX + pSize - 16;
        const bIconY = pY + pSize - 16;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(bIconX, bIconY, 20, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = '18px system-ui';
        ctx.textAlign = 'center';
        const sportEmoji = registration.primarySport === 'football' ? '⚽' : registration.primarySport === 'cricket' ? '🏏' : registration.primarySport === 'basketball' ? '🏀' : registration.primarySport === 'badminton' ? '🏸' : registration.primarySport === 'table_tennis' ? '🏓' : registration.primarySport === 'chess' ? '♟️' : registration.primarySport === 'volleyball' ? '🏐' : registration.primarySport === 'athletics' ? '🏃' : '🏆';
        ctx.fillText(sportEmoji, bIconX, bIconY + 6);
        ctx.textAlign = 'left';

        // Student Names & ID
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
        let nameToDraw = registration.fullName;
        if (nameToDraw.length > 18) {
          nameToDraw = nameToDraw.substring(0, 16) + '...';
        }
        ctx.fillText(nameToDraw, pX + pSize + 20, pY + 40);

        ctx.fillStyle = borderColor;
        ctx.font = 'bold 15px monospace';
        ctx.fillText(registration.studentId, pX + pSize + 20, pY + 70);

        // School and Study Year badges
        const schoolX = pX + pSize + 20;
        const schoolY = pY + 92;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(schoolX, schoolY, 74, 26, 6) : ctx.rect(schoolX, schoolY, 74, 26);
        ctx.fill();
        ctx.fillStyle = '#e4e4e7';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(registration.school, schoolX + 10, schoolY + 17);

        const yearX = schoolX + 82;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(yearX, schoolY, 94, 26, 6) : ctx.rect(yearX, schoolY, 94, 26);
        ctx.fill();
        ctx.fillStyle = '#e4e4e7';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(registration.yearOfStudy, yearX + 10, schoolY + 17);

        // Mid Divider
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(40, 410);
        ctx.lineTo(width - 40, 410);
        ctx.stroke();

        // Bottom focus categories
        ctx.fillStyle = '#71717a';
        ctx.font = '900 10px monospace';
        ctx.fillText('PRIMARY ATHLETIC FOCUS', 40, 450);
        ctx.fillText('SKILL RATING', width / 2 + 10, 450);

        ctx.fillStyle = borderColor;
        ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
        ctx.fillText(registration.primarySport.replace('_', ' ').toUpperCase(), 40, 482);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
        ctx.fillText(registration.skillLevel, width / 2 + 10, 482);

        // Barcode Drawer
        const barcodeY = 530;
        const barcodeH = 70;
        const bHash = registration.studentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const bCount = 44;
        const barStartX = (width - (bCount * 8)) / 2;

        for (let i = 0; i < bCount; i++) {
          const isWide = ((bHash + i) % 3 === 0) || ((i * 7) % 5 === 0);
          const isSpacing = (i % 5 === 0) && (i !== 0);
          if (!isSpacing) {
            const barW = isWide ? 5 : 1.5;
            const barOpacity = ((bHash + i) % 7 === 0) ? 0.35 : 0.85;
            ctx.fillStyle = `rgba(255, 255, 255, ${barOpacity})`;
            ctx.fillRect(barStartX + (i * 8), barcodeY, barW, barcodeH);
          }
        }

        // Card ID centered under barcode
        ctx.fillStyle = '#a1a1aa';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(registration.id, width / 2, barcodeY + barcodeH + 26);
        ctx.textAlign = 'left';

      } else {
        // ==========================================
        // DRAW CARD BACK (HD EXPORT)
        // ==========================================
        
        ctx.fillStyle = borderColor;
        ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
        ctx.fillText('🏆  ADAMAS MEMBER PORTAL', 40, 68);

        // Official Badge
        const badgeW = 104;
        const badgeH = 28;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(width - 40 - badgeW, 46, badgeW, badgeH, 6) : ctx.rect(width - 40 - badgeW, badgeH, badgeW, badgeH);
        ctx.fill();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('OFFICIAL USE', width - 40 - badgeW / 2, 64);
        ctx.textAlign = 'left';

        // Divider
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(40, 100);
        ctx.lineTo(width - 40, 100);
        ctx.stroke();

        // Box 1: Emergency Contact Info
        const b1Y = 125;
        const bW = width - 80;
        const b1H = 96;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(40, b1Y, bW, b1H, 14) : ctx.rect(40, b1Y, bW, b1H);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#a1a1aa';
        ctx.font = '900 10px monospace';
        ctx.fillText('📞  EMERGENCY CONTACT', 56, b1Y + 28);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px system-ui, sans-serif';
        ctx.fillText(registration.emergencyContactName || 'Not Provided', 56, b1Y + 54);
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '13px monospace';
        ctx.fillText(registration.emergencyContactPhone || 'N/A', 56, b1Y + 76);

        // Box 2 & 3 Grid: Blood Group & Secondary
        const b2Y = 245;
        const gridW = (width - 80 - 20) / 2;
        const gridH = 96;

        // Blood Group Box
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(40, b2Y, gridW, gridH, 14) : ctx.rect(40, b2Y, gridW, gridH);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#a1a1aa';
        ctx.font = '900 10px monospace';
        ctx.fillText('❤️  BLOOD TYPE', 56, b2Y + 28);
        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 24px monospace';
        ctx.fillText(registration.bloodGroup || 'O+', 56, b2Y + 68);

        // Secondary focus Box
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(40 + gridW + 20, b2Y, gridW, gridH, 14) : ctx.rect(40 + gridW + 20, b2Y, gridW, gridH);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#a1a1aa';
        ctx.font = '900 10px monospace';
        ctx.fillText('🏅  SECONDARY FOCUS', 40 + gridW + 36, b2Y + 28);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px system-ui, sans-serif';
        ctx.fillText(registration.secondarySport.replace('_', ' ').toUpperCase() || 'NONE', 40 + gridW + 36, b2Y + 62);

        // Box 4: Medical conditions / Notes
        const b3Y = 365;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(40, b3Y, bW, 96, 14) : ctx.rect(40, b3Y, bW, 96);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#a1a1aa';
        ctx.font = '900 10px monospace';
        ctx.fillText('MEDICAL INFO / HEALTH NOTES', 56, b3Y + 28);
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'italic 12px system-ui, sans-serif';
        const medNotes = registration.medicalConditions || 'No critical conditions disclosed.';
        wrapText(ctx, medNotes, 56, b3Y + 52, bW - 32, 18);

        // QR Code bottom panel
        const footY = 490;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(40, footY);
        ctx.lineTo(width - 40, footY);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('DIGITAL CARD QR CODE', 40, footY + 36);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px system-ui, sans-serif';
        wrapText(ctx, 'Scan to verify club enrollment status, access equipment checkout counters, and enter indoor stadium gates securely.', 40, footY + 60, width - 260, 16);

        ctx.fillStyle = borderColor;
        ctx.font = 'bold 10px monospace';
        ctx.fillText('✨ SECURE SIGNED STATUS', 40, footY + 128);

        // Draw back QR matrix
        const qrSize = 150;
        const qrX = width - 40 - qrSize;
        const qrY = footY + 20;

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 10) : ctx.rect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16);
        ctx.fill();

        const qrMatrix = generateQRCodeMatrix(registration.id);
        const cellSz = qrSize / 18;
        ctx.fillStyle = '#0f172a';
        for (let r = 0; r < 18; r++) {
          for (let c = 0; c < 18; c++) {
            if (qrMatrix[r][c]) {
              ctx.fillRect(qrX + (c * cellSz), qrY + (r * cellSz), cellSz + 0.5, cellSz + 0.5);
            }
          }
        }
      }

      // Draw anchor and trigger automatic browser file download
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${registration.fullName.replace(/\s+/g, '_')}_sports_card_${side}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Canvas export failed:", err);
    } finally {
      if (side === 'front') setDownloadingFront(false);
      else setDownloadingBack(false);
    }
  };

  const activeAvatar = PRESET_AVATARS.find(a => a.id === registration.avatarPresetId) || PRESET_AVATARS[0];

  return (
    <div className="flex flex-col items-center">
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
          
          {/* ==================================== */}
          {/*             CARD FRONT               */}
          {/* ==================================== */}
          <div className={`absolute inset-0 w-full h-full rounded-2xl border ${currentSkin.borderColor} bg-gradient-to-br ${currentSkin.bgGradient} p-6 flex flex-col justify-between overflow-hidden shadow-2xl backface-hidden ${currentSkin.glowColor} border-2`}>
            
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

          {/* ==================================== */}
          {/*             CARD BACK                */}
          {/* ==================================== */}
          <div className={`absolute inset-0 w-full h-full rounded-2xl border ${currentSkin.borderColor} bg-gradient-to-br ${currentSkin.bgGradient} p-6 flex flex-col justify-between shadow-2xl backface-hidden rotate-y-180 border-2`}>
            
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
