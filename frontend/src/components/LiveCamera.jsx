import { useEffect, useRef, useState, useCallback } from 'react';
import { useGestureStream } from '../hooks/useWebSocket';

function getGestureStatus(gesture, mode) {
  const rules = {
    lesson:  { allowed: ['raised_hand','peace_sign'], warning: ['wave','clap'], alert: [] },
    lecture: { allowed: ['raised_hand','peace_sign','thumbs_up','thumbs_down','ok_sign','clapping','walking','head_moving'], warning: [], alert: [] },
    quiz:    { allowed: ['raised_hand'], warning: [], alert: ['peace_sign','thumbs_up','thumbs_down','clap','wave','ok_sign','clapping','walking','head_moving'] },
    exam:    { allowed: [], warning: ['raised_hand'], alert: ['peace_sign','thumbs_up','thumbs_down','clap','wave','ok_sign','clapping','walking','head_moving'] },
  }[mode?.toLowerCase()] || { allowed: [], warning: [], alert: [] };
  const g = gesture?.toLowerCase().replace(/ /g, '_');
  if (rules.allowed.includes(g)) return { color: '#10b981', label: 'Allowed',  bg: 'rgba(16,185,129,0.85)' };
  if (rules.warning.includes(g)) return { color: '#f59e0b', label: 'Warning',  bg: 'rgba(245,158,11,0.85)' };
  if (rules.alert.includes(g))   return { color: '#ef4444', label: 'Alert',    bg: 'rgba(239,68,68,0.85)' };
  return                                 { color: '#3b82f6', label: 'Detected', bg: 'rgba(59,130,246,0.85)' };
}

const fmt = (g) => (g || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export default function LiveCamera({ sessionId, numSeats = 20, mode = 'lesson', onGestureDetected = null }) {
  const videoRef         = useRef(null);
  const canvasRef        = useRef(null);
  const modalVideoRef    = useRef(null);
  const frameIntervalRef = useRef(null);
  const streamRef        = useRef(null);
  const onGestureRef     = useRef(onGestureDetected);

  useEffect(() => { onGestureRef.current = onGestureDetected; }, [onGestureDetected]);

  const [isRunning, setIsRunning]       = useState(false);
  const [currentGesture, setCurrentGesture] = useState(null);
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [liveTime, setLiveTime]         = useState('');

  const { gestures, isConnected, sendFrame } = useGestureStream(sessionId, numSeats);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (gestures.length > 0) {
      const latest = gestures[0];
      setCurrentGesture(latest);
      if (onGestureRef.current) onGestureRef.current(latest);
    }
  }, [gestures]);

  const captureAndSendFrame = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    sendFrame(canvas.toDataURL('image/jpeg', 0.7));
  }, [sendFrame]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsRunning(true);
    } catch {
      alert('Could not access camera. Please check permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (frameIntervalRef.current) { clearInterval(frameIntervalRef.current); frameIntervalRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current)      videoRef.current.srcObject = null;
    if (modalVideoRef.current) modalVideoRef.current.srcObject = null;
    setIsRunning(false);
    setCurrentGesture(null);
  }, []);

  useEffect(() => {
    if (isRunning) {
      frameIntervalRef.current = setInterval(captureAndSendFrame, 300);
    } else {
      if (frameIntervalRef.current) { clearInterval(frameIntervalRef.current); frameIntervalRef.current = null; }
    }
    return () => { if (frameIntervalRef.current) clearInterval(frameIntervalRef.current); };
  }, [isRunning, captureAndSendFrame]);

  useEffect(() => { return () => stopCamera(); }, [stopCamera]);

  useEffect(() => {
    if (isModalOpen && streamRef.current && modalVideoRef.current) {
      modalVideoRef.current.srcObject = streamRef.current;
      modalVideoRef.current.play().catch(() => {});
    }
  }, [isModalOpen]);

  const statusInfo    = currentGesture ? getGestureStatus(currentGesture.gesture, mode) : null;
  const aiStatusColor = isConnected ? '#10b981' : '#ef4444';
  const aiStatusText  = isConnected ? 'AI Monitoring Active' : 'Not Connected';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .lc-container { display:flex; flex-direction:column; gap:12px; font-family:'DM Sans','Segoe UI',sans-serif; }
        .lc-video-wrap {
          position:relative; width:100%; background:#0a0f1a;
          border-radius:14px; overflow:hidden; aspect-ratio:16/9;
          cursor:pointer; box-shadow:0 8px 32px rgba(0,0,0,0.3);
          border:1px solid rgba(255,255,255,0.06);
        }
        .lc-video { width:100%; height:100%; object-fit:cover; display:block; }
        .lc-overlay-top {
          position:absolute; top:0; left:0; right:0; padding:10px 12px;
          display:flex; align-items:center; justify-content:space-between;
          background:linear-gradient(180deg,rgba(0,0,0,0.6) 0%,transparent 100%);
        }
        .lc-live-badge {
          display:flex; align-items:center; gap:6px;
          background:rgba(239,68,68,0.9); backdrop-filter:blur(6px);
          color:white; padding:4px 10px; border-radius:20px;
          font-weight:700; font-size:11px; letter-spacing:0.5px;
          border:1px solid rgba(255,255,255,0.15);
        }
        .lc-live-dot { width:7px; height:7px; background:white; border-radius:50%; animation:lc-livepulse 1.4s ease-in-out infinite; }
        .lc-camera-off-badge {
          background:rgba(0,0,0,0.5); backdrop-filter:blur(6px);
          color:rgba(255,255,255,0.5); padding:4px 10px; border-radius:20px;
          font-size:11px; font-weight:600; border:1px solid rgba(255,255,255,0.08);
        }
        .lc-ai-badge {
          display:flex; align-items:center; gap:5px;
          background:rgba(0,0,0,0.55); backdrop-filter:blur(8px);
          border:1px solid rgba(255,255,255,0.1);
          color:white; padding:4px 10px; border-radius:20px; font-size:10px; font-weight:600;
        }
        .lc-ai-dot { width:6px; height:6px; border-radius:50%; }
        .lc-overlay-bottom {
          position:absolute; bottom:0; left:0; right:0; padding:10px 12px;
          display:flex; align-items:flex-end; justify-content:space-between;
          background:linear-gradient(0deg,rgba(0,0,0,0.65) 0%,transparent 100%);
        }
        .lc-gesture-chip {
          color:white; padding:5px 12px; border-radius:8px;
          font-weight:700; font-size:12px; backdrop-filter:blur(6px);
          border:1px solid rgba(255,255,255,0.15);
        }
        .lc-time {
          background:rgba(0,0,0,0.5); backdrop-filter:blur(6px);
          color:rgba(255,255,255,0.9); padding:4px 10px; border-radius:6px;
          font-size:11px; font-weight:700; font-variant-numeric:tabular-nums;
          border:1px solid rgba(255,255,255,0.08);
        }
        .lc-expand-hint {
          position:absolute; top:10px; left:50%; transform:translateX(-50%);
          background:rgba(0,0,0,0.4); backdrop-filter:blur(6px);
          color:rgba(255,255,255,0.5); font-size:10px;
          padding:3px 10px; border-radius:20px; pointer-events:none;
          border:1px solid rgba(255,255,255,0.08);
        }
        .lc-controls { display:flex; align-items:center; gap:10px; }
        .lc-cam-btn {
          display:flex; align-items:center; gap:7px;
          padding:9px 18px; border:none; border-radius:9px;
          font-weight:700; cursor:pointer; font-size:12px;
          font-family:'DM Sans','Segoe UI',sans-serif;
          transition:all 0.18s ease; letter-spacing:0.2px;
        }
        .lc-cam-btn.start { background:linear-gradient(135deg,#3b82f6,#2563eb); color:white; box-shadow:0 4px 14px rgba(59,130,246,0.35); }
        .lc-cam-btn.start:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(59,130,246,0.45); }
        .lc-cam-btn.stop { background:linear-gradient(135deg,#ef4444,#dc2626); color:white; box-shadow:0 4px 14px rgba(239,68,68,0.3); }
        .lc-cam-btn.stop:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(239,68,68,0.4); }
        .lc-conn-badge {
          display:flex; align-items:center; gap:6px; padding:7px 12px;
          background:rgba(255,255,255,0.65); backdrop-filter:blur(12px);
          border:1px solid rgba(255,255,255,0.4); border-radius:8px;
          font-size:12px; font-weight:600; box-shadow:0 2px 10px rgba(0,0,0,0.07);
        }
        .lc-conn-dot { width:7px; height:7px; border-radius:50%; }
        .lc-alerts-card {
          background:rgba(255,255,255,0.65); backdrop-filter:blur(14px);
          border:1px solid rgba(255,255,255,0.45); border-radius:14px;
          padding:14px; box-shadow:0 4px 20px rgba(0,0,0,0.07);
        }
        .lc-alerts-header { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
        .lc-alerts-title { font-size:12px; font-weight:700; color:#0f172a; letter-spacing:0.2px; }
        .lc-alerts-count {
          font-size:10px; background:rgba(59,130,246,0.1); color:#3b82f6;
          padding:2px 8px; border-radius:20px; font-weight:700;
          border:1px solid rgba(59,130,246,0.2);
        }
        .lc-alert-item {
          display:flex; align-items:center; justify-content:space-between;
          padding:8px 10px; border-radius:8px; margin-bottom:5px;
          border-left:3px solid transparent;
          background:rgba(255,255,255,0.5); backdrop-filter:blur(6px);
          border-top:1px solid rgba(255,255,255,0.6);
          transition:background 0.15s ease;
        }
        .lc-alert-item:hover { background:rgba(255,255,255,0.75); }
        .lc-alert-item:last-child { margin-bottom:0; }
        .lc-alert-info { font-size:12px; color:#334155; font-weight:500; }
        .lc-alert-time { font-size:10px; color:#94a3b8; }
        .lc-no-alerts {
          font-size:12px; color:#94a3b8; text-align:center; padding:16px 0;
          display:flex; flex-direction:column; align-items:center; gap:6px;
        }
        .lc-modal-overlay {
          position:fixed; inset:0; background:rgba(0,0,0,0.92); z-index:9999;
          display:flex; align-items:center; justify-content:center; backdrop-filter:blur(6px);
        }
        .lc-modal-inner { width:90vw; max-width:1100px; position:relative; }
        .lc-modal-video-wrap {
          position:relative; width:100%; background:#000;
          border-radius:16px; overflow:hidden; aspect-ratio:16/9;
          box-shadow:0 32px 80px rgba(0,0,0,0.6); border:1px solid rgba(255,255,255,0.08);
        }
        .lc-modal-close {
          position:absolute; top:-14px; right:-14px;
          width:32px; height:32px; border-radius:50%;
          background:#ef4444; border:none; color:white;
          font-weight:700; font-size:18px; cursor:pointer;
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 4px 12px rgba(239,68,68,0.4); transition:all 0.18s ease;
        }
        .lc-modal-close:hover { transform:scale(1.1); }
        @keyframes lc-livepulse { 0%,100%{opacity:1} 50%{opacity:0.2} }
      `}</style>

      <div className="lc-container">
        <div className="lc-video-wrap" onClick={() => setIsModalOpen(true)}>
          <video ref={videoRef} autoPlay playsInline muted className="lc-video" />
          <div className="lc-overlay-top">
            {isRunning
              ? <div className="lc-live-badge"><span className="lc-live-dot" />LIVE</div>
              : <div className="lc-camera-off-badge">Camera Off</div>
            }
            <div className="lc-ai-badge">
              <div className="lc-ai-dot" style={{ background: aiStatusColor, boxShadow: `0 0 6px ${aiStatusColor}` }} />
              {aiStatusText}
            </div>
          </div>
          <div className="lc-expand-hint">Click to expand</div>
          <div className="lc-overlay-bottom">
            {currentGesture && statusInfo && (
              <div className="lc-gesture-chip" style={{ background: statusInfo.bg }}>
                {fmt(currentGesture.gesture)} — {statusInfo.label}
              </div>
            )}
            <div className="lc-time">{liveTime}</div>
          </div>
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <div className="lc-controls">
          <button
            onClick={() => isRunning ? stopCamera() : startCamera()}
            className={`lc-cam-btn ${isRunning ? 'stop' : 'start'}`}
          >
            {isRunning
              ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="white"><rect x="6" y="6" width="12" height="12" /></svg>Stop Camera</>
              : <><svg width="12" height="12" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3" /></svg>Start Camera</>
            }
          </button>
          <div className="lc-conn-badge">
            <div className="lc-conn-dot" style={{ background: isConnected ? '#10b981' : '#ef4444', boxShadow: isConnected ? '0 0 6px #10b981' : 'none' }} />
            <span style={{ color: isConnected ? '#065f46' : '#991b1b' }}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="lc-alerts-card">
          <div className="lc-alerts-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="lc-alerts-title">Recent Alerts</span>
            {gestures.length > 0 && <span className="lc-alerts-count">{gestures.length}</span>}
          </div>
          {gestures.length === 0 ? (
            <div className="lc-no-alerts">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(148,163,184,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              No alerts yet
            </div>
          ) : (
            <div style={{ maxHeight: 160, overflowY: 'auto' }}>
              {gestures.slice(0, 8).map((g, i) => {
                const info = getGestureStatus(g.gesture, mode);
                const ts = g.time || liveTime;
                return (
                  <div key={i} className="lc-alert-item" style={{ borderLeftColor: info.color }}>
                    <span className="lc-alert-info">Chair {g.chair_rank || g.seat || 1} — {fmt(g.gesture)}</span>
                    <span className="lc-alert-time">{ts}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="lc-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="lc-modal-inner" onClick={e => e.stopPropagation()}>
            <div className="lc-modal-video-wrap">
              <video ref={modalVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div className="lc-overlay-top">
                <div className="lc-live-badge"><span className="lc-live-dot" />LIVE</div>
                <div className="lc-ai-badge">
                  <div className="lc-ai-dot" style={{ background: aiStatusColor }} />
                  {aiStatusText}
                </div>
              </div>
              <div className="lc-overlay-bottom">
                {currentGesture && statusInfo && (
                  <div className="lc-gesture-chip" style={{ background: statusInfo.bg, fontSize: 14, padding: '7px 16px' }}>
                    {fmt(currentGesture.gesture)} — Seat {currentGesture.chair_rank || currentGesture.seat || 1}
                  </div>
                )}
                <div className="lc-time" style={{ fontSize: 13 }}>{liveTime}</div>
              </div>
            </div>
            <button className="lc-modal-close" onClick={() => setIsModalOpen(false)}>×</button>
          </div>
        </div>
      )}
    </>
  );
}
