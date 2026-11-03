import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle,
  LockKeyhole,
  CloudLightning
} from 'lucide-react';
import { 
  auth, 
  googleProvider, 
  isFirebaseEnabled, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  db,
  doc,
  setDoc
} from '../firebase.js';

export default function AuthPortal({ onLogin, isModal, isDarkMode = true }) {
  const logoSrc = isDarkMode ? '/logo_dark.png' : '/logo.png';
  const [activeView, setActiveView] = useState('login'); // 'login', 'signup', 'forgot'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const getFriendlyError = (err) => {
    if (!err) return "An error occurred.";
    if (err.code === 'auth/unauthorized-domain' || (err.message && err.message.includes('unauthorized-domain'))) {
      return "Security Block: Please add 'scholargat.com' and 'www.scholargat.com' to your Firebase Console under Authentication > Settings > Authorized Domains.";
    }
    return err.message || "An unexpected error occurred.";
  };

  // Handle standard registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (isFirebaseEnabled) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        const newUser = {
          name: name,
          email: user.email.toLowerCase(),
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
          uid: user.uid,
          isFirebase: true
        };

        if (db) {
          const userDocId = user.email.toLowerCase().replace(/[@.]/g, '_');
          setDoc(doc(db, "users", userDocId), {
            name: name,
            email: user.email.toLowerCase(),
            avatar: newUser.avatar,
            uid: user.uid,
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString()
          }, { merge: true }).catch(err => console.error("Error writing user doc:", err));
        }

        setSuccess('Account created successfully!');
        setTimeout(() => {
          onLogin(newUser);
        }, 800);
      } catch (err) {
        console.error("Firebase Sign Up Error:", err);
        setError(getFriendlyError(err));
      }
      return;
    }

    setError('Authentication service is currently unavailable. Please try again shortly.');
  };

  // Handle standard login (strictly via Firebase Auth — no client-side hardcoded credentials)
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    if (isFirebaseEnabled) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const loggedUser = {
          name: user.displayName || user.email.split('@')[0],
          email: user.email.toLowerCase(),
          avatar: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.email)}`,
          uid: user.uid,
          isFirebase: true
        };

        if (db) {
          const userDocId = user.email.toLowerCase().replace(/[@.]/g, '_');
          setDoc(doc(db, "users", userDocId), {
            name: loggedUser.name,
            email: user.email.toLowerCase(),
            avatar: loggedUser.avatar,
            uid: user.uid,
            lastActive: new Date().toISOString()
          }, { merge: true }).catch(err => console.error("Error writing user doc:", err));
        }

        setSuccess('Sign In Successful!');
        setTimeout(() => {
          onLogin(loggedUser);
        }, 600);
      } catch (err) {
        console.error("Firebase Login Error:", err);
        setError(getFriendlyError(err));
      }
      return;
    }

    setError('Authentication service is currently unavailable. Please try again shortly.');
  };

  // Handle Password Reset
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (isFirebaseEnabled) {
      try {
        await sendPasswordResetEmail(auth, email);
        setSuccess('Password reset link sent! Please check your inbox and your SPAM/junk folder.');
      } catch (err) {
        console.error("Firebase reset password error:", err);
        setError(getFriendlyError(err));
      }
      return;
    }

    setError('Password reset service is currently unavailable.');
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setError('');

    if (isFirebaseEnabled) {
      setGoogleLoading(true);
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        const googleUser = {
          name: user.displayName || "Student",
          email: user.email.toLowerCase(),
          avatar: user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.displayName || 'S')}`,
          uid: user.uid,
          isFirebase: true,
          isGoogle: true
        };

        if (db) {
          const userDocId = user.email.toLowerCase().replace(/[@.]/g, '_');
          setDoc(doc(db, "users", userDocId), {
            name: googleUser.name,
            email: user.email.toLowerCase(),
            avatar: googleUser.avatar,
            uid: user.uid,
            lastActive: new Date().toISOString()
          }, { merge: true }).catch(err => console.error("Error writing user doc:", err));
        }

        setSuccess('Signed in with Google!');
        setTimeout(() => {
          onLogin(googleUser);
        }, 600);
      } catch (err) {
        console.error("Firebase Google Sign-in Error:", err);
        setError(getFriendlyError(err));
      } finally {
        setGoogleLoading(false);
      }
      return;
    }

    setError('Google Sign-In requires an active connection.');
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isModal ? '0' : '24px',
      position: 'relative',
      width: '100%'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        maxWidth: '450px',
        width: '100%',
        padding: '36px 32px',
        zIndex: 2,
        position: 'relative',
        boxShadow: isModal ? '0 24px 64px rgba(0,0,0,0.5)' : undefined
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ 
            width: '100%', 
            height: '64px', 
            overflow: 'hidden', 
            margin: '0 auto 14px auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img src={logoSrc} alt="ScholarPrep Logo" width="64" height="64" style={{ height: '64px', width: 'auto', objectFit: 'contain' }} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontFamily: 'Outfit', color: 'var(--text-primary)', margin: 0 }}>ScholarPrep</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>
            {activeView === 'forgot' ? 'Reset password instructions' : 
             'Sign in to access study modules, quizzes, and mock tests'}
          </p>
        </div>

        {/* Error/Success alerts */}
        {error && (
          <div role="alert" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--danger)',
            fontSize: '0.85rem',
            marginBottom: '20px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span style={{ wordBreak: 'break-word' }}>{error}</span>
          </div>
        )}

        {success && (
          <div role="status" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--success)',
            fontSize: '0.85rem',
            marginBottom: '20px'
          }}>
            <CheckCircle size={16} style={{ flexShrink: 0 }} />
            <span style={{ wordBreak: 'break-word' }}>{success}</span>
          </div>
        )}

        {/* VIEW 1: SIGN IN VIEW */}
        {activeView === 'login' && (
          <>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label htmlFor="auth-login-email" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                  <input 
                    id="auth-login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)',
                      padding: '12px 12px 12px 42px',
                      borderRadius: 'var(--radius-sm)',
                      outline: 'none',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label htmlFor="auth-login-password" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Password</label>
                  <button 
                    type="button" 
                    onClick={() => { setActiveView('forgot'); setError(''); setSuccess(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                  <input 
                    id="auth-login-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)',
                      padding: '12px 12px 12px 42px',
                      borderRadius: 'var(--radius-sm)',
                      outline: 'none',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', marginTop: '8px' }}
              >
                Sign In <ArrowRight size={16} />
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: 12 }}>
              <div style={{ flexGrow: 1, height: '1px', background: 'var(--glass-border)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>OR</span>
              <div style={{ flexGrow: 1, height: '1px', background: 'var(--glass-border)' }} />
            </div>

            <button 
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '12px', display: 'flex', gap: 12, justifyContent: 'center', background: 'white', color: '#1f2937' }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }} aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.79 2.7l2.86 2.22c1.67-1.54 2.63-3.8 2.63-6.55z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.86-2.22c-.79.53-1.8.85-3.1.85-2.39 0-4.41-1.61-5.14-3.78H.95v2.3C2.43 15.89 5.5 18 9 18z"/>
                <path fill="#FBBC05" d="M3.86 10.67c-.18-.53-.29-1.1-.29-1.67s.11-1.14.29-1.67V5.03H.95A8.99 8.99 0 0 0 0 9c0 1.45.35 2.82.95 4.03l2.91-2.36z"/>
                <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.89 11.43 0 9 0 5.5 0 2.43 2.11.95 5.03L3.86 7.4c.73-2.17 2.75-3.78 5.14-3.78z"/>
              </svg>
              <span style={{ fontWeight: 600 }}>Sign in with Google</span>
            </button>

            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Don't have an account? </span>
              <button 
                type="button"
                onClick={() => { setActiveView('signup'); setError(''); setSuccess(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--accent-ai)', fontWeight: 600, padding: 0, textDecoration: 'underline', cursor: 'pointer' }}
              >
                Create Account
              </button>
            </div>
          </>
        )}

        {/* VIEW 2: SIGN UP VIEW */}
        {activeView === 'signup' && (
          <>
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label htmlFor="auth-signup-name" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                  <input 
                    id="auth-signup-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Ahmed Mohammed"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)',
                      padding: '12px 12px 12px 42px',
                      borderRadius: 'var(--radius-sm)',
                      outline: 'none',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="auth-signup-email" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                  <input 
                    id="auth-signup-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)',
                      padding: '12px 12px 12px 42px',
                      borderRadius: 'var(--radius-sm)',
                      outline: 'none',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="auth-signup-password" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                  <input 
                    id="auth-signup-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)',
                      padding: '12px 12px 12px 42px',
                      borderRadius: 'var(--radius-sm)',
                      outline: 'none',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="auth-signup-confirm" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <LockKeyhole size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                  <input 
                    id="auth-signup-confirm"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)',
                      padding: '12px 12px 12px 42px',
                      borderRadius: 'var(--radius-sm)',
                      outline: 'none',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', marginTop: '8px' }}
              >
                Create Account <ArrowRight size={16} />
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Already have an account? </span>
              <button 
                type="button"
                onClick={() => { setActiveView('login'); setError(''); setSuccess(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--accent-ai)', fontWeight: 600, padding: 0, textDecoration: 'underline', cursor: 'pointer' }}
              >
                Sign In
              </button>
            </div>
          </>
        )}

        {/* VIEW 3: FORGOT PASSWORD VIEW */}
        {activeView === 'forgot' && (
          <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 10px 0' }}>
              Enter your email address below and we will send you a password reset link.
            </p>

            <div>
              <label htmlFor="auth-forgot-email" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                <input 
                  id="auth-forgot-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)',
                    padding: '12px 12px 12px 42px',
                    borderRadius: 'var(--radius-sm)',
                    outline: 'none',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', marginTop: '8px' }}
            >
              Send Reset Link <ArrowRight size={16} />
            </button>

            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.85rem' }}>
              <button 
                type="button"
                onClick={() => { setActiveView('login'); setError(''); setSuccess(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 600, padding: 0, textDecoration: 'underline', cursor: 'pointer' }}
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* Database Status Banner */}
        <div style={{
          marginTop: '24px',
          padding: '8px 12px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--glass-border)',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)'
        }}>
          <CloudLightning size={14} style={{ color: 'var(--success)' }} />
          <span>Secured by <strong>Firebase Authentication</strong></span>
        </div>
      </div>
    </div>
  );
}
