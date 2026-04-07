import { useEffect, useRef, useState, useCallback } from 'react';
import { useGestureStream } from '../hooks/useWebSocket';

export default function LiveCamera({ sessionId, numSeats = 20, mode = 'lesson', onGestureDetected = null }) {
  const videoRef         = useRef(null);
  const canvasRef        = useRef(null);
  const modalVideoRef    = useRef(null);
  const frameIntervalRef = useRef(null);
  const streamRef        = useRef(null);

  const [isRunning, setIsRunning]           = useState(false);
  const [currentGesture, setCurrentGesture] = useState(null);
  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [liveTime, setLiveTime]             = useState('');

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
      if (onGestureDetected) onGestureDetected(latest);
    }
  }, [gestures, onGestureDetected]);

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
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setIsRunning(true);
    } catch (err) {
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
      frameIntervalRef.current = setInterval(captureAndSendFrame, 200);
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

  const getGestureStatus = (gesture) => {
    const rules = {
      lesson: { allowed: ['raised_hand','peace_sign'], warning: ['wave','clap'], alert: [] },
      quiz:   { allowed: ['raised_hand'], warning: [], alert: ['peace_sign','thumbs_up','thumbs_down','clap','wave','ok_sign'] },
      exam:   { allowed: [], warning: ['raised_hand'], alert: ['peace_sign','thumbs_up','thumbs_down','clap','wave','ok_sign'] },
    }[mode] || { allowed: [], warning: [], alert: [] };
    if (rules.allowed.includes(gesture)) return { color: '#27AE60' };
    if (rules.warning.includes(gesture)) return { color: '#F39C12' };
    if (rules.alert.includes(gesture))   return { color: '#E74C3C' };
    return { color: '#3B9FD1' };
  };

  const fmt = (g) => g.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const statusInfo = currentGesture ? getGestureStatus(currentGesture.gesture) : null;

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div
          onClick={() => setIsModalOpen(true)}
          style={{ position: 'relative', width: '100%', background: '#111', borderRadius: 10, overflow: 'hidden', aspectRatio: '16/9', cursor: 'pointer' }}
        >
          <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(231,76,60,0.92)', color: 'white', padding: '5px 12px', borderRadius: 20, fontWeight: 'bold', fontSize: 12 }}>
            <span style={{ width: 8, height: 8, background: 'white', borderRadius: '50%', display: 'inline-block', animation: 'livepulse 1.5s infinite' }} />
            Live
          </div>

          {currentGesture && statusInfo && (
            <div style={{ position: 'absolute', bottom: 10, left: 10, background: statusInfo.color, color: 'white', padding: '6px 14px', borderRadius: 8, fontWeight: 'bold', fontSize: 13 }}>
              {fmt(currentGesture.gesture)} Detected
            </div>
          )}

          <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 'bold' }}>
            {liveTime}
          </div>

          <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.45)', color: 'white', padding: '4px 10px', borderRadius: 6, fontSize: 11 }}>
            Click to expand
          </div>
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => isRunning ? stopCamera() : startCamera()}
            style={{ padding: '9px 20px', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', background: isRunning ? '#E74C3C' : '#3B9FD1', color: 'white', fontSize: 13 }}
          >
            {isRunning ? '■ Stop Camera' : '▶ Start Camera'}
          </button>
          <span style={{ fontSize: 12, fontWeight: 'bold', color: isConnected ? '#27AE60' : '#E74C3C' }}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
        </div>

        <div style={{ background: 'white', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 15 }}>🔔</span>
            <span style={{ fontWeight: 'bold', color: '#1B4F8A', fontSize: 14 }}>Recent Alerts</span>
          </div>
          {gestures.length === 0 ? (
            <p style={{ color: '#aaa', fontSize: 13, margin: 0 }}>No alerts yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
              {gestures.slice(0, 8).map((g, i) => {
                const info = getGestureStatus(g.gesture);
                const ts   = g.timestamp
                  ? new Date(g.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                  : liveTime;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8F9FA', borderRadius: 8, padding: '8px 12px', borderLeft: `4px solid ${info.color}` }}>
                    <span style={{ fontSize: 13, color: '#333', fontWeight: 500 }}>
                      Chair Rank {g.seat} — {fmt(g.gesture)}
                    </span>
                    <span style={{ fontSize: 11, color: '#888' }}>{ts}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setIsModalOpen(false)}
        >
          <div style={{ width: '90vw', maxWidth: 1100, position: 'relative' }} onClick={e => e.stopPropagation()}>
            <div style={{ position: 'relative', width: '100%', background: '#000', borderRadius: 12, overflow: 'hidden', aspectRatio: '16/9' }}>
              <video ref={modalVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

              <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(231,76,60,0.92)', color: 'white', padding: '7px 16px', borderRadius: 20, fontWeight: 'bold', fontSize: 14 }}>
                <span style={{ width: 10, height: 10, background: 'white', borderRadius: '50%', display: 'inline-block', animation: 'livepulse 1.5s infinite' }} />
                Live
              </div>

              {currentGesture && statusInfo && (
                <div style={{ position: 'absolute', bottom: 16, left: 16, background: statusInfo.color, color: 'white', padding: '8px 18px', borderRadius: 10, fontWeight: 'bold', fontSize: 16 }}>
                  {fmt(currentGesture.gesture)} Detected — Seat {currentGesture.seat}
                </div>
              )}

              <div style={{ position: 'absolute', bottom: 16, right: 16, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '6px 14px', borderRadius: 8, fontSize: 15, fontWeight: 'bold' }}>
                {liveTime}
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', top: -14, right: -14, width: 34, height: 34, borderRadius: '50%', background: '#E74C3C', border: 'none', color: 'white', fontWeight: 'bold', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes livepulse { 0%,100%{opacity:1} 50%{opacity:0.25} }`}</style>
    </>
  );
}