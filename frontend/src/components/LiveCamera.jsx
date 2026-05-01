import { useEffect, useRef, useState, useCallback } from 'react';
import { useGestureStream } from '../hooks/useWebSocket';
import ActivityRulesModal from './ActivityRulesModal';

const POSE_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,7],[0,4],[4,5],[5,6],[6,8],
  [9,10],[11,12],[11,13],[13,15],[12,14],[14,16],
  [11,23],[12,24],[23,24],[23,25],[24,26],[25,27],[26,28],
  [27,29],[28,30],[29,31],[30,32],[27,31],[28,32],
];

function getGestureStatus(gesture, mode) {
  const rules = {
    lesson:  { allowed: ['raised_hand','peace_sign'], warning: ['wave','clap'], alert: [] },
    lecture: { allowed: ['raised_hand','peace_sign','thumbs_up','thumbs_down','ok_sign','clapping','walking','head_moving'], warning: [], alert: [] },
    quiz:    { allowed: ['raised_hand','peace_sign','thumbs_up','thumbs_down','ok_sign'], warning: [], alert: ['clapping','walking','head_moving','moving_chair'] },
    exam:    { allowed: ['raised_hand'], warning: [], alert: ['peace_sign','thumbs_up','thumbs_down','ok_sign','clapping','walking','head_moving','moving_chair'] },
  }[mode?.toLowerCase()] || { allowed: [], warning: [], alert: [] };
  const g = (gesture || '').toLowerCase().replace(/ /g, '_');
  if (rules.allowed.includes(g)) return { color: '#10b981', label: 'Allowed',  bg: 'rgba(16,185,129,0.85)', isViolation: false };
  if (rules.warning.includes(g)) return { color: '#f59e0b', label: 'Warning',  bg: 'rgba(245,158,11,0.85)', isViolation: false };
  if (rules.alert.includes(g))   return { color: '#ef4444', label: 'VIOLATION', bg: 'rgba(239,68,68,0.85)', isViolation: true };
  return                                 { color: '#3b82f6', label: 'Detected', bg: 'rgba(59,130,246,0.85)', isViolation: false };
}

const VIOLATION_RULES_INFO = {
  quiz: {
    forbidden: ['Clapping', 'Walking', 'Head Moving', 'Moving Chair'],
    reason: 'These gestures may indicate disruption or cheating during a Quiz.',
  },
  exam: {
    forbidden: ['Peace Sign', 'Thumbs Up', 'Thumbs Down', 'OK Sign', 'Clapping', 'Walking', 'Head Moving', 'Moving Chair'],
    reason: 'Only Hand Raise is permitted during an Exam. All other gestures indicate potential cheating.',
  },
  lecture: { forbidden: [], reason: '' },
  lesson:  { forbidden: [], reason: '' },
};

const fmt = (g) => (g || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

function playTingSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
  } catch (e) {}
}

function playAmbulanceSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const duration = 2.0;
    const bufferSize = ctx.sampleRate * duration;
    const buf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / ctx.sampleRate;
      const freq = 600 + 300 * Math.sin(2 * Math.PI * 2 * t);
      const envelope = Math.min(1, t * 5) * Math.min(1, (duration - t) * 5);
      data[i] = Math.sin(2 * Math.PI * freq * t) * 0.7 * envelope;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start();
    src.stop(ctx.currentTime + duration);
  } catch (e) {}
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function ViolationModal({ violation, onDismiss, mode }) {
  const [visible, setVisible] = useState(false);
  const ruleInfo = VIOLATION_RULES_INFO[mode?.toLowerCase()] || { forbidden: [], reason: '' };

  useEffect(() => {
    if (violation) {
      setTimeout(() => setVisible(true), 10);
    } else {
      setVisible(false);
    }
  }, [violation]);

  if (!violation) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      transition: 'opacity 0.25s ease',
      opacity: visible ? 1 : 0,
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a0a0a 0%, #2d0f0f 100%)',
        border: '2px solid rgba(239,68,68,0.6)',
        borderRadius: 20,
        padding: '32px 36px',
        width: 480,
        maxWidth: '90vw',
        boxShadow: '0 0 60px rgba(239,68,68,0.4), 0 24px 64px rgba(0,0,0,0.6)',
        transform: visible ? 'scale(1) translateY(0)' : 'scale(0.88) translateY(20px)',
        transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 20, pointerEvents: 'none',
          background: 'repeating-linear-gradient(45deg, rgba(239,68,68,0.03) 0px, rgba(239,68,68,0.03) 1px, transparent 1px, transparent 8px)',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg,#ef4444,#dc2626)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(239,68,68,0.5)',
            animation: 'vm-pulse 0.8s ease-in-out infinite',
            flexShrink: 0,
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 3 }}>
              ⚠ Gesture Violation Detected
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'white', letterSpacing: -0.4, lineHeight: 1.2 }}>
              {violation.studentName || 'Student'} — Chair #{violation.chairRank}
            </div>
          </div>
        </div>
        <div style={{
          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 12, padding: '14px 18px', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6 }}>Gesture Type</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.2)', padding: '2px 10px', borderRadius: 20, border: '1px solid rgba(239,68,68,0.4)' }}>
              VIOLATION
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 4 }}>
            {fmt(violation.gesture)}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>
            Detected during <span style={{ color: '#f59e0b', fontWeight: 700 }}>{violation.mode}</span> mode at {violation.time}
          </div>
        </div>
        {ruleInfo.forbidden.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10, padding: '12px 16px', marginBottom: 16,
          }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
              Not Allowed During {violation.mode}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {ruleInfo.forbidden.map(g => (
                <span key={g} style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                  background: fmt(violation.gesture) === g ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)',
                  color: fmt(violation.gesture) === g ? '#ef4444' : 'rgba(255,255,255,0.5)',
                  border: fmt(violation.gesture) === g ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.08)',
                }}>
                  {fmt(violation.gesture) === g ? '✗ ' : ''}{g}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
              {ruleInfo.reason}
            </div>
          </div>
        )}
        <button
          onClick={onDismiss}
          style={{
            width: '100%', padding: '12px', borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg,#ef4444,#dc2626)',
            color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            fontFamily: 'inherit', letterSpacing: 0.3,
            boxShadow: '0 4px 16px rgba(239,68,68,0.4)',
            transition: 'all 0.18s ease',
          }}
          onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(239,68,68,0.5)'; }}
          onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 16px rgba(239,68,68,0.4)'; }}
        >
          Acknowledge & Dismiss
        </button>
        <style>{`
          @keyframes vm-pulse {
            0%,100%{box-shadow:0 0 20px rgba(239,68,68,0.5)}
            50%{box-shadow:0 0 40px rgba(239,68,68,0.9),0 0 60px rgba(239,68,68,0.3)}
          }
        `}</style>
      </div>
    </div>
  );
}

function NotificationBell({ notifications, onClear }) {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter(n => !n.read).length;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 12px', borderRadius: 9, cursor: 'pointer',
          background: unread > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.65)',
          backdropFilter: 'blur(12px)',
          border: unread > 0 ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.4)',
          color: unread > 0 ? '#ef4444' : '#64748b',
          fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
          transition: 'all 0.18s ease',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ animation: unread > 0 ? 'bell-ring 0.5s ease 0s 2' : 'none' }}>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        Alerts
        {unread > 0 && (
          <span style={{
            background: '#ef4444', color: 'white', borderRadius: 20,
            fontSize: 10, fontWeight: 700, padding: '1px 6px', minWidth: 18, textAlign: 'center',
            boxShadow: '0 0 8px rgba(239,68,68,0.5)',
          }}>{unread}</span>
        )}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '110%', right: 0, width: 320, zIndex: 9999,
          background: 'white', borderRadius: 14, boxShadow: '0 16px 48px rgba(0,0,0,0.16)',
          border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Violation Alerts</div>
            {notifications.length > 0 && (
              <button onClick={onClear} style={{ fontSize: 11, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                Clear all
              </button>
            )}
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                No violations recorded
              </div>
            ) : notifications.map((n, i) => (
              <div key={i} style={{
                padding: '10px 16px', borderBottom: '1px solid #f8fafc',
                borderLeft: `3px solid ${n.isViolation ? '#ef4444' : '#f59e0b'}`,
                background: n.read ? 'white' : 'rgba(239,68,68,0.02)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
                      {n.isViolation ? '🚨' : '⚠️'} {n.studentName} — Chair #{n.chairRank}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                      {fmt(n.gesture)} during {n.mode}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0, marginLeft: 8 }}>{n.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <style>{`
        @keyframes bell-ring {
          0%,100%{transform:rotate(0)} 25%{transform:rotate(-15deg)} 75%{transform:rotate(15deg)}
        }
      `}</style>
    </div>
  );
}

function drawCIAOverlay(canvas, videoEl, persons, missingChairs, studentNames, mode, scanAnimRef) {
  if (!canvas || !videoEl) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const now = Date.now();

  missingChairs.forEach(chair => {
    const x = ((chair - 1) / Math.max(missingChairs.length + persons.length, 1)) * W;
    const w = W / Math.max(missingChairs.length + persons.length, 1);
    const pulse = 0.5 + 0.5 * Math.sin(now / 500);

    ctx.save();
    ctx.strokeStyle = `rgba(239,68,68,${0.6 + 0.4 * pulse})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.strokeRect(x + 10, 20, w - 20, H - 40);
    ctx.setLineDash([]);

    ctx.fillStyle = `rgba(239,68,68,${0.12 + 0.08 * pulse})`;
    ctx.fillRect(x + 10, 20, w - 20, H - 40);

    const label = studentNames[chair - 1] || `Student ${chair}`;
    ctx.fillStyle = `rgba(239,68,68,${0.9 + 0.1 * pulse})`;
    ctx.font = 'bold 11px "DM Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`⚠ MISSING`, x + w / 2, 48);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 10px "DM Sans", sans-serif';
    ctx.fillText(`CHAIR #${chair}`, x + w / 2, 64);
    ctx.fillStyle = 'rgba(239,68,68,0.85)';
    ctx.font = '9px "DM Sans", sans-serif';
    ctx.fillText(label.toUpperCase(), x + w / 2, 80);
    ctx.restore();
  });

  persons.forEach(person => {
    const { bbox, landmarks, gesture, confidence, chair_rank } = person;
    if (!bbox) return;

    const bx = bbox.x * W;
    const by = bbox.y * H;
    const bw = bbox.w * W;
    const bh = bbox.h * H;

    const status = gesture ? getGestureStatus(gesture, mode) : null;
    const boxColor = gesture
      ? (status?.isViolation ? '#ef4444' : status?.color || '#00d4ff')
      : '#00d4ff';

    const pulse = 0.7 + 0.3 * Math.sin(now / 600);
    const cornerLen = Math.min(bw, bh) * 0.18;
    const lw = 2.5;

    ctx.save();
    ctx.strokeStyle = boxColor;
    ctx.lineWidth = lw;
    ctx.shadowColor = boxColor;
    ctx.shadowBlur = 8 * pulse;

    const corners = [
      { x: bx,      y: by,      dx: 1,  dy: 1  },
      { x: bx + bw, y: by,      dx: -1, dy: 1  },
      { x: bx,      y: by + bh, dx: 1,  dy: -1 },
      { x: bx + bw, y: by + bh, dx: -1, dy: -1 },
    ];
    corners.forEach(({ x, y, dx, dy }) => {
      ctx.beginPath();
      ctx.moveTo(x + dx * cornerLen, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + dy * cornerLen);
      ctx.stroke();
    });

    ctx.fillStyle = gesture
      ? `${boxColor}22`
      : 'rgba(0,212,255,0.04)';
    ctx.fillRect(bx, by, bw, bh);

    ctx.shadowBlur = 0;
    ctx.restore();

    if (landmarks && landmarks.length >= 17) {
      ctx.save();
      POSE_CONNECTIONS.forEach(([a, b]) => {
        if (a >= landmarks.length || b >= landmarks.length) return;
        const lmA = landmarks[a];
        const lmB = landmarks[b];
        if (!lmA || !lmB) return;
        if ((lmA.v || 0) < 0.3 || (lmB.v || 0) < 0.3) return;
        ctx.beginPath();
        ctx.moveTo(lmA.x * W, lmA.y * H);
        ctx.lineTo(lmB.x * W, lmB.y * H);
        ctx.strokeStyle = gesture
          ? `${boxColor}cc`
          : 'rgba(0,212,255,0.7)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      landmarks.forEach((lm, idx) => {
        if ((lm.v || 0) < 0.3) return;
        const px = lm.x * W;
        const py = lm.y * H;
        ctx.beginPath();
        ctx.arc(px, py, idx === 0 ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = idx === 0
          ? (gesture ? boxColor : '#00d4ff')
          : (gesture ? `${boxColor}dd` : 'rgba(0,212,255,0.8)');
        ctx.fill();
      });
      ctx.restore();
    }

    const labelName = studentNames ? (studentNames[chair_rank - 1] || `Student ${chair_rank}`) : `Student ${chair_rank}`;
    const labelY = by > 40 ? by - 6 : by + bh + 18;

    ctx.save();
    const headerText = `CHAIR #${chair_rank}`;
    const nameText = labelName.toUpperCase();
    ctx.font = 'bold 11px "DM Sans", monospace';
    const hw = ctx.measureText(headerText).width;
    const nw = ctx.measureText(nameText).width + 40;
    const tagW = Math.max(hw, nw) + 20;
    const tagH = 34;
    const tagX = bx;
    const tagY = labelY - 28;

    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.beginPath();
    ctx.roundRect(tagX, tagY, tagW, tagH, 4);
    ctx.fill();

    ctx.strokeStyle = boxColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(tagX, tagY, tagW, tagH, 4);
    ctx.stroke();

    ctx.fillStyle = boxColor;
    ctx.font = 'bold 9px "DM Sans", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(headerText, tagX + 8, tagY + 12);

    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = 'bold 10px "DM Sans", monospace';
    ctx.fillText(nameText, tagX + 8, tagY + 26);
    ctx.restore();

    if (gesture) {
      const scanRef = scanAnimRef.current;
      const scanKey = `${chair_rank}`;
      if (!scanRef[scanKey]) scanRef[scanKey] = { start: now, conf: confidence || 0 };
      const elapsed = now - scanRef[scanKey].start;
      const scanProgress = Math.min(elapsed / 600, 1);

      const scanX = bx + bw * 0.1;
      const scanY = by + bh * 0.15;
      const scanW = bw * 0.8;
      const scanH = bh * 0.7;

      ctx.save();
      ctx.strokeStyle = status?.isViolation ? 'rgba(239,68,68,0.8)' : 'rgba(0,212,255,0.6)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(scanX, scanY, scanW * scanProgress, scanH * scanProgress);
      ctx.setLineDash([]);

      const scanLineY = scanY + (scanH * 0.5 * Math.sin(now / 300 + chair_rank) + scanH * 0.5);
      const grad = ctx.createLinearGradient(scanX, scanLineY - 8, scanX, scanLineY + 8);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.5, status?.isViolation ? 'rgba(239,68,68,0.5)' : 'rgba(0,212,255,0.5)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(scanX, scanLineY - 8, scanW, 16);
      ctx.restore();

      const confPct = typeof confidence === 'number' ? confidence : (confidence || 0);
      const gestLabel = fmt(gesture);
      const statusLabel = status?.label || 'Detected';

      const glX = bx + bw / 2;
      const glY = by + bh + 14;

      ctx.save();
      ctx.font = 'bold 12px "DM Sans", monospace';
      const glW = ctx.measureText(gestLabel).width + 80;
      const glH = 28;

      ctx.fillStyle = 'rgba(0,0,0,0.82)';
      ctx.beginPath();
      ctx.roundRect(glX - glW / 2, glY - 4, glW, glH, 6);
      ctx.fill();

      ctx.strokeStyle = status?.isViolation ? '#ef4444' : boxColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(glX - glW / 2, glY - 4, glW, glH, 6);
      ctx.stroke();

      ctx.fillStyle = status?.isViolation ? '#ef4444' : (status?.color || '#00d4ff');
      ctx.textAlign = 'center';
      ctx.font = 'bold 11px "DM Sans", monospace';
      ctx.fillText(gestLabel, glX - 18, glY + 13);

      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '9px monospace';
      ctx.fillText(`${confPct}%`, glX + (glW / 2) - 20, glY + 13);

      ctx.fillStyle = status?.isViolation ? '#ef4444' : '#10b981';
      ctx.font = 'bold 8px monospace';
      ctx.fillText(statusLabel.toUpperCase(), glX + (glW / 2) - 40, glY + 23);
      ctx.restore();

    } else {
      if (scanAnimRef.current[`${chair_rank}`]) {
        delete scanAnimRef.current[`${chair_rank}`];
      }
    }
  });

  const activeChairs = new Set(persons.map(p => p.chair_rank));
  ctx.save();
  ctx.font = '9px monospace';
  ctx.fillStyle = 'rgba(0,212,255,0.4)';
  ctx.textAlign = 'left';
  ctx.fillText(`CLASSSENSE AI ◆ ${persons.length} DETECTED`, 8, H - 8);
  ctx.restore();
}

export default function LiveCamera({
  sessionId,
  numSeats = 20,
  mode = 'lesson',
  onGestureDetected = null,
  timerDuration = 0,
  onTimerEnd = null,
  studentNames = [],
}) {
  const videoRef         = useRef(null);
  const canvasRef        = useRef(null);
  const overlayCanvasRef = useRef(null);
  const modalVideoRef    = useRef(null);
  const frameIntervalRef = useRef(null);
  const drawIntervalRef  = useRef(null);
  const streamRef        = useRef(null);
  const onGestureRef     = useRef(onGestureDetected);
  const timerRef         = useRef(null);
  const scanAnimRef      = useRef({});
  const prevPersonsRef   = useRef([]);

  useEffect(() => { onGestureRef.current = onGestureDetected; }, [onGestureDetected]);

  const [isRunning, setIsRunning]             = useState(false);
  const [currentGesture, setCurrentGesture]   = useState(null);
  const [isModalOpen, setIsModalOpen]         = useState(false);
  const [liveTime, setLiveTime]               = useState('');
  const [showRulesModal, setShowRulesModal]   = useState(false);
  const [pinnedChair, setPinnedChair]         = useState(null);
  const [isLocked, setIsLocked]               = useState(false);
  const [timerSeconds, setTimerSeconds]       = useState(timerDuration * 60);
  const [timerRunning, setTimerRunning]       = useState(false);
  const [timesUp, setTimesUp]                 = useState(false);
  const [violationAlert, setViolationAlert]   = useState(null);
  const [notifications, setNotifications]     = useState([]);
  const [rollCallMsg, setRollCallMsg]         = useState(null);

  const { gestures, isConnected, sendFrame, sendMessage, persons } = useGestureStream(sessionId, numSeats);

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
    if (persons && persons.length !== prevPersonsRef.current.length && isRunning) {
      const detectedChairs = new Set(persons.map(p => p.chair_rank));
      const missingChairs = [];
      for (let i = 1; i <= numSeats; i++) {
        if (!detectedChairs.has(i)) missingChairs.push(i);
      }
      if (persons.length === numSeats) {
        setRollCallMsg({ type: 'ok', text: `✅ All ${numSeats} chair ranking(s) detected` });
      } else if (persons.length > 0) {
        const missingNames = missingChairs.map(c => studentNames[c - 1] || `Student ${c}`);
        setRollCallMsg({
          type: 'warn',
          text: `⚠ ${persons.length}/${numSeats} detected — Missing: ${missingNames.join(', ')}`,
        });
      }
      prevPersonsRef.current = persons;
    }
  }, [persons, numSeats, studentNames, isRunning]);

  useEffect(() => {
    if (rollCallMsg) {
      const t = setTimeout(() => setRollCallMsg(null), 5000);
      return () => clearTimeout(t);
    }
  }, [rollCallMsg]);

  useEffect(() => {
    if (gestures.length > 0) {
      const latest = gestures[0];
      setCurrentGesture(latest);
      if (onGestureRef.current) onGestureRef.current(latest);

      const status = getGestureStatus(latest.gesture, mode);

      if (status.isViolation || latest.is_alert) {
        const studentName = latest.student_name || `Student ${latest.chair_rank || 1}`;
        const chairRank   = latest.chair_rank || 1;
        const timeStr     = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const modeLabel   = (mode || 'lecture').charAt(0).toUpperCase() + (mode || 'lecture').slice(1);

        const newNotif = {
          studentName,
          chairRank,
          gesture:     latest.gesture,
          mode:        modeLabel,
          time:        timeStr,
          isViolation: true,
          read:        false,
        };

        setViolationAlert({ studentName, chairRank, gesture: latest.gesture, mode: modeLabel, time: timeStr });
        setNotifications(prev => [newNotif, ...prev.slice(0, 49)]);
        playAmbulanceSound();
      } else {
        playTingSound();
      }
    }
  }, [gestures, mode]);

  useEffect(() => {
    if (!isConnected) return;
    sendMessage({ type: 'config', num_seats: numSeats, session_id: sessionId, pinned_chair: pinnedChair });
  }, [isConnected, numSeats, sessionId]);

  useEffect(() => {
    if (!isConnected) return;
    sendMessage({ type: 'pin_chair', chair_rank: pinnedChair });
  }, [pinnedChair, isConnected]);

  useEffect(() => {
    if (!isConnected) return;
    sendMessage({ type: 'lock_detection', locked: isLocked });
  }, [isLocked, isConnected]);

  useEffect(() => {
    if (!timerRunning) return;
    timerRef.current = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setTimerRunning(false);
          setTimesUp(true);
          setIsLocked(true);
          playAmbulanceSound();
          if (onTimerEnd) onTimerEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  const captureAndSendFrame = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    sendFrame(canvas.toDataURL('image/jpeg', 0.7));
  }, [sendFrame]);

  const drawOverlay = useCallback(() => {
    const video  = videoRef.current;
    const canvas = overlayCanvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    const rect = video.getBoundingClientRect();
    if (canvas.width !== Math.round(rect.width) || canvas.height !== Math.round(rect.height)) {
      canvas.width  = Math.round(rect.width)  || video.videoWidth  || 640;
      canvas.height = Math.round(rect.height) || video.videoHeight || 480;
    }

    const detectedChairs = new Set((persons || []).map(p => p.chair_rank));
    const missingChairs  = [];
    for (let i = 1; i <= numSeats; i++) {
      if (!detectedChairs.has(i)) missingChairs.push(i);
    }

    drawCIAOverlay(canvas, video, persons || [], missingChairs, studentNames, mode, scanAnimRef);
  }, [persons, numSeats, studentNames, mode]);

  const startCamera = useCallback(async () => {
    setShowRulesModal(true);
  }, []);

  const doStartCamera = useCallback(async () => {
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
      if (timerDuration > 0) {
        setTimerSeconds(timerDuration * 60);
        setTimerRunning(true);
      }
    } catch {
      alert('Could not access camera. Please check permissions.');
    }
  }, [timerDuration]);

  const stopCamera = useCallback(() => {
    if (frameIntervalRef.current) { clearInterval(frameIntervalRef.current); frameIntervalRef.current = null; }
    if (drawIntervalRef.current)  { clearInterval(drawIntervalRef.current);  drawIntervalRef.current  = null; }
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current)      videoRef.current.srcObject = null;
    if (modalVideoRef.current) modalVideoRef.current.srcObject = null;
    const oc = overlayCanvasRef.current;
    if (oc) oc.getContext('2d').clearRect(0, 0, oc.width, oc.height);
    setIsRunning(false);
    setTimerRunning(false);
    setCurrentGesture(null);
    setRollCallMsg(null);
  }, []);

  useEffect(() => {
    if (isRunning) {
      frameIntervalRef.current = setInterval(captureAndSendFrame, 300);
      drawIntervalRef.current  = setInterval(drawOverlay, 60);
    } else {
      if (frameIntervalRef.current) { clearInterval(frameIntervalRef.current); frameIntervalRef.current = null; }
      if (drawIntervalRef.current)  { clearInterval(drawIntervalRef.current);  drawIntervalRef.current  = null; }
    }
    return () => {
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
      if (drawIntervalRef.current)  clearInterval(drawIntervalRef.current);
    };
  }, [isRunning, captureAndSendFrame, drawOverlay]);

  useEffect(() => { return () => stopCamera(); }, [stopCamera]);

  useEffect(() => {
    if (isModalOpen && streamRef.current && modalVideoRef.current) {
      modalVideoRef.current.srcObject = streamRef.current;
      modalVideoRef.current.play().catch(() => {});
    }
  }, [isModalOpen]);

  const handlePinChair = (rank) => setPinnedChair(prev => prev === rank ? null : rank);

  const timerPct    = timerDuration > 0 ? (timerSeconds / (timerDuration * 60)) * 100 : 100;
  const timerColor  = timerPct > 50 ? '#10b981' : timerPct > 20 ? '#f59e0b' : '#ef4444';
  const statusInfo  = currentGesture ? getGestureStatus(currentGesture.gesture, mode) : null;
  const aiStatusColor = isConnected ? '#10b981' : '#ef4444';
  const aiStatusText  = isConnected ? 'AI Monitoring Active' : 'Not Connected';
  const modeLabel     = (mode || 'lesson').charAt(0).toUpperCase() + (mode || 'lesson').slice(1);

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
        .lc-overlay-canvas {
          position:absolute; top:0; left:0; width:100%; height:100%;
          pointer-events:none; z-index:2;
        }
        .lc-overlay-top {
          position:absolute; top:0; left:0; right:0; padding:10px 12px;
          display:flex; align-items:center; justify-content:space-between; gap:8px;
          background:linear-gradient(180deg,rgba(0,0,0,0.65) 0%,transparent 100%);
          z-index:3;
        }
        .lc-live-badge {
          display:flex; align-items:center; gap:6px;
          background:rgba(239,68,68,0.9); backdrop-filter:blur(6px);
          color:white; padding:4px 10px; border-radius:20px;
          font-weight:700; font-size:11px; letter-spacing:0.5px;
          border:1px solid rgba(255,255,255,0.15); flex-shrink:0;
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
          flex-shrink:0;
        }
        .lc-ai-dot { width:6px; height:6px; border-radius:50%; }
        .lc-timer-overlay {
          position:absolute; top:10px; left:50%; transform:translateX(-50%);
          background:rgba(0,0,0,0.7); backdrop-filter:blur(8px);
          border-radius:20px; padding:5px 14px;
          display:flex; align-items:center; gap:8px;
          border:1px solid rgba(255,255,255,0.1); z-index:3;
        }
        .lc-timer-text { font-size:14px; font-weight:700; font-variant-numeric:tabular-nums; }
        .lc-overlay-bottom {
          position:absolute; bottom:0; left:0; right:0; padding:10px 12px;
          display:flex; align-items:flex-end; justify-content:space-between;
          background:linear-gradient(0deg,rgba(0,0,0,0.65) 0%,transparent 100%);
          z-index:3;
        }
        .lc-gesture-chip {
          color:white; padding:5px 12px; border-radius:8px;
          font-weight:700; font-size:12px; backdrop-filter:blur(6px);
          border:1px solid rgba(255,255,255,0.15);
        }
        .lc-conf-badge {
          font-size:10px; font-weight:600; padding:2px 7px; border-radius:6px;
          background:rgba(255,255,255,0.2); margin-left:6px;
        }
        .lc-time {
          background:rgba(0,0,0,0.5); backdrop-filter:blur(6px);
          color:rgba(255,255,255,0.9); padding:4px 10px; border-radius:6px;
          font-size:11px; font-weight:700; font-variant-numeric:tabular-nums;
          border:1px solid rgba(255,255,255,0.08);
        }
        .lc-expand-hint {
          position:absolute; bottom:48px; left:50%; transform:translateX(-50%);
          background:rgba(0,0,0,0.4); backdrop-filter:blur(6px);
          color:rgba(255,255,255,0.4); font-size:10px;
          padding:3px 10px; border-radius:20px; pointer-events:none;
          border:1px solid rgba(255,255,255,0.08); z-index:3;
        }
        .lc-rollcall-banner {
          position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
          z-index:10; text-align:center; pointer-events:none;
          animation:lc-rollcall-in 0.4s cubic-bezier(0.34,1.56,0.64,1);
        }
        .lc-rollcall-inner {
          background:rgba(0,0,0,0.82); backdrop-filter:blur(12px);
          border-radius:12px; padding:14px 22px;
          border:1px solid rgba(0,212,255,0.4);
          box-shadow:0 0 30px rgba(0,212,255,0.2);
          font-size:13px; font-weight:700; color:white;
          letter-spacing:0.2px;
        }
        .lc-timesup-banner {
          position:absolute; inset:0; display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          background:rgba(239,68,68,0.85); backdrop-filter:blur(4px);
          z-index:10;
        }
        .lc-timesup-title { font-size:36px; font-weight:700; color:white; letter-spacing:-1px; margin-bottom:8px; }
        .lc-timesup-sub { font-size:14px; color:rgba(255,255,255,0.8); font-weight:500; }
        .lc-controls { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
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
        .lc-lock-btn {
          display:flex; align-items:center; gap:6px;
          padding:8px 14px; border-radius:9px; border:none;
          font-size:11px; font-weight:700; cursor:pointer;
          font-family:'DM Sans','Segoe UI',sans-serif; transition:all 0.18s ease;
        }
        .lc-lock-btn.unlocked { background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.3); color:#f59e0b; }
        .lc-lock-btn.locked { background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); color:#ef4444; }
        .lc-conn-badge {
          display:flex; align-items:center; gap:6px; padding:7px 12px;
          background:rgba(255,255,255,0.65); backdrop-filter:blur(12px);
          border:1px solid rgba(255,255,255,0.4); border-radius:8px;
          font-size:12px; font-weight:600; box-shadow:0 2px 10px rgba(0,0,0,0.07);
        }
        .lc-conn-dot { width:7px; height:7px; border-radius:50%; }
        .lc-chair-panel {
          background:rgba(255,255,255,0.65); backdrop-filter:blur(14px);
          border:1px solid rgba(255,255,255,0.45); border-radius:14px;
          padding:14px; box-shadow:0 4px 20px rgba(0,0,0,0.07);
        }
        .lc-chair-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
        .lc-chair-title { font-size:12px; font-weight:700; color:#0f172a; }
        .lc-chair-hint { font-size:10px; color:#94a3b8; font-weight:500; }
        .lc-chair-grid { display:flex; flex-wrap:wrap; gap:6px; }
        .lc-chair-btn {
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          width:44px; height:44px; border-radius:9px; border:none; cursor:pointer;
          font-size:11px; font-weight:700; transition:all 0.18s ease;
          font-family:'DM Sans','Segoe UI',sans-serif; position:relative;
        }
        .lc-chair-btn.auto { background:rgba(248,250,252,0.8); color:#64748b; border:1px solid rgba(0,0,0,0.08); }
        .lc-chair-btn.auto:hover { background:rgba(59,130,246,0.08); color:#3b82f6; border-color:rgba(59,130,246,0.2); }
        .lc-chair-btn.pinned { background:linear-gradient(135deg,#3b82f6,#2563eb); color:white; box-shadow:0 3px 10px rgba(59,130,246,0.35); }
        .lc-chair-pin-dot {
          position:absolute; top:3px; right:3px;
          width:6px; height:6px; border-radius:50%; background:#10b981;
          box-shadow:0 0 6px #10b981;
        }
        .lc-zone-bar {
          display:flex; height:8px; border-radius:4px; overflow:hidden; margin-top:8px;
          border:1px solid rgba(0,0,0,0.06);
        }
        .lc-zone-seg { flex:1; transition:background 0.3s ease; }
        .lc-alerts-card {
          background:rgba(255,255,255,0.65); backdrop-filter:blur(14px);
          border:1px solid rgba(255,255,255,0.45); border-radius:14px;
          padding:14px; box-shadow:0 4px 20px rgba(0,0,0,0.07);
        }
        .lc-alerts-header { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
        .lc-alerts-title { font-size:12px; font-weight:700; color:#0f172a; }
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
        .lc-alert-left { display:flex; flex-direction:column; gap:2px; }
        .lc-alert-info { font-size:12px; color:#334155; font-weight:600; }
        .lc-alert-meta { font-size:10px; color:#94a3b8; display:flex; gap:6px; align-items:center; }
        .lc-alert-conf { font-size:10px; font-weight:700; padding:1px 6px; border-radius:4px; }
        .lc-alert-time { font-size:10px; color:#94a3b8; flex-shrink:0; }
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
        @keyframes lc-timesup-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        @keyframes lc-rollcall-in {
          from{opacity:0;transform:translate(-50%,-50%) scale(0.85)}
          to{opacity:1;transform:translate(-50%,-50%) scale(1)}
        }
      `}</style>

      {showRulesModal && (
        <ActivityRulesModal
          mode={modeLabel}
          onConfirm={() => { setShowRulesModal(false); doStartCamera(); }}
        />
      )}

      <ViolationModal
        violation={violationAlert}
        mode={mode}
        onDismiss={() => {
          setViolationAlert(null);
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        }}
      />

      <div className="lc-container">
        <div className="lc-video-wrap" onClick={() => setIsModalOpen(true)}>
          <video ref={videoRef} autoPlay playsInline muted className="lc-video" />

          <canvas ref={overlayCanvasRef} className="lc-overlay-canvas" />

          {timesUp && (
            <div className="lc-timesup-banner" style={{ animation: 'lc-timesup-pulse 1s ease-in-out infinite' }}>
              <div className="lc-timesup-title">⏰ Time's Up!</div>
              <div className="lc-timesup-sub">Gesture detection is now locked. You can still view the camera.</div>
            </div>
          )}

          {rollCallMsg && !timesUp && (
            <div className="lc-rollcall-banner">
              <div className="lc-rollcall-inner" style={{
                borderColor: rollCallMsg.type === 'ok' ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)',
                boxShadow: rollCallMsg.type === 'ok' ? '0 0 30px rgba(16,185,129,0.2)' : '0 0 30px rgba(239,68,68,0.2)',
              }}>
                {rollCallMsg.text}
              </div>
            </div>
          )}

          <div className="lc-overlay-top">
            {isRunning
              ? <div className="lc-live-badge"><span className="lc-live-dot" />LIVE</div>
              : <div className="lc-camera-off-badge">Camera Off</div>
            }
            {timerDuration > 0 && isRunning && (
              <div className="lc-timer-overlay">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={timerColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <span className="lc-timer-text" style={{ color: timerColor }}>{formatTime(timerSeconds)}</span>
                {isLocked && !timesUp && (
                  <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 700 }}>LOCKED</span>
                )}
              </div>
            )}
            <div className="lc-ai-badge">
              <div className="lc-ai-dot" style={{ background: aiStatusColor, boxShadow: `0 0 6px ${aiStatusColor}` }} />
              {isLocked ? 'Detection Locked' : aiStatusText}
              {persons && persons.length > 0 && (
                <span style={{ marginLeft: 6, background: 'rgba(0,212,255,0.2)', color: '#00d4ff', borderRadius: 10, padding: '1px 6px', fontSize: 9, fontWeight: 700 }}>
                  {persons.length} DETECTED
                </span>
              )}
            </div>
          </div>

          {!timesUp && <div className="lc-expand-hint">Click to expand</div>}

          <div className="lc-overlay-bottom">
            {currentGesture && statusInfo && (
              <div className="lc-gesture-chip" style={{ background: statusInfo.bg }}>
                {statusInfo.isViolation && '🚨 '}{fmt(currentGesture.gesture)} — {statusInfo.label}
                {currentGesture.confidence !== undefined && (
                  <span className="lc-conf-badge">{currentGesture.confidence}%</span>
                )}
              </div>
            )}
            <div className="lc-time">{liveTime}</div>
          </div>
        </div>

        {timerDuration > 0 && isRunning && (
          <div style={{ height: 6, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 4,
              background: `linear-gradient(90deg, ${timerColor}, ${timerColor}cc)`,
              width: `${timerPct}%`,
              transition: 'width 1s linear, background 0.3s ease',
              boxShadow: `0 0 8px ${timerColor}66`,
            }} />
          </div>
        )}

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

          {isRunning && (
            <button
              className={`lc-lock-btn ${isLocked ? 'locked' : 'unlocked'}`}
              onClick={() => setIsLocked(v => !v)}
            >
              {isLocked
                ? <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Unlock Detection</>
                : <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>Lock Detection</>
              }
            </button>
          )}

          <div className="lc-conn-badge">
            <div className="lc-conn-dot" style={{ background: isConnected ? '#10b981' : '#ef4444', boxShadow: isConnected ? '0 0 6px #10b981' : 'none' }} />
            <span style={{ color: isConnected ? '#065f46' : '#991b1b' }}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <NotificationBell
            notifications={notifications}
            onClear={() => setNotifications([])}
          />

          {pinnedChair !== null && (
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px', background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.25)', borderRadius:8, fontSize:11, fontWeight:700, color:'#3b82f6' }}>
              📌 Monitoring Chair #{pinnedChair}
              <button onClick={() => setPinnedChair(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:14, padding:0, lineHeight:1 }}>×</button>
            </div>
          )}
        </div>

        <div className="lc-chair-panel">
          <div className="lc-chair-header">
            <div>
              <div className="lc-chair-title">Chair Monitor Panel</div>
              <div className="lc-chair-hint">
                {pinnedChair ? `📌 Pinned to Chair #${pinnedChair} — click to unpin` : 'Auto zone detection active — click a chair to pin'}
              </div>
            </div>
            {pinnedChair !== null && (
              <button
                onClick={() => setPinnedChair(null)}
                style={{ fontSize:11, fontWeight:700, color:'#94a3b8', background:'rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:7, padding:'4px 10px', cursor:'pointer' }}
              >
                Clear Pin
              </button>
            )}
          </div>
          <div className="lc-chair-grid">
            {Array.from({ length: numSeats }, (_, i) => i + 1).map(rank => {
              const isPinned   = pinnedChair === rank;
              const recentGesture = gestures.find(g => g.chair_rank === rank);
              const hasViolation  = recentGesture && getGestureStatus(recentGesture.gesture, mode).isViolation;
              const isDetected    = persons && persons.some(p => p.chair_rank === rank);
              return (
                <button
                  key={rank}
                  className={`lc-chair-btn ${isPinned ? 'pinned' : 'auto'}`}
                  onClick={() => handlePinChair(rank)}
                  title={`Chair #${rank}${studentNames[rank-1] ? ` — ${studentNames[rank-1]}` : ''}${recentGesture ? ` — ${recentGesture.gesture}` : ''}`}
                  style={hasViolation ? { border: '2px solid #ef4444', background: isPinned ? undefined : 'rgba(239,68,68,0.08)' }
                    : isDetected ? { border: '1px solid rgba(0,212,255,0.4)', background: isPinned ? undefined : 'rgba(0,212,255,0.06)' }
                    : {}}
                >
                  {isPinned && <span className="lc-chair-pin-dot" />}
                  {hasViolation && !isPinned && (
                    <span style={{ position:'absolute', top:2, left:2, fontSize:8 }}>🚨</span>
                  )}
                  {isDetected && !isPinned && !hasViolation && (
                    <span style={{ position:'absolute', top:2, left:2, width:5, height:5, borderRadius:'50%', background:'#00d4ff', boxShadow:'0 0 4px #00d4ff' }} />
                  )}
                  <span style={{ fontSize: 9, opacity: 0.6, lineHeight: 1 }}>Ch</span>
                  <span style={{ fontSize: 13, lineHeight: 1 }}>{rank}</span>
                  {recentGesture && (
                    <span style={{ fontSize: 7, opacity: 0.7, lineHeight: 1 }}>
                      {recentGesture.gesture?.slice(0, 4)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="lc-zone-bar" style={{ marginTop: 10 }}>
            {Array.from({ length: numSeats }, (_, i) => i + 1).map(rank => {
              const isActive     = gestures.some(g => g.chair_rank === rank);
              const isPinned     = pinnedChair === rank;
              const hasViolation = gestures.some(g => g.chair_rank === rank && getGestureStatus(g.gesture, mode).isViolation);
              const isDetected   = persons && persons.some(p => p.chair_rank === rank);
              return (
                <div
                  key={rank}
                  className="lc-zone-seg"
                  style={{
                    background: hasViolation ? '#ef4444' : isPinned ? '#3b82f6' : isActive ? '#10b981' : isDetected ? 'rgba(0,212,255,0.4)' : 'rgba(0,0,0,0.06)',
                    borderRight: '1px solid rgba(255,255,255,0.3)',
                  }}
                />
              );
            })}
          </div>
          <div style={{ display:'flex', gap:16, marginTop:6, fontSize:10, color:'#94a3b8', fontWeight:600, flexWrap:'wrap' }}>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:8, height:8, borderRadius:2, background:'#10b981', display:'inline-block' }} />Active</span>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:8, height:8, borderRadius:2, background:'#3b82f6', display:'inline-block' }} />Pinned</span>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:8, height:8, borderRadius:2, background:'#ef4444', display:'inline-block' }} />Violation</span>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:8, height:8, borderRadius:2, background:'rgba(0,212,255,0.5)', display:'inline-block' }} />Detected</span>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:8, height:8, borderRadius:2, background:'rgba(0,0,0,0.1)', display:'inline-block' }} />Idle</span>
          </div>
        </div>

        <div className="lc-alerts-card">
          <div className="lc-alerts-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="lc-alerts-title">Recent Detections</span>
            {gestures.length > 0 && <span className="lc-alerts-count">{gestures.length}</span>}
          </div>
          {gestures.length === 0 ? (
            <div className="lc-no-alerts">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(148,163,184,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              No gestures detected yet
            </div>
          ) : (
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {gestures.slice(0, 10).map((g, i) => {
                const info         = getGestureStatus(g.gesture, mode);
                const ts           = g.time || liveTime;
                const conf         = g.confidence !== undefined ? `${g.confidence}%` : null;
                const studentLabel = g.student_name || (studentNames[g.chair_rank - 1]) || `Student ${g.chair_rank || 1}`;
                return (
                  <div key={i} className="lc-alert-item" style={{
                    borderLeftColor: info.color,
                    background: info.isViolation ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.5)',
                  }}>
                    <div className="lc-alert-left">
                      <span className="lc-alert-info">
                        {info.isViolation && '🚨 '}{studentLabel} — Chair #{g.chair_rank || 1} — {fmt(g.gesture)}
                      </span>
                      <div className="lc-alert-meta">
                        <span style={{ color: info.color, fontWeight: 700, fontSize: 10 }}>{info.label}</span>
                        {info.isViolation && (
                          <span style={{ color: '#ef4444', fontSize: 10, fontWeight: 600 }}>
                            · {fmt(g.gesture)} not allowed during {(mode||'').charAt(0).toUpperCase()+(mode||'').slice(1)}
                          </span>
                        )}
                        {conf && (
                          <span className="lc-alert-conf" style={{ background: `${info.color}22`, color: info.color }}>
                            {conf}
                          </span>
                        )}
                      </div>
                    </div>
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
                    {statusInfo.isViolation && '🚨 '}{fmt(currentGesture.gesture)} — Seat {currentGesture.chair_rank || 1}
                    {currentGesture.confidence !== undefined && (
                      <span className="lc-conf-badge">{currentGesture.confidence}%</span>
                    )}
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