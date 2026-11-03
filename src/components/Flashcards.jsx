import React, { useState } from 'react';
import { vocabList } from '../data/vocabList.js';
import { 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  Sparkles, 
  Shuffle, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function Flashcards({ onClose }) {
  const [deck, setDeck] = useState(vocabList);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState(new Set());

  const currentWord = deck[currentIdx];

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      if (currentIdx < deck.length - 1) {
        setCurrentIdx(prev => prev + 1);
      } else {
        setCurrentIdx(0); // Loop back
      }
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      if (currentIdx > 0) {
        setCurrentIdx(prev => prev - 1);
      } else {
        setCurrentIdx(deck.length - 1); // Loop to end
      }
    }, 150);
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    setTimeout(() => {
      const shuffled = [...deck].sort(() => Math.random() - 0.5);
      setDeck(shuffled);
      setCurrentIdx(0);
    }, 150);
  };

  const toggleMastered = () => {
    const newMastered = new Set(masteredIds);
    if (newMastered.has(currentWord.word)) {
      newMastered.delete(currentWord.word);
    } else {
      newMastered.add(currentWord.word);
    }
    setMasteredIds(newMastered);
  };

  const remainingCards = deck.filter(w => !masteredIds.has(w.word));

  const handleReset = () => {
    setMasteredIds(new Set());
    setCurrentIdx(0);
    setIsFlipped(false);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles style={{ color: 'var(--accent-verbal)' }} size={20} /> Vocabulary Trainer
          </h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Learn high-frequency words for GAT Verbal Section.
          </span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Back to Hub
        </button>
      </div>

      {remainingCards.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            color: 'var(--success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto'
          }}>
            <CheckCircle size={32} />
          </div>
          <h4 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Excellent Job!</h4>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            You have mastered all {deck.length} words in this vocabulary deck!
          </p>
          <button className="btn btn-verbal" onClick={handleReset}>
            Restart Vocabulary Deck
          </button>
        </div>
      ) : (
        <div>
          {/* Card Counter & Stats */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            <span>Card {currentIdx + 1} of {deck.length}</span>
            <span>Mastered: {masteredIds.size} / {deck.length}</span>
          </div>

          {/* 3D Flippable Card */}
          <div 
            className={`flashcard-wrapper ${isFlipped ? 'flipped' : ''}`}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div className="flashcard-inner">
              
              {/* Front Face */}
              <div className="flashcard-face flashcard-front">
                <span style={{
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--accent-verbal)',
                  fontWeight: 600,
                  marginBottom: '16px'
                }}>
                  {currentWord.partOfSpeech}
                </span>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '24px', fontFamily: 'Outfit', fontWeight: 700 }}>
                  {currentWord.word}
                </h2>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem'
                }}>
                  <RotateCw size={14} /> Click card to flip
                </div>

                {masteredIds.has(currentWord.word) && (
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    color: 'var(--success)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    <CheckCircle size={14} /> Mastered
                  </div>
                )}
              </div>

              {/* Back Face */}
              <div className="flashcard-face flashcard-back">
                <h3 style={{ fontSize: '1.25rem', color: 'var(--accent-verbal)', marginBottom: '12px', fontFamily: 'Outfit' }}>
                  Definition
                </h3>
                <p style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '16px', lineHeight: 1.5 }}>
                  {currentWord.definition}
                </p>
                
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', width: '100%', paddingTop: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Synonyms:</span>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginTop: 4 }}>
                    {currentWord.synonyms.map(syn => (
                      <span key={syn} style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                        {syn}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', width: '100%', paddingTop: '12px' }}>
                  <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                    &ldquo;{currentWord.example}&rdquo;
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Card Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={handleShuffle} title="Shuffle Deck">
                <Shuffle size={16} /> Shuffle
              </button>
              <button 
                onClick={toggleMastered}
                style={{
                  padding: '10px 16px',
                  background: masteredIds.has(currentWord.word) ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.02)',
                  color: masteredIds.has(currentWord.word) ? 'var(--success)' : 'var(--text-secondary)',
                  border: masteredIds.has(currentWord.word) ? '1px solid var(--success)' : '1px solid var(--glass-border)'
                }}
              >
                <CheckCircle size={16} style={{ color: masteredIds.has(currentWord.word) ? 'var(--success)' : 'inherit' }} /> 
                {masteredIds.has(currentWord.word) ? "Mastered" : "Mark Mastered"}
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" onClick={handlePrev} style={{ padding: '10px' }}>
                <ArrowLeft size={16} />
              </button>
              <button className="btn btn-secondary" onClick={handleNext} style={{ padding: '10px' }}>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
