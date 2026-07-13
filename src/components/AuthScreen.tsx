import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../firebase';
import { Mail, Lock, User, Sparkles, Trophy, ArrowRight, RefreshCw, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';

interface AuthScreenProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function AuthScreen({ onSuccess, onCancel }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showForgotMsg, setShowForgotMsg] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    
    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (isSignUp && !fullName) {
      setError('Please enter your full name.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up flow
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: fullName
        });
        setSuccessMsg('Account created successfully! Welcome to Adamas Sports Club.');
      } else {
        // Sign in flow with admin auto-fallback
        const isTargetAdmin = email.trim().toLowerCase() === 'rohan.dey1206@gmail.com' && password === 'Soumya@1206';
        if (isTargetAdmin) {
          try {
            await signInWithEmailAndPassword(auth, email, password);
          } catch (adminErr: any) {
            if (adminErr.code === 'auth/user-not-found' || adminErr.code === 'auth/invalid-credential' || adminErr.code === 'auth/wrong-password') {
              // Admin account does not exist or credentials changed in auth DB. Let's try to create or reset.
              try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(userCredential.user, {
                  displayName: 'Admin Soumyadeep Dey'
                });
              } catch (createErr) {
                // If account exists but password was wrong, try to sign in again or let the error bubble
                throw adminErr;
              }
            } else {
              throw adminErr;
            }
          }
        } else {
          await signInWithEmailAndPassword(auth, email, password);
        }
        setSuccessMsg('Signed in successfully! Loading your athletic card...');
      }
      
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      let message = 'An error occurred. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Please sign in instead.';
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        message = 'Invalid email or password. Please try again.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address to request a reset link.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setShowForgotMsg(true);
      setSuccessMsg('Password reset link sent to your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      setSuccessMsg(`Welcome, ${result.user.displayName || 'Athlete'}! Signed in successfully with Google.`);
      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch (err: any) {
      console.error("Google Authentication error:", err);
      let message = 'Failed to authenticate with Google.';
      if (err.code === 'auth/unauthorized-domain') {
        message = 'unauthorized-domain';
      } else if (err.code === 'auth/popup-blocked') {
        message = 'The Google sign-in popup was blocked. Please enable popups in your browser.';
      } else if (err.code === 'auth/popup-closed-by-user') {
        message = 'Sign-in window was closed before completion.';
      } else if (err.code === 'auth/operation-not-allowed') {
        message = 'Google Sign-In is not enabled. Please enable it in your Firebase Console > Authentication > Sign-in method.';
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      {/* Background radial accent */}
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
      
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center rounded-2xl mx-auto mb-4 shadow-inner">
          <Trophy className="w-6 h-6" />
        </div>
        <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">
          {isSignUp ? 'Create Athlete Account' : 'Sign In To Sports Club'}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          {isSignUp 
            ? 'Sign up to register and unlock your 3D interactive sports membership card.' 
            : 'Access your dynamic athlete card, edit card styles, and track your events.'}
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.form 
          key={isSignUp ? 'signup' : 'signin'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          onSubmit={handleSubmit} 
          className="space-y-4"
        >
          {error && error === 'unauthorized-domain' ? (
            <div className="bg-amber-500/10 border border-amber-500/20 text-slate-100 p-4 rounded-xl flex flex-col gap-3 text-xs">
              <div className="flex items-start gap-2 text-amber-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-bold uppercase tracking-tight">Domain Authorization Required</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                Google Sign-In is restricted to domains authorized in your Firebase console. To skip setup and register instantly, use the button below:
              </p>
              
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setIsSignUp(true);
                }}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-mono font-black uppercase tracking-widest py-2.5 rounded-lg transition-all text-center cursor-pointer shadow-md"
              >
                Create Account with Email instead (Instant)
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800/60"></div>
                <span className="flex-shrink mx-3 text-[9px] font-mono text-zinc-500 uppercase tracking-widest">or configure domain</span>
                <div className="flex-grow border-t border-slate-800/60"></div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 space-y-1.5 font-mono">
                <span className="text-[9px] text-zinc-500 block uppercase tracking-wider font-bold">Copy Preview Domain:</span>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-amber-500 text-[10px] select-all break-all">{window.location.hostname}</code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.hostname);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className={`px-2 py-1 border text-[9px] rounded uppercase font-bold transition-all ${
                      copied 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 text-amber-400'
                    }`}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="text-[11px] text-zinc-400 space-y-1 bg-slate-950/40 p-3 rounded-lg border border-slate-850">
                <p className="font-bold text-slate-200 uppercase tracking-widest text-[9px] mb-1">Steps to Authorize:</p>
                <ol className="list-decimal pl-4 space-y-1 text-zinc-300">
                  <li>Go to your <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:underline inline-flex items-center gap-0.5 font-bold">Firebase Console <ExternalLink className="w-2.5 h-2.5" /></a></li>
                  <li>Click <span className="text-slate-200 font-semibold">Authentication</span> &gt; <span className="text-slate-200 font-semibold">Settings</span> (tab)</li>
                  <li>Click <span className="text-slate-200 font-semibold">Authorized domains</span> &gt; <span className="text-slate-200 font-semibold">Add domain</span></li>
                  <li>Paste the copied domain and click <span className="text-slate-200 font-semibold">Add</span></li>
                </ol>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : null}

          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl flex items-start gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {isSignUp && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/10 text-xs text-white pl-10 pr-4 py-3 rounded-xl transition-all font-sans placeholder:text-zinc-600 outline-none"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@adamasuniversity.ac.in"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/10 text-xs text-white pl-10 pr-4 py-3 rounded-xl transition-all font-sans placeholder:text-zinc-600 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold">Password</label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[10px] font-mono text-amber-500 hover:text-amber-400 hover:underline"
                >
                  Forgot?
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/10 text-xs text-white pl-10 pr-4 py-3 rounded-xl transition-all font-sans placeholder:text-zinc-600 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-mono font-black uppercase tracking-widest py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)]"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>{isSignUp ? 'Register Account' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 text-zinc-500 font-mono text-[9px] uppercase tracking-widest font-bold">or connect with</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-200 text-xs font-mono font-bold uppercase tracking-widest py-3.5 rounded-xl transition-all flex items-center justify-center gap-3 cursor-pointer shadow-md"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </motion.form>
      </AnimatePresence>

      <div className="mt-6 pt-4 border-t border-slate-850 text-center flex flex-col sm:flex-row justify-center items-center gap-2 text-xs">
        <span className="text-zinc-500">
          {isSignUp ? 'Already have an athlete account?' : "Don't have an account yet?"}
        </span>
        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError('');
            setSuccessMsg('');
          }}
          className="text-amber-500 font-bold hover:text-amber-400 hover:underline cursor-pointer"
        >
          {isSignUp ? 'Sign In Here' : 'Create One Here'}
        </button>
      </div>

      {onCancel && (
        <div className="mt-4 text-center">
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white font-mono text-[10px] uppercase tracking-widest hover:underline cursor-pointer"
          >
            Cancel and Return
          </button>
        </div>
      )}
    </div>
  );
}
