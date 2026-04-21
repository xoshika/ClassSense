import { useState } from "react";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    if (!email || !password) { setError("Please fill in all fields"); return false; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setError("Please enter a valid email address"); return false; }
    if (password.length < 4) { setError("Password must be at least 4 characters"); return false; }
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateForm()) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => { setSuccess(false); if (onLogin) onLogin(); }, 1500);
      } else {
        setError(data.error || "Invalid email or password.");
      }
    } catch {
      setError("Cannot connect to server. Make sure Django is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');

        .login-root {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f2744 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', 'Segoe UI', sans-serif;
          position: relative;
          overflow: hidden;
        }
        .login-blob-1 {
          position: absolute;
          top: -120px;
          left: -120px;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .login-blob-2 {
          position: absolute;
          bottom: -80px;
          right: -80px;
          width: 350px;
          height: 350px;
          background: radial-gradient(circle, rgba(96,165,250,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .login-card {
          display: flex;
          width: 820px;
          max-width: 95vw;
          min-height: 480px;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08);
          position: relative;
          z-index: 1;
        }
        .login-left {
          flex: 1;
          background: linear-gradient(145deg, #1e40af 0%, #1d4ed8 40%, #2563eb 100%);
          padding: 48px 40px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }
        .login-left::before {
          content: '';
          position: absolute;
          top: -60px;
          right: -60px;
          width: 240px;
          height: 240px;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
          pointer-events: none;
        }
        .login-left::after {
          content: '';
          position: absolute;
          bottom: -40px;
          left: -40px;
          width: 180px;
          height: 180px;
          background: radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 60%);
          pointer-events: none;
        }
        .login-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .login-brand-icon {
          width: 44px;
          height: 44px;
          background: rgba(255,255,255,0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.25);
        }
        .login-brand-name {
          font-size: 22px;
          font-weight: 700;
          color: white;
          letter-spacing: -0.4px;
        }
        .login-hero {
          position: relative;
          z-index: 1;
        }
        .login-hero-title {
          font-size: 28px;
          font-weight: 700;
          color: white;
          line-height: 1.25;
          margin-bottom: 14px;
          letter-spacing: -0.5px;
        }
        .login-hero-desc {
          font-size: 14px;
          color: rgba(219,234,254,0.85);
          line-height: 1.6;
        }
        .login-features {
          display: flex;
          flex-direction: column;
          gap: 10px;
          position: relative;
          z-index: 1;
        }
        .login-feature-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: rgba(219,234,254,0.9);
        }
        .login-feature-dot {
          width: 22px;
          height: 22px;
          background: rgba(255,255,255,0.15);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .login-right {
          width: 380px;
          background: rgba(15,23,42,0.92);
          backdrop-filter: blur(20px);
          border-left: 1px solid rgba(255,255,255,0.07);
          padding: 48px 40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .login-right-title {
          font-size: 22px;
          font-weight: 700;
          color: #f0f9ff;
          margin-bottom: 6px;
          letter-spacing: -0.4px;
        }
        .login-right-sub {
          font-size: 13px;
          color: rgba(148,163,184,0.8);
          margin-bottom: 32px;
        }
        .login-form-group {
          margin-bottom: 18px;
        }
        .login-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: rgba(186,210,235,0.9);
          margin-bottom: 7px;
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }
        .login-input {
          width: 100%;
          padding: 11px 14px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          font-size: 14px;
          color: #e0f2fe;
          font-family: 'DM Sans', 'Segoe UI', sans-serif;
          transition: all 0.18s ease;
          box-sizing: border-box;
          outline: none;
        }
        .login-input::placeholder { color: rgba(148,163,184,0.5); }
        .login-input:focus {
          border-color: rgba(59,130,246,0.6);
          background: rgba(59,130,246,0.08);
          box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
        }
        .login-input-wrap {
          position: relative;
        }
        .login-show-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(148,163,184,0.7);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          padding: 2px 4px;
          font-family: 'DM Sans', 'Segoe UI', sans-serif;
          letter-spacing: 0.3px;
        }
        .login-show-btn:hover { color: #60a5fa; }
        .login-remember {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 24px;
        }
        .login-checkbox {
          width: 15px;
          height: 15px;
          accent-color: #3b82f6;
          cursor: pointer;
        }
        .login-remember-label {
          font-size: 13px;
          color: rgba(148,163,184,0.8);
          cursor: pointer;
        }
        .login-submit-btn {
          width: 100%;
          padding: 13px;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'DM Sans', 'Segoe UI', sans-serif;
          letter-spacing: 0.2px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .login-submit-btn.default {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          box-shadow: 0 4px 16px rgba(59,130,246,0.35);
        }
        .login-submit-btn.default:hover {
          background: linear-gradient(135deg, #60a5fa, #3b82f6);
          box-shadow: 0 6px 20px rgba(59,130,246,0.45);
          transform: translateY(-1px);
        }
        .login-submit-btn.loading { background: rgba(148,163,184,0.2); color: rgba(148,163,184,0.6); cursor: not-allowed; }
        .login-submit-btn.success { background: linear-gradient(135deg, #10b981, #059669); color: white; }
        .login-error {
          margin-bottom: 16px;
          padding: 10px 14px;
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 8px;
          font-size: 13px;
          color: #fca5a5;
        }
        .login-success-msg {
          margin-bottom: 16px;
          padding: 10px 14px;
          background: rgba(16,185,129,0.12);
          border: 1px solid rgba(16,185,129,0.25);
          border-radius: 8px;
          font-size: 13px;
          color: #6ee7b7;
        }
        .login-hint {
          margin-top: 20px;
          text-align: center;
          font-size: 11px;
          color: rgba(100,116,139,0.7);
        }
        .login-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 700px) {
          .login-left { display: none; }
          .login-right { width: 100%; }
        }
      `}</style>

      <div className="login-root">
        <div className="login-blob-1" />
        <div className="login-blob-2" />
        <div className="login-card">
          <div className="login-left">
            <div className="login-brand">
              <div className="login-brand-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <div className="login-brand-name">ClassSense</div>
            </div>

            <div className="login-hero">
              <div className="login-hero-title">AI-Powered Classroom Intelligence</div>
              <div className="login-hero-desc">Real-time gesture monitoring and behavioral analytics for modern educators.</div>
            </div>

            <div className="login-features">
              {["Real-time ML gesture tracking", "Live classroom monitoring", "Behavioral analytics dashboard"].map(f => (
                <div key={f} className="login-feature-item">
                  <div className="login-feature-dot">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(219,234,254,0.9)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  {f}
                </div>
              ))}
            </div>
          </div>

          <div className="login-right">
            <div className="login-right-title">Welcome back</div>
            <div className="login-right-sub">Sign in to your admin account</div>

            {error && <div className="login-error">{error}</div>}
            {success && <div className="login-success-msg">Login successful! Redirecting...</div>}

            <form onSubmit={handleLogin}>
              <div className="login-form-group">
                <label className="login-label">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@classsense.com"
                  className="login-input"
                  disabled={loading}
                />
              </div>

              <div className="login-form-group">
                <label className="login-label">Password</label>
                <div className="login-input-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="login-input"
                    disabled={loading}
                    style={{ paddingRight: 52 }}
                  />
                  <button type="button" className="login-show-btn" onClick={() => setShowPassword(!showPassword)} disabled={loading}>
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="login-remember">
                <input type="checkbox" id="rem" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="login-checkbox" disabled={loading} />
                <label htmlFor="rem" className="login-remember-label">Remember me</label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`login-submit-btn ${loading ? "loading" : success ? "success" : "default"}`}
              >
                {loading ? (
                  <><div className="login-spinner" />Signing in...</>
                ) : success ? (
                  "Signed in successfully"
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="login-hint">Default: admin@classsense.com / admin123</div>
          </div>
        </div>
      </div>
    </>
  );
}