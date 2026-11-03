import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Paintbrush, Trash2, X } from 'lucide-react';

export default function Scratchpad({ onClose }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#00d2ff');
  const [lineWidth, setLineWidth] = useState(3);
  const [tool, setTool] = useState('brush'); // brush, eraser, hand

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      
      // Save current drawing contents before resizing (resizing clears the canvas!)
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(canvas, 0, 0);

      // Apply new dimensions
      canvas.width = rect.width || 380;
      canvas.height = (rect.height - 50) || 300;

      // Re-configure canvas context parameters
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = tool === 'eraser' ? '#111827' : color;
      ctx.lineWidth = tool === 'eraser' ? 20 : lineWidth;
      
      // Restore previous drawing stroke image
      ctx.drawImage(tempCanvas, 0, 0);
    };

    resizeCanvas();

    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [color, lineWidth, tool]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    // Scale coordinates to match internal resolution
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);
    return { x, y };
  };

  const startDrawing = (e) => {
    if (tool === 'hand') return; // Do nothing if in pan mode
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (e.touches) {
      e.preventDefault();
    }
    
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (e.touches) {
      e.preventDefault();
    }
    
    const { x, y } = getCoordinates(e);
    ctx.lineWidth = tool === 'eraser' ? 24 : lineWidth;
    ctx.strokeStyle = tool === 'eraser' ? '#111827' : color;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="scratchpad-container glass-panel" style={{ height: '350px' }}>
      <div className="scratchpad-toolbar">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* Tool selectors */}
          <button
            onClick={() => setTool('brush')}
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              background: tool === 'brush' ? 'rgba(0, 210, 255, 0.15)' : 'none',
              border: tool === 'brush' ? '1px solid var(--accent-quant)' : '1px solid transparent',
              color: tool === 'brush' ? 'var(--accent-quant)' : 'var(--text-secondary)'
            }}
          >
            <Paintbrush size={14} /> Brush
          </button>
          <button
            onClick={() => setTool('eraser')}
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              background: tool === 'eraser' ? 'rgba(255, 255, 255, 0.1)' : 'none',
              border: tool === 'eraser' ? '1px solid var(--text-secondary)' : '1px solid transparent',
              color: 'var(--text-secondary)'
            }}
          >
            <Eraser size={14} /> Eraser
          </button>
          <button
            onClick={() => setTool('hand')}
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              background: tool === 'hand' ? 'rgba(255, 255, 255, 0.1)' : 'none',
              border: tool === 'hand' ? '1px solid var(--text-secondary)' : '1px solid transparent',
              color: 'var(--text-secondary)',
              marginLeft: '4px'
            }}
          >
            ✋ Hand (Scroll)
          </button>

          {/* Color pickers */}
          {tool === 'brush' && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 8 }}>
              {['#00d2ff', '#d946ef', '#10b981', '#ffffff', '#eab308'].map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: c,
                    border: color === c ? '2px solid white' : '1px solid rgba(0,0,0,0.5)',
                    padding: 0
                  }}
                />
              ))}
            </div>
          )}

          {/* Brush thickness */}
          {tool === 'brush' && (
            <select
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                padding: '4px',
                fontSize: '0.75rem',
                borderRadius: '4px',
                marginLeft: 8
              }}
            >
              <option value={2}>Thin (2px)</option>
              <option value={4}>Medium (4px)</option>
              <option value={8}>Thick (8px)</option>
            </select>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={clearCanvas} style={{ padding: '6px 10px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none' }}>
            <Trash2 size={14} /> Clear
          </button>
          {onClose && (
            <button onClick={onClose} style={{ padding: '6px 10px', background: 'none', border: 'none', color: 'var(--text-secondary)' }}>
              <X size={14} /> Close
            </button>
          )}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="scratchpad-canvas"
        style={{
          touchAction: tool === 'hand' ? 'auto' : 'none', // Allow scroll if hand
          maxWidth: '100%',
          display: 'block',
          cursor: tool === 'hand' ? 'grab' : 'crosshair'
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
    </div>
  );
}
