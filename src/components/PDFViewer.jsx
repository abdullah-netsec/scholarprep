import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { 
  X, ShieldAlert, Edit2, Highlighter, Eraser, 
  Undo2, Redo2, ZoomIn, ZoomOut, MousePointer,
  Maximize, Minimize, BookOpen
} from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { isFirebaseEnabled, db, doc, setDoc, getDoc } from '../firebase.js';

// Configure PDF.js worker using unpkg CDN
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PDFViewer({ fileUrl, filename, onClose, activeUser }) {
  const userEmail = activeUser ? activeUser.email : 'guest';

  // UI States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSketching, setIsSketching] = useState(false);
  const [brushType, setBrushType] = useState('pencil');
  const [brushColor, setBrushColor] = useState('#3b82f6');
  const [highlighterColor, setHighlighterColor] = useState('rgba(253, 224, 71, 0.55)');
  const [zoom, setZoom] = useState(1.0);
  const [numPages, setNumPages] = useState(null);
  const [intrinsicWidth, setIntrinsicWidth] = useState(800);
  const [intrinsicHeight, setIntrinsicHeight] = useState(1056);

  const fitToWidth = () => {
    // Calculate new zoom based on window width minus UI padding (sidebar + scrollbar/margins)
    const availableWidth = window.innerWidth - (isSketching ? 56 : 0) - 80;
    const newZoom = availableWidth / intrinsicWidth;
    setZoom(Math.max(0.4, Math.min(3.0, parseFloat(newZoom.toFixed(2)))));
  };

  const fitToPage = () => {
    // Calculate zoom to fit entire page height (minus header and padding)
    const availableHeight = window.innerHeight - 55 - 80;
    const newZoom = availableHeight / intrinsicHeight;
    setZoom(Math.max(0.4, Math.min(3.0, parseFloat(newZoom.toFixed(2)))));
  };

  // Vector stroke history
  const [strokes, setStrokes] = useState([]);
  const [redoStrokes, setRedoStrokes] = useState([]);
  const strokesRef = useRef([]);
  useEffect(() => { strokesRef.current = strokes; }, [strokes]);

  // Current stroke being drawn
  const currentStrokeRef = useRef(null);
  const isDrawingRef = useRef(false);
  const activePathRef = useRef(null);

  // References
  const wrapperRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // --- Load Saved Annotations ---
  useEffect(() => {
    const load = async () => {
      const key = `pdfv2_${userEmail}_${filename}`.replace(/[@./]/g, '_');
      try {
        const s = localStorage.getItem(`${key}_strokes`);
        if (s) setStrokes(JSON.parse(s));
      } catch(e) {}

      if (isFirebaseEnabled && db) {
        try {
          const snap = await getDoc(doc(db, 'pdf_annotations_v2', key));
          if (snap.exists()) {
            const d = snap.data();
            if (d.strokesData) {
              try { setStrokes(JSON.parse(d.strokesData)); } catch(e) {}
            }
          }
        } catch(e) {}
      }
    };
    load();
  }, [filename, userEmail]);

  // --- Save Annotations ---
  const saveAnnotations = (currentStrokes) => {
    const key = `pdfv2_${userEmail}_${filename}`.replace(/[@./]/g, '_');
    const str = JSON.stringify(currentStrokes);
    localStorage.setItem(`${key}_strokes`, str);
    if (isFirebaseEnabled && db) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        setDoc(doc(db, 'pdf_annotations_v2', key), {
          userEmail, filename, strokesData: str,
          savedAt: new Date().toISOString()
        }, { merge: true }).catch(console.error);
      }, 2000);
    }
  };

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const onCtx = (e) => e.preventDefault();
    const onCopy = (e) => { e.preventDefault(); };
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && ['p','P','s','S'].includes(e.key)) e.preventDefault();
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); triggerUndo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); triggerRedo(); }
    };
    document.addEventListener('contextmenu', onCtx);
    document.addEventListener('copy', onCopy);
    document.addEventListener('cut', onCopy);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('contextmenu', onCtx);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('cut', onCopy);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const triggerUndo = () => {
    setStrokes(prev => {
      if (!prev.length) return prev;
      const next = prev.slice(0, -1);
      setRedoStrokes(r => [...r, prev[prev.length - 1]]);
      strokesRef.current = next;
      saveAnnotations(next);
      return next;
    });
  };

  const triggerRedo = () => {
    setRedoStrokes(prev => {
      if (!prev.length) return prev;
      const stroke = prev[prev.length - 1];
      const next = prev.slice(0, -1);
      setStrokes(s => {
        const ns = [...s, stroke];
        strokesRef.current = ns;
        saveAnnotations(ns);
        return ns;
      });
      return next;
    });
  };

  // --- SVG Stroke Eraser ---
  const eraseStrokes = (pos) => {
    let changed = false;
    const newStrokes = strokesRef.current.filter(stroke => {
      // Check if eraser point is close to any point in the stroke
      const hit = stroke.points.some(p => {
        const dx = p.x - pos.x;
        const dy = p.y - pos.y;
        return Math.sqrt(dx * dx + dy * dy) < 20; // 20 units unzoomed radius
      });
      if (hit) changed = true;
      return !hit;
    });
    if (changed) {
      strokesRef.current = newStrokes;
      setStrokes(newStrokes);
      saveAnnotations(newStrokes);
    }
  };

  // --- Pointer Event Handlers ---
  const getDocCoords = (e) => {
    if (!wrapperRef.current) return { x: 0, y: 0 };
    // Get document wrapper bounds. 
    // This perfectly accounts for all scrolling and zooming because the wrapper scales with the document natively!
    const rect = wrapperRef.current.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    return {
      x: (clientX - rect.left) / zoom,
      y: (clientY - rect.top) / zoom
    };
  };

  const onPointerDown = (e) => {
    if (!isSketching) return;
    // For mobile/tablet/pen, prevent default scrolling behavior and capture the pointer
    if (e.cancelable) e.preventDefault();
    try {
      if (e.target && e.pointerId) {
        e.target.setPointerCapture(e.pointerId);
      }
    } catch (err) {}
    
    isDrawingRef.current = true;
    const pos = getDocCoords(e);

    if (brushType === 'eraser') {
      eraseStrokes(pos);
    } else {
      currentStrokeRef.current = {
        id: Date.now(),
        type: brushType,
        color: brushType === 'highlighter' ? highlighterColor : brushColor,
        lineWidth: brushType === 'highlighter' ? 18 : 3,
        startY: pos.y,
        points: [pos]
      };
      setRedoStrokes([]);
      if (activePathRef.current) {
        activePathRef.current.setAttribute('d', `M ${pos.x},${pos.y}`);
      }
    }
  };

  const onPointerMove = (e) => {
    if (!isDrawingRef.current) return;
    if (e.cancelable) e.preventDefault();
    const pos = getDocCoords(e);

    if (brushType === 'eraser') {
      eraseStrokes(pos);
    } else if (currentStrokeRef.current) {
      if (brushType === 'highlighter') {
        pos.y = currentStrokeRef.current.startY; // lock Y for straight highlight
      }
      currentStrokeRef.current.points.push(pos);
      
      // Update DOM directly for ultra-smooth rendering
      if (activePathRef.current) {
        const d = `M ${currentStrokeRef.current.points.map(p => `${p.x},${p.y}`).join(' L ')}`;
        activePathRef.current.setAttribute('d', d);
      }
    }
  };

  const onPointerUp = (e) => {
    if (!isDrawingRef.current) return;
    try {
      if (e.target && e.pointerId) {
        e.target.releasePointerCapture(e.pointerId);
      }
    } catch (err) {}
    
    isDrawingRef.current = false;
    
    if (currentStrokeRef.current && currentStrokeRef.current.points.length > 1) {
      const newStrokes = [...strokesRef.current, currentStrokeRef.current];
      strokesRef.current = newStrokes;
      setStrokes(newStrokes);
      saveAnnotations(newStrokes);
    }
    currentStrokeRef.current = null;
    if (activePathRef.current) activePathRef.current.setAttribute('d', '');
  };

  // --- Fullscreen ---
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const getCursor = () => {
    if (!isSketching) return 'default';
    if (brushType === 'highlighter') return 'text';
    if (brushType === 'eraser') return 'cell';
    return 'crosshair';
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: '#0f1117', zIndex: 9999,
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* ========== HEADER ========== */}
      <div style={{
        background: '#1a1d2e', borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '10px 20px', display: 'flex', alignItems: 'center',
        gap: 12, flexShrink: 0, flexWrap: 'wrap'
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
          color: '#ef4444', borderRadius: 8, padding: '6px 10px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem'
        }}>
          <X size={16} /> Back
        </button>

        <div style={{ display:'flex', alignItems:'center', gap:6, color:'#94a3b8', fontSize:'0.82rem', flexGrow:1 }}>
          <ShieldAlert size={14} color="#ef4444"/>
          <span style={{ color:'var(--text-primary,#e2e8f0)' }}>{filename}</span>
        </div>

        {/* Zoom */}
        <div style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(255,255,255,0.05)', borderRadius:8, padding:'4px 8px', border:'1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={() => setZoom(z => Math.max(0.4, parseFloat((z - 0.1).toFixed(1))))} style={{ background:'none', border:'none', color:'#e2e8f0', cursor:'pointer', padding:2 }}><ZoomOut size={16}/></button>
          <span style={{ fontSize:'0.82rem', color:'#e2e8f0', minWidth:38, textAlign:'center' }}>{Math.round(zoom*100)}%</span>
          <button onClick={() => setZoom(z => Math.min(3.0, parseFloat((z + 0.1).toFixed(1))))} style={{ background:'none', border:'none', color:'#e2e8f0', cursor:'pointer', padding:2 }}><ZoomIn size={16}/></button>
          
          {/* Vertical Separator */}
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.2)', margin: '0 4px' }} />
          
          <button onClick={fitToPage} style={{ 
            background:'none', border:'none', color:'#94a3b8', 
            cursor:'pointer', fontSize:'0.75rem', fontWeight: 500, padding:'2px 4px' 
          }}>
            Fit Page
          </button>
          <button onClick={fitToWidth} style={{ 
            background:'none', border:'none', color:'#94a3b8', 
            cursor:'pointer', fontSize:'0.75rem', fontWeight: 500, padding:'2px 4px' 
          }}>
            Fit Width
          </button>
        </div>

        {/* Mode Toggle */}
        <button onClick={() => setIsSketching(false)} style={{
          background: !isSketching ? '#3b82f6' : 'rgba(255,255,255,0.05)',
          border: 'none', color: !isSketching ? '#fff' : '#94a3b8',
          borderRadius: 8, padding: '7px 14px', cursor: 'pointer',
          display:'flex', alignItems:'center', gap:6, fontSize:'0.83rem', fontWeight: 500
        }}>
          <MousePointer size={15} /> Read
        </button>
        <button onClick={() => setIsSketching(true)} style={{
          background: isSketching ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
          border: isSketching ? '1px solid rgba(59,130,246,0.4)' : '1px solid transparent',
          color: isSketching ? '#60a5fa' : '#94a3b8',
          borderRadius: 8, padding: '7px 14px', cursor: 'pointer',
          display:'flex', alignItems:'center', gap:6, fontSize:'0.83rem', fontWeight: 500
        }}>
          <Edit2 size={15} /> Annotate
        </button>

        {/* Fullscreen */}
        <button onClick={toggleFullscreen} style={{ background:'none', border:'none', color:'#94a3b8', cursor:'pointer', padding:4 }}>
          {isFullscreen ? <Minimize size={18}/> : <Maximize size={18}/>}
        </button>
      </div>

      {/* ========== BODY ========== */}
      <div style={{ display:'flex', flexGrow:1, overflow:'hidden' }}>

        {/* Sketch Toolbar */}
        {isSketching && (
          <div style={{
            width: 56, background:'#1a1d2e', borderRight:'1px solid rgba(255,255,255,0.08)',
            display:'flex', flexDirection:'column', alignItems:'center',
            padding:'16px 0', gap:12, flexShrink: 0, zIndex: 10001
          }}>
            {[
              { t:'pencil', Icon: Edit2, clr:'#3b82f6' },
              { t:'highlighter', Icon: Highlighter, clr:'#eab308' },
              { t:'eraser', Icon: Eraser, clr:'#ef4444' }
            ].map(({ t, Icon, clr }) => (
              <button key={t} onClick={() => setBrushType(t)} title={t} style={{
                width:40, height:40, borderRadius:8,
                background: brushType===t ? `${clr}22` : 'transparent',
                color: brushType===t ? clr : '#64748b',
                border: brushType===t ? `1px solid ${clr}44` : '1px solid transparent',
                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'
              }}>
                <Icon size={18}/>
              </button>
            ))}

            <div style={{ width:28, height:1, background:'rgba(255,255,255,0.08)', margin:'4px 0' }}/>

            {/* Color picker for pencil */}
            {brushType === 'pencil' && (
              <input type="color" value={brushColor} onChange={e => setBrushColor(e.target.value)}
                style={{ width:32, height:32, border:'none', borderRadius:6, cursor:'pointer', background:'none', padding:0 }}
                title="Pencil color"
              />
            )}

            {/* Highlighter colors */}
            {brushType === 'highlighter' && (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {['rgba(253,224,71,0.55)','rgba(74,222,128,0.45)','rgba(96,165,250,0.45)','rgba(249,168,212,0.55)'].map(c => (
                  <button key={c} onClick={() => setHighlighterColor(c)} style={{
                    width:22, height:22, borderRadius:'50%', cursor:'pointer',
                    background: c.replace(/0\.\d+\)/, '1)'),
                    border: highlighterColor===c ? '2px solid white' : '2px solid transparent'
                  }}/>
                ))}
              </div>
            )}

            <div style={{ width:28, height:1, background:'rgba(255,255,255,0.08)', margin:'4px 0' }}/>
            <button onClick={triggerUndo} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer' }}><Undo2 size={18}/></button>
            <button onClick={triggerRedo} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer' }}><Redo2 size={18}/></button>
          </div>
        )}

        {/* ========== SCROLLABLE PDF AREA ========== */}
        <div
          id="pdf-scroll-container"
          style={{
            flexGrow:1, overflowY:'auto', overflowX:'auto',
            display:'flex', flexDirection:'column', alignItems:'center',
            padding: '40px 20px', background:'#12131a',
            position: 'relative'
          }}
        >
          {/* Document Wrapper ensures coordinate origin matches the document exactly */}
          <div 
            ref={wrapperRef}
            style={{ 
              position: 'relative', 
              display: 'inline-block',
              touchAction: isSketching ? 'none' : 'auto' // Prevents scrolling on touch/pen while drawing
            }}
          >
            <Document
              file={fileUrl}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              loading={
                <div style={{ color:'#94a3b8', marginTop:80, display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
                  <BookOpen size={40} color="#3b82f6"/>
                  <p>Loading document…</p>
                </div>
              }
              error={
                <div style={{ color:'#f87171', marginTop:80, textAlign:'center' }}>
                  <p style={{ fontSize:'1.1rem', fontWeight:600 }}>Failed to load PDF</p>
                  <p style={{ fontSize:'0.85rem', color:'#94a3b8', marginTop:8 }}>Check the file path or try again.</p>
                </div>
              }
            >
              {Array.from({ length: numPages || 0 }, (_, i) => (
                <div
                  key={i}
                  style={{ 
                    marginBottom: 24 * zoom, // MUST scale margin with zoom so spacing remains proportional!
                    boxShadow:'0 8px 32px rgba(0,0,0,0.6)', 
                    borderRadius:4, 
                    overflow:'hidden',
                    background: 'white', // ensure pages are white
                    position: 'relative'
                  }}
                >
                  <Page
                    pageNumber={i + 1}
                    scale={zoom}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    onLoadSuccess={(page) => {
                      if (i === 0) {
                        setIntrinsicWidth(page.originalWidth || page.view[2] || 800);
                        setIntrinsicHeight(page.originalHeight || page.view[3] || 1056);
                      }
                    }}
                  />
                  
                  {/* Box-Only Tamer-Style Centered Diagonal Watermark (Per Page) */}
                  <div className="watermark-overlay" />
                </div>
              ))}
            </Document>

            {/* ========== SVG STROKE OVERLAY ========== */}
            {/* The SVG is fixed over the document wrapper so it scrolls flawlessly natively */}
            <svg 
              style={{ 
                position: 'absolute', top: 0, left: 0, 
                width: '100%', height: '100%', 
                pointerEvents: isSketching ? 'auto' : 'none',
                cursor: getCursor(),
                touchAction: 'none',
                zIndex: 10000 
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onPointerLeave={onPointerUp}
            >
              <g transform={`scale(${zoom})`}>
                {strokes.filter(s => s.type !== 'eraser').map((stroke, index) => (
                  <path
                    key={stroke.id || index}
                    d={`M ${stroke.points.map(p => `${p.x},${p.y}`).join(' L ')}`}
                    stroke={stroke.color}
                    strokeWidth={stroke.lineWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ mixBlendMode: stroke.type === 'highlighter' ? 'multiply' : 'normal' }}
                  />
                ))}
                
                {/* Active fast-rendering stroke */}
                <path
                  ref={activePathRef}
                  d=""
                  stroke={brushType === 'highlighter' ? highlighterColor : brushColor}
                  strokeWidth={brushType === 'highlighter' ? 18 : 3}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ mixBlendMode: brushType === 'highlighter' ? 'multiply' : 'normal' }}
                />
              </g>
            </svg>
          </div>
        </div>

      </div>
    </div>
  );
}
