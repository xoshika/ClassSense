import { useEffect, useState } from 'react';

export default function LoadingIndicator({ onLoadingComplete }) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const increment = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { clearInterval(increment); return 100; }
        return prev + 2;
      });
    }, 36);

    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onLoadingComplete) onLoadingComplete();
    }, 2000);

    return () => { clearTimeout(timer); clearInterval(increment); };
  }, [onLoadingComplete]);

  if (!isVisible) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .li-root {
          position: fixed; inset: 0; z-index: 9999;
          background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 55%, #0f2744 100%);
          display: flex; align-items: center; justify-content: center;
          font-family: 'DM Sans','Segoe UI',sans-serif;
          overflow: hidden;
        }
        .li-blob-1 {
          position: absolute; top: -100px; left: -100px;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(59,130,246,0.14) 0%, transparent 70%);
          pointer-events: none;
        }
        .li-blob-2 {
          position: absolute; bottom: -80px; right: -80px;
          width: 350px; height: 350px;
          background: radial-gradient(circle, rgba(96,165,250,0.1) 0%, transparent 70%);
          pointer-events: none;
        }
        .li-center { text-align: center; position: relative; z-index: 1; }
        .li-logo-icon {
          width: 68px; height: 68px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border-radius: 20px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px;
          box-shadow: 0 8px 32px rgba(59,130,246,0.4);
          animation: li-float 2s ease-in-out infinite;
        }
        .li-title {
          font-size: 38px; font-weight: 700;
          color: #f0f9ff; letter-spacing: -0.8px;
          margin-bottom: 6px;
          animation: li-fadein 0.6s ease-out;
        }
        .li-sub {
          font-size: 13px; color: rgba(148,163,184,0.7);
          font-weight: 400; letter-spacing: 0.5px;
          margin-bottom: 36px;
          animation: li-fadein 0.8s ease-out;
        }
        .li-progress-wrap {
          width: 200px; margin: 0 auto;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 100px;
          height: 4px; overflow: hidden;
        }
        .li-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #60a5fa);
          border-radius: 100px;
          transition: width 0.1s ease;
          box-shadow: 0 0 10px rgba(59,130,246,0.5);
        }
        @keyframes li-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes li-fadein { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div className="li-root">
        <div className="li-blob-1" />
        <div className="li-blob-2" />
        <div className="li-center">
          <div className="li-logo-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <div className="li-title">ClassSense</div>
          <div className="li-sub">Gesture Monitoring System</div>
          <div className="li-progress-wrap">
            <div className="li-progress-bar" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </>
  );
}