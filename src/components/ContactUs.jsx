import React from 'react';
import { Mail, MessageSquare, ExternalLink, ArrowRight, HelpCircle, Briefcase, Linkedin } from 'lucide-react';

export default function ContactUs() {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: '900px', margin: '0 auto', width: '100%' }}>
      {/* Page Header */}
      <section>
        <h2 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'Outfit' }}>
          <Mail style={{ color: 'var(--primary)' }} /> Contact Us & Support
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>Have questions, feedback, or need support? Connect with us via our official email channels, communities, and study resources.</p>
      </section>

      {/* Grid of Contact Options */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
        
        {/* Student Support Desk Card */}
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '240px', borderLeft: '4px solid #3b82f6' }}>
          <div>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <HelpCircle size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', fontFamily: 'Outfit', color: 'var(--text-primary)' }}>Student Support Desk</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Experiencing technical bugs, account login issues, or have questions about a Math or Verbal explanation? Reach out to our 24/7 student support team.
            </p>
            <div style={{ marginTop: '12px', fontSize: '0.85rem', fontWeight: 600, color: '#60a5fa' }}>
              📧 support@scholargat.com
            </div>
          </div>
          <a 
            href="mailto:support@scholargat.com" 
            className="btn btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: '24px', borderColor: 'rgba(59, 130, 246, 0.3)' }}
          >
            Email Support <ArrowRight size={16} style={{ color: '#3b82f6' }} />
          </a>
        </div>

        {/* Partnerships & Collaborations Card */}
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '240px', borderLeft: '4px solid #f59e0b' }}>
          <div>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Briefcase size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', fontFamily: 'Outfit', color: 'var(--text-primary)' }}>Partnerships & Collaborations</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              For institutional school partnerships, tutoring center integrations, media inquiries, or corporate collaborations, contact our executive desk.
            </p>
            <div style={{ marginTop: '12px', fontSize: '0.85rem', fontWeight: 600, color: '#fbbf24' }}>
              🤝 partnerships@scholargat.com
            </div>
          </div>
          <a 
            href="mailto:partnerships@scholargat.com" 
            className="btn btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: '24px', borderColor: 'rgba(245, 158, 11, 0.3)' }}
          >
            Email Partnerships <ArrowRight size={16} style={{ color: '#f59e0b' }} />
          </a>
        </div>

        {/* WhatsApp Card */}
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '240px', borderLeft: '4px solid #25D366' }}>
          <div>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(37, 211, 102, 0.1)', color: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <MessageSquare size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', fontFamily: 'Outfit', color: 'var(--text-primary)' }}>WhatsApp Community</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Join our active WhatsApp student community. Ask prep questions, share resources, and discuss strategies with fellow students.
            </p>
          </div>
          <a 
            href="https://chat.whatsapp.com/KNSnP3uF6UkBYbho5Rqkg3" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: '24px', borderColor: 'rgba(37, 211, 102, 0.3)' }}
          >
            Join WhatsApp Group <ArrowRight size={16} style={{ color: '#25D366' }} />
          </a>
        </div>

        
        {/* LinkedIn Card */}
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '240px', borderLeft: '4px solid #0077b5' }}>
          <div>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(0, 119, 181, 0.1)', color: '#0077b5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Linkedin size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', fontFamily: 'Outfit', color: 'var(--text-primary)' }}>Official LinkedIn Page</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Follow our official LinkedIn page for major platform updates, business announcements, and professional networking.
            </p>
          </div>
          <a 
            href="https://www.linkedin.com/company/scholar-gat/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: '24px', borderColor: 'rgba(0, 119, 181, 0.3)' }}
          >
            Follow on LinkedIn <ArrowRight size={16} style={{ color: '#0077b5' }} />
          </a>
        </div>

        {/* Linktree Card */}

        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '240px', borderLeft: '4px solid #39e09b' }}>
          <div>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(57, 224, 155, 0.1)', color: '#39e09b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <ExternalLink size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', fontFamily: 'Outfit', color: 'var(--text-primary)' }}>Official Linktree</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Access all our official study resources, templates, custom diagnostic files, flashcards, and online calculators.
            </p>
          </div>
          <a 
            href="https://linktr.ee/scholarprep.hq" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: '24px', borderColor: 'rgba(57, 224, 155, 0.3)' }}
          >
            Open Linktree Resources <ArrowRight size={16} style={{ color: '#39e09b' }} />
          </a>
        </div>

      </div>

    </div>
  );
}
