import React, { useState, useEffect, Suspense, lazy } from 'react';
import { 
  LayoutDashboard, 
  Calculator, 
  BookOpen, 
  Bot, 
  Award, 
  Menu, 
  X, 
  Sparkles,
  LogOut,
  LogIn,
  Sun,
  Moon,
  MessageSquare,
  Mail,
  ArrowRight,
  ShieldCheck,
  Flame
} from 'lucide-react';

import Dashboard from './components/Dashboard.jsx';
import SecurityMonitor from './components/SecurityMonitor.jsx';
import { isFirebaseEnabled, db, doc, setDoc, getDoc, onSnapshot } from './firebase.js';

// Lazy-load secondary routes and heavy libraries (PDF.js, 1,585-question banks)
const AuthPortal = lazy(() => import('./components/AuthPortal.jsx'));
const QuantitativeHub = lazy(() => import('./components/QuantitativeHub.jsx'));
const VerbalHub = lazy(() => import('./components/VerbalHub.jsx'));
const LeaksHub = lazy(() => import('./components/LeaksHub.jsx'));
const AISpanner = lazy(() => import('./components/AISpanner.jsx'));
const MockTest = lazy(() => import('./components/MockTest.jsx'));
const ContactUs = lazy(() => import('./components/ContactUs.jsx'));
const PDFViewer = lazy(() => import('./components/PDFViewer.jsx'));

export default function App() {
  const [activeUser, setActiveUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activePdf, setActivePdf] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(true);
  const [cookieConsent, setCookieConsent] = useState(() => {
    try {
      return localStorage.getItem('scholar_cookie_consent') || null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    if (isFirebaseEnabled) {
      const unsub = onSnapshot(doc(db, "settings", "system"), (docSnap) => {
        if (docSnap.exists() && docSnap.data().maintenance === true) {
          setIsMaintenanceMode(true);
          setMaintenanceMessage(docSnap.data().maintenanceMessage || 'ScholarPrep is currently undergoing scheduled system updates. We will be back online shortly!');
        } else {
          setIsMaintenanceMode(false);
        }
        setIsSettingsLoaded(true);
      }, () => {
        setIsSettingsLoaded(true);
      });
      return () => unsub();
    } else {
      setIsSettingsLoaded(true);
    }
  }, []);

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  // Monitor theme settings changes
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
    }
  }, [isDarkMode]);
  
  const [stats, setStats] = useState({
    quantCompleted: 0,
    quantAccuracy: 0,
    verbalCompleted: 0,
    verbalAccuracy: 0,
    testsTaken: 0,
    averageTestScore: 0,
    streak: 0,
    studyPlanCreated: false
  });

  // Check active session & routing on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('scholar_gat_active_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setActiveUser(user);
        loadUserStats(user.email);
      } catch (e) {
        console.error("Error parsing active user", e);
      }
    }

    const validTabs = ['dashboard', 'quantitative', 'verbal', 'leaks', 'ai-planner', 'mock-test', 'contact', 'terms', 'privacy'];

    const syncRoute = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      const pathSeg = window.location.pathname.replace(/^\/+/, '').split('/')[0].split('?')[0];
      const mainTab = (hash.split('/')[0].split('?')[0] || pathSeg || 'dashboard').toLowerCase();
      if (validTabs.includes(mainTab)) {
        setActiveTab(mainTab);
      }
    };

    window.addEventListener('hashchange', syncRoute);
    window.addEventListener('popstate', syncRoute);

    if (window.location.hash || window.location.pathname !== '/') {
      syncRoute();
    } else {
      window.location.replace('#/dashboard');
    }

    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'G-GH3FZ9H76F', {
        page_path: window.location.hash || '/dashboard',
        page_title: 'ScholarPrep'
      });
    }

    return () => {
      window.removeEventListener('hashchange', syncRoute);
      window.removeEventListener('popstate', syncRoute);
    };
  }, []);

  const handleConsentChoice = (choice) => {
    try {
      localStorage.setItem('scholar_cookie_consent', choice);
    } catch (e) {}
    setCookieConsent(choice);
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: choice === 'accepted' ? 'granted' : 'denied'
      });
    }
  };

  // Helper to load user-specific stats
  const loadUserStats = async (email) => {
    const localKey = `scholar_gat_stats_${email.replace(/[@.]/g, '_')}`;
    let userStats = null;

    if (isFirebaseEnabled && db) {
      try {
        const docRef = doc(db, "user_stats", email.replace(/[@.]/g, '_'));
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          userStats = docSnap.data();
        }
      } catch (e) {
        console.error("Error loading stats from Firestore", e);
      }
    }

    if (!userStats) {
      const savedStats = localStorage.getItem(localKey);
      if (savedStats) {
        try {
          userStats = JSON.parse(savedStats);
        } catch (e) {
          console.error("Error loading local user stats", e);
        }
      }
    }

    if (userStats) {
      setStats(userStats);
      localStorage.setItem(localKey, JSON.stringify(userStats));
    } else {
      const initial = {
        quantCompleted: 0,
        quantAccuracy: 0,
        verbalCompleted: 0,
        verbalAccuracy: 0,
        testsTaken: 0,
        averageTestScore: 0,
        streak: 1,
        studyPlanCreated: false
      };
      setStats(initial);
      localStorage.setItem(localKey, JSON.stringify(initial));
      
      if (isFirebaseEnabled && db) {
        try {
          await setDoc(doc(db, "user_stats", email.replace(/[@.]/g, '_')), initial);
        } catch (e) {
          console.error("Error saving initial stats to Firestore", e);
        }
      }
    }
  };

  // Login handler
  const handleLogin = (user) => {
    setActiveUser(user);
    localStorage.setItem('scholar_gat_active_user', JSON.stringify(user));
    loadUserStats(user.email);
    setShowAuthModal(false);
    setActiveTab('dashboard');
  };

  // Sign out handler
  const handleSignOut = () => {
    setActiveUser(null);
    localStorage.removeItem('scholar_gat_active_user');
    setStats({
      quantCompleted: 0,
      quantAccuracy: 0,
      verbalCompleted: 0,
      verbalAccuracy: 0,
      testsTaken: 0,
      averageTestScore: 0,
      streak: 0,
      studyPlanCreated: false
    });
    setActiveTab('dashboard');
  };

  // Update stats helper
  const updateStats = async (newStats) => {
    if (!activeUser) return;
    const localKey = `scholar_gat_stats_${activeUser.email.replace(/[@.]/g, '_')}`;
    setStats(prev => {
      const updated = { ...prev, ...newStats };
      localStorage.setItem(localKey, JSON.stringify(updated));
      
      if (isFirebaseEnabled && db) {
        setDoc(doc(db, "user_stats", activeUser.email.replace(/[@.]/g, '_')), updated)
          .catch(e => console.error("Error saving stats to Firestore", e));
      }
      return updated;
    });
  };

  const recordQuizResults = (qStats) => {
    if (!activeUser || !qStats || qStats.length === 0) return;
    setStats(prev => {
      const totalTime = (prev.totalAnsweringTime || 0) + qStats.reduce((sum, item) => sum + item.timeSpent, 0);
      const totalCount = (prev.totalAnswersCount || 0) + qStats.length;
      
      const newCategoryStats = { ...(prev.categoryStats || {}) };
      qStats.forEach(item => {
        const cat = item.category || "General";
        if (!newCategoryStats[cat]) {
          newCategoryStats[cat] = { answered: 0, correct: 0 };
        }
        newCategoryStats[cat].answered += 1;
        if (item.isCorrect) {
          newCategoryStats[cat].correct += 1;
        }
      });

      const updated = {
        ...prev,
        totalAnsweringTime: totalTime,
        totalAnswersCount: totalCount,
        categoryStats: newCategoryStats
      };

      const localKey = `scholar_gat_stats_${activeUser.email.replace(/[@.]/g, '_')}`;
      localStorage.setItem(localKey, JSON.stringify(updated));

      if (isFirebaseEnabled && db) {
        setDoc(doc(db, "user_stats", activeUser.email.replace(/[@.]/g, '_')), updated)
          .catch(e => console.error("Error saving stats to Firestore", e));
      }
      return updated;
    });
  };

  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, class: '' },
    { id: 'quantitative', name: 'Quantitative', icon: Calculator, class: 'quant' },
    { id: 'verbal', name: 'Verbal Section', icon: BookOpen, class: 'verbal' },
    { id: 'leaks', name: 'Leaks', icon: Flame, class: 'quant' },
    { id: 'ai-planner', name: 'Preppy', icon: Bot, class: 'ai' },
    { id: 'mock-test', name: 'Mock Test', icon: Award, class: '' },
    { id: 'contact', name: 'Contact Us', icon: Mail, class: '' }
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    window.location.hash = `/${tabId}`;
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'G-GH3FZ9H76F', {
        page_path: `/${tabId}`,
        page_title: `ScholarPrep | ${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`
      });
    }
  };

  const renderLegalPage = (type) => (
    <article className="glass-panel animate-fade-in" style={{ maxWidth: '820px', margin: '0 auto', padding: '36px 28px' }}>
      <h2 style={{ fontSize: '1.9rem', fontFamily: 'Outfit', marginBottom: '16px', color: 'var(--text-primary)' }}>
        {type === 'terms' ? 'Terms and Conditions' : 'Privacy Policy'}
      </h2>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
        Last Updated: October 2026 • Effective for scholargat.com
      </p>
      {type === 'terms' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <p>Welcome to <strong>ScholarPrep</strong> (<code>scholargat.com</code>). By accessing or using our website, practice question banks, mock exams, or Preppy AI study tools, you agree to be bound by these Terms and Conditions.</p>
          <p><strong>1. Educational Use License:</strong> All 1,635+ Quantitative and Verbal practice questions, diagrams, passages, explanations, and mock exam interfaces are provided strictly for personal, non-commercial student exam preparation. Redistribution or commercial resale is prohibited.</p>
          <p><strong>2. Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials and for all activity conducted under your account.</p>
          <p><strong>3. Independent Disclaimer:</strong> ScholarPrep is an independent educational preparation platform and is not affiliated with or endorsed by ETEC or Qiyas. Practice scores are estimates and do not guarantee specific official exam scores.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <p>Your privacy is protected by <strong>ScholarPrep</strong> in compliance with the Saudi Personal Data Protection Law (PDPL) and international data protection standards (GDPR/UK GDPR).</p>
          <p><strong>1. Authentication & Cloud Storage (Google Firebase):</strong> When you create an account or sign in, we use Google Firebase Authentication and Cloud Firestore (project <code>scholar-gat</code>) to securely store your email address, display name, quiz statistics, saved scratchpad sketches, and mistake notebooks. Strict server-side Firestore security rules ensure only you can access your personal study records.</p>
          <p><strong>2. Analytics & Cookie Consent (Google Analytics 4):</strong> We use Google Analytics 4 (GA4) with Google Consent Mode v2 and IP anonymization to understand aggregate site traffic and improve page speed. Analytics storage remains disabled by default until you opt in via the consent banner.</p>
          <p><strong>3. Third-Party Assets (DiceBear & Google Fonts):</strong> Default profile avatars are generated deterministically via the DiceBear Avatar API (<code>api.dicebear.com</code>) using your display seed, and typography is served via Google Fonts. We never sell or rent your personal information to third parties.</p>
          <p><strong>4. Your Data Rights:</strong> You may request access to, correction of, or deletion of your account data at any time by contacting <a href="mailto:support@scholargat.com" style={{ color: 'var(--accent-ai)' }}>support@scholargat.com</a>.</p>
        </div>
      )}
      <div style={{ marginTop: '28px' }}>
        <a href="#/dashboard" className="btn btn-primary" style={{ textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); handleTabChange('dashboard'); }}>
          Back to Dashboard
        </a>
      </div>
    </article>
  );

  const renderActiveView = () => {
    const onAuthRequired = () => setShowAuthModal(true);
    
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard stats={stats} onNavigate={handleTabChange} activeUser={activeUser} isDarkMode={isDarkMode} />;
      case 'quantitative':
        return <QuantitativeHub stats={stats} updateStats={updateStats} recordQuizResults={recordQuizResults} activeUser={activeUser} onAuthRequired={onAuthRequired} onReadPdf={setActivePdf} />;
      case 'verbal':
        return <VerbalHub stats={stats} updateStats={updateStats} recordQuizResults={recordQuizResults} activeUser={activeUser} onAuthRequired={onAuthRequired} onReadPdf={setActivePdf} />;
      case 'leaks':
        return <LeaksHub activeUser={activeUser} />;
      case 'ai-planner':
        return <AISpanner stats={stats} updateStats={updateStats} activeUser={activeUser} onAuthRequired={onAuthRequired} />;
      case 'mock-test':
        return <MockTest stats={stats} updateStats={updateStats} recordQuizResults={recordQuizResults} activeUser={activeUser} onAuthRequired={onAuthRequired} />;
      case 'contact':
        return <ContactUs />;
      case 'terms':
        return renderLegalPage('terms');
      case 'privacy':
        return renderLegalPage('privacy');
      default:
        return <Dashboard stats={stats} onNavigate={handleTabChange} activeUser={activeUser} isDarkMode={isDarkMode} />;
    }
  };

  const iconSrc = isDarkMode ? '/logo_icon_dark.png' : '/logo_icon.png';

  if (activePdf) {
    return (
      <Suspense fallback={<div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)'}}><div className="spinner"></div></div>}>
        <PDFViewer 
           fileUrl={activePdf.url} 
           filename={activePdf.filename} 
           onClose={() => setActivePdf(null)} 
           isFirebaseEnabled={isFirebaseEnabled}
           activeUser={activeUser}
        />
      </Suspense>
    );
  }

  if (!isSettingsLoaded) {
    return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)'}}><div className="spinner"></div></div>;
  }

  if (isMaintenanceMode) {
    return (
      <div style={{ minHeight: '100vh', padding: '40px 20px', textAlign: 'center', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <img src="/logo_icon.png" alt="ScholarPrep Logo" width="120" height="120" style={{ width: '120px', height: '120px', marginBottom: '24px', borderRadius: '50%' }} />
        <h1 style={{ fontSize: '2.8rem', marginBottom: '16px', fontFamily: 'Outfit', color: 'var(--text-primary)' }}>Site Under Maintenance</h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 40px auto', lineHeight: '1.6' }}>
          {maintenanceMessage}
        </p>
        
        <div className="glass-panel" style={{ padding: '32px', maxWidth: '500px', width: '100%', borderTop: '4px solid #25D366' }}>
          <MessageSquare size={48} style={{ color: '#25D366', margin: '0 auto 16px auto' }} />
          <h2 style={{ fontSize: '1.6rem', marginBottom: '12px', fontFamily: 'Outfit', color: 'var(--text-primary)' }}>
            Join the Community
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            While we upgrade the platform, stay connected! Join our active WhatsApp student community to ask prep questions, share resources, and discuss strategies with fellow students.
          </p>
          <a 
            href="https://chat.whatsapp.com/KNSnP3uF6UkBYbho5Rqkg3" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '10px', 
              width: '100%', 
              padding: '16px', 
              fontSize: '1.1rem',
              background: '#25D366',
              color: '#fff',
              fontWeight: '600',
              border: 'none',
              textDecoration: 'none'
            }}
          >
            Join WhatsApp Group <ArrowRight size={20} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <SecurityMonitor>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <div className={`app-container ${!desktopSidebarOpen ? 'sidebar-collapsed' : ''}`}>
        
        {/* Sidebar - Desktop */}
        <aside className={`sidebar ${!desktopSidebarOpen ? 'collapsed' : ''}`} aria-label="Sidebar Navigation">
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginBottom: -16 }}>
            <button 
              onClick={() => setDesktopSidebarOpen(false)}
              title="Collapse Sidebar"
              aria-label="Collapse Sidebar"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px'
              }}
            >
              <Menu size={18} />
            </button>
          </div>

          <div className="brand-section" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}>
            <div className="logo-container" style={{ width: '48px', height: '48px', background: 'transparent', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <img src={iconSrc} alt="ScholarPrep Logo" width="48" height="48" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <h1 className="brand-name" style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>ScholarPrep</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-quant)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                  <Sparkles size={10} /> GAT Track
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>•</span>
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                >
                  {isDarkMode ? <Sun size={13} /> : <Moon size={13} />}
                </button>
              </div>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="glass-panel" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', overflow: 'hidden', background: 'white', flexShrink: 0 }}>
              <img 
                src={activeUser ? activeUser.avatar : 'https://api.dicebear.com/7.x/bottts/svg?seed=guest'} 
                alt="User Profile Avatar" 
                width="38"
                height="38"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
            <div style={{ overflow: 'hidden', flexGrow: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {activeUser ? activeUser.name : 'Guest Student'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {activeUser ? activeUser.email : 'guest@scholargat.com'}
              </div>
            </div>
          </div>

          <nav className="nav-links" aria-label="Main Navigation" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.id}
                  href={`#/${item.id}`}
                  onClick={(e) => { e.preventDefault(); handleTabChange(item.id); }}
                  className={`nav-item ${activeTab === item.id ? `active ${item.class}` : ''}`}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </a>
              );
            })}
          </nav>

          {/* Auth Actions Bottom */}
          {activeUser ? (
            <button 
              onClick={handleSignOut}
              className="nav-item"
              style={{ border: 'none', background: 'none', color: 'var(--danger)', marginTop: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="nav-item active quant"
              style={{ border: 'none', marginTop: 'auto', display: 'flex', gap: 12, alignItems: 'center', background: 'linear-gradient(135deg, var(--accent-quant), var(--primary))', color: '#faf7f2', fontWeight: 'bold' }}
            >
              <LogIn size={18} />
              <span>Sign In / Sign Up</span>
            </button>
          )}
        </aside>

        {/* Header - Mobile */}
        <header className="glass-panel mobile-only-header" style={{
          display: mobileMenuOpen ? 'none' : 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 20px',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          borderRadius: 0,
          borderLeft: 'none',
          borderRight: 'none',
          borderTop: 'none',
          margin: 0,
          width: '100%'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ height: '36px', width: '36px', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
              <img src={iconSrc} alt="ScholarPrep Logo" width="36" height="36" style={{ height: "100%", width: "100%", objectFit: "contain" }} />
            </div>
            <span style={{ fontSize: "1.2rem", fontFamily: "Outfit", fontWeight: 800 }}>ScholarPrep</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', overflow: 'hidden', background: 'white' }}>
              <img 
                src={activeUser ? activeUser.avatar : 'https://api.dicebear.com/7.x/bottts/svg?seed=guest'} 
                alt="User Profile Avatar" 
                width="30"
                height="30"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                padding: 4
              }}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open Navigation Menu"
              style={{ background: 'none', border: 'none', color: 'var(--text-primary)', padding: 4 }}
            >
              <Menu size={24} />
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'var(--bg-primary)',
            zIndex: 100,
            padding: '28px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 28,
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ height: '40px', width: '40px', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                  <img src={iconSrc} alt="ScholarPrep Logo" width="40" height="40" style={{ height: "100%", width: "100%", objectFit: "contain", borderRadius: "6px" }} />
                </div>
                <span style={{ fontSize: '1.4rem', fontFamily: 'Outfit', fontWeight: 800 }}>ScholarPrep</span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close Navigation Menu"
                style={{ background: 'none', border: 'none', color: 'var(--text-primary)', padding: 4 }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', background: 'white' }}>
                <img 
                  src={activeUser ? activeUser.avatar : 'https://api.dicebear.com/7.x/bottts/svg?seed=guest'} 
                  alt="User Profile Avatar" 
                  width="36"
                  height="36"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{activeUser ? activeUser.name : 'Guest Student'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activeUser ? activeUser.email : 'guest@scholargat.com'}</div>
              </div>
            </div>

            <nav aria-label="Mobile Navigation" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.id}
                    href={`#/${item.id}`}
                    onClick={(e) => { e.preventDefault(); handleTabChange(item.id); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '14px 16px',
                      fontSize: '1.05rem',
                      background: activeTab === item.id ? 'rgba(255,255,255,0.05)' : 'none',
                      color: activeTab === item.id ? 'var(--accent-ai)' : 'var(--text-primary)',
                      borderRadius: 'var(--radius-sm)',
                      width: '100%',
                      textDecoration: 'none',
                      fontWeight: activeTab === item.id ? 700 : 500
                    }}
                  >
                    <Icon size={22} />
                    <span>{item.name}</span>
                  </a>
                );
              })}
            </nav>

            {activeUser ? (
              <button 
                onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px',
                  fontSize: '1.1rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--danger)',
                  width: '100%',
                  textAlign: 'left',
                  marginTop: 'auto'
                }}
              >
                <LogOut size={22} />
                <span>Sign Out</span>
              </button>
            ) : (
              <button 
                onClick={() => { setShowAuthModal(true); setMobileMenuOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px',
                  fontSize: '1.1rem',
                  background: 'linear-gradient(135deg, var(--accent-quant), var(--primary))',
                  border: 'none',
                  color: '#faf7f2',
                  fontWeight: 'bold',
                  borderRadius: 'var(--radius-sm)',
                  width: '100%',
                  textAlign: 'left',
                  marginTop: 'auto'
                }}
              >
                <LogIn size={22} />
                <span>Sign In / Sign Up</span>
              </button>
            )}
          </div>
        )}

        {/* Floating Sidebar Trigger (Desktop) */}
        {!desktopSidebarOpen && (
          <button 
            onClick={() => setDesktopSidebarOpen(true)}
            className="btn btn-secondary animate-fade-in desktop-only-trigger"
            title="Expand Sidebar"
            aria-label="Expand Sidebar"
            style={{
              position: 'fixed',
              top: '20px',
              left: '20px',
              zIndex: 90,
              padding: '10px',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              background: 'var(--bg-secondary)',
              borderColor: 'var(--glass-border)'
            }}
          >
            <Menu size={20} />
          </button>
        )}

        {/* Main View Container */}
        <main id="main-content" className={`main-content ${!desktopSidebarOpen ? 'desktop-collapsed-padding' : ''}`} style={{
          transition: 'padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <Suspense fallback={<div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner"></div></div>}>
            {renderActiveView()}
          </Suspense>
        </main>

        {/* Auth Portal Modal overlay */}
        {showAuthModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '450px' }}>
              <button 
                onClick={() => setShowAuthModal(false)}
                aria-label="Close Sign In Modal"
                className="btn btn-secondary"
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  padding: '6px',
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
              <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>}>
                <AuthPortal onLogin={handleLogin} isModal={true} isDarkMode={isDarkMode} onClose={() => setShowAuthModal(false)} />
              </Suspense>
            </div>
          </div>
        )}

        {/* Cookie & Analytics Consent Banner (Consent Mode v2 - M4) */}
        {!cookieConsent && (
          <aside
            aria-label="Privacy and Analytics Consent"
            style={{
              position: 'fixed',
              bottom: '16px',
              left: '16px',
              right: '16px',
              maxWidth: '680px',
              margin: '0 auto',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--glass-border)',
              borderLeft: '4px solid var(--accent-ai)',
              borderRadius: '12px',
              padding: '16px 20px',
              zIndex: 950,
              boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ flex: '1 1 320px', fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                <ShieldCheck size={16} style={{ color: 'var(--accent-ai)' }} /> Privacy & Analytics Notice
              </div>
              We use essential storage (Firebase) to save your study progress and optional Google Analytics (GA4) to improve ScholarPrep. See our{' '}
              <a href="#/privacy" onClick={(e) => { e.preventDefault(); handleTabChange('privacy'); }} style={{ color: 'var(--accent-ai)', textDecoration: 'underline' }}>
                Privacy Policy
              </a>.
            </div>
            <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => handleConsentChoice('declined')}
                className="btn btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.8rem' }}
              >
                Essential Only
              </button>
              <button
                type="button"
                onClick={() => handleConsentChoice('accepted')}
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.8rem' }}
              >
                Accept Analytics
              </button>
            </div>
          </aside>
        )}

        <style dangerouslySetInnerHTML={{__html: `
          .mobile-only-header {
            display: none !important;
          }
          @media (max-width: 1024px) {
            .mobile-only-header {
              display: flex !important;
            }
            .sidebar {
              display: none !important;
            }
          }
        `}} />
      </div>
    </SecurityMonitor>
  );
}
