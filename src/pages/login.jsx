import { useForm } from "react-hook-form"
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import { login } from "../store/slices/authSlice.js";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router";

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

  const onSubmit = async (data) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/users/login`, data)
      toast.success(response.data.message, { position: "top-right", autoClose: 3000, theme: "dark" })
      dispatch(login({
        user: response.data.user,
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
        isAuthenticated: true,
      }))
      navigate('/user/profile')
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed", { position: "top-right", autoClose: 4000, theme: "dark" })
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&family=Syne:wght@700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; }

        .login-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: 'DM Sans', sans-serif;
          background: #080c10;
          color: #e8edf2;
        }
        @media (max-width: 768px) {
          .login-root { grid-template-columns: 1fr; }
          .login-left  { display: none; }
        }

        /* ── LEFT PANEL ── */
        .login-left {
          position: relative;
          background: #0a0f14;
          border-right: 1px solid #1e2a3a;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 3rem;
          overflow: hidden;
        }
        .dot-bg {
          background-image: radial-gradient(circle, #1e2a3a 1px, transparent 1px);
          background-size: 28px 28px;
        }
        .glow-blob {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }

        /* ── RIGHT PANEL ── */
        .login-right {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 3rem 2rem;
          background: #080c10;
        }
        .form-box {
          width: 100%;
          max-width: 400px;
        }

        /* ── INPUTS ── */
        .field-label {
          display: block;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 8px;
        }
        .field-input {
          width: 100%;
          background: #0d1117;
          border: 1px solid #1e2a3a;
          border-radius: 10px;
          padding: 12px 16px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #e8edf2;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .field-input::placeholder { color: #334155; }
        .field-input:focus {
          border-color: #00ff94;
          box-shadow: 0 0 0 3px rgba(0,255,148,0.1);
        }
        .field-input.error-input { border-color: #f87171; }
        .error-msg {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: #f87171;
          margin-top: 6px;
        }

        /* ── BUTTON ── */
        .btn-submit {
          width: 100%;
          background: #00ff94;
          color: #080c10;
          font-family: 'DM Sans', sans-serif;
          font-weight: 700;
          font-size: 15px;
          padding: 13px;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }
        .btn-submit:hover:not(:disabled) {
          background: #00e882;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(0,255,148,0.3);
        }
        .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ── DIVIDER ── */
        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #1e2a3a;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #1e2a3a;
        }

        /* ── ANIMATIONS ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s ease both; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          width: 16px; height: 16px;
          border: 2px solid #08100c;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
          vertical-align: middle;
          margin-right: 8px;
        }

        /* ── LEFT PANEL CARD ── */
        .feature-card {
          background: #111827;
          border: 1px solid #1e2a3a;
          border-radius: 14px;
          padding: 1.25rem;
          margin-bottom: 12px;
          display: flex;
          align-items: flex-start;
          gap: 14px;
          transition: border-color 0.2s;
        }
        .feature-card:hover { border-color: #00ff9440; }
        .feature-icon {
          width: 36px; height: 36px;
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
      `}</style>

      <div className="login-root">

        {/* ── LEFT: Branding panel ── */}
        <div className="login-left dot-bg">
          <div className="glow-blob" style={{ top: '-80px', left: '-80px', width: 320, height: 320, background: 'radial-gradient(circle, rgba(0,255,148,0.07) 0%, transparent 70%)' }} />
          <div className="glow-blob" style={{ bottom: '-60px', right: '-60px', width: 260, height: 260, background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)' }} />

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
            <div style={{ width: 36, height: 36, background: '#00ff94', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#080c10', fontWeight: 800, fontSize: 18, fontFamily: 'Syne, sans-serif' }}>W</span>
            </div>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: '#e8edf2' }}>WeekWins</span>
          </div>

          {/* Middle content */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#00ff94', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '1rem' }}>
              Sprint-driven teams ship faster
            </div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)', fontWeight: 800, lineHeight: 1.2, marginBottom: '2rem', color: '#e8edf2' }}>
              Win the week.<br />
              <span style={{ color: '#94a3b8' }}>Ship the product.</span>
            </h2>

            {[
              { icon: '⬡', bg: '#00ff9415', label: 'Orgs & Projects', desc: 'Organise all your work under one roof' },
              { icon: '◎', bg: '#00d4ff15', label: 'Sprint Planning', desc: 'Time-box goals your team will actually finish' },
              { icon: '▣', bg: '#a78bfa15', label: 'Task Assignment', desc: 'Every task has an owner and a deadline' },
            ].map((f, i) => (
              <div className="feature-card" key={f.label} style={{ animationDelay: `${i * 80}ms` }}>
                <div className="feature-icon" style={{ background: f.bg }}>{f.icon}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#e8edf2', marginBottom: 3 }}>{f.label}</div>
                  <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom quote */}
          <div style={{ position: 'relative', zIndex: 1, borderTop: '1px solid #1e2a3a', paddingTop: '1.5rem' }}>
            <p style={{ color: '#475569', fontSize: 13, lineHeight: 1.6, fontStyle: 'italic' }}>
              "If you don't win the week, you're already losing the year."
            </p>
          </div>
        </div>

        {/* ── RIGHT: Form panel ── */}
        <div className="login-right">
          <div className="form-box">

            {/* Header */}
            <div className="fade-up" style={{ marginBottom: '2.5rem', animationDelay: '0ms' }}>
              {/* Mobile logo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '2rem' }} className="mobile-logo">
                <div style={{ width: 30, height: 30, background: '#00ff94', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#080c10', fontWeight: 800, fontSize: 15, fontFamily: 'Syne, sans-serif' }}>W</span>
                </div>
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#e8edf2' }}>WeekWins</span>
              </div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#e8edf2', marginBottom: '0.5rem' }}>
                Welcome back
              </h1>
              <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>
                Sign in to your workspace and pick up where you left off.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate>

              {/* Email */}
              <div className="fade-up" style={{ marginBottom: '1.25rem', animationDelay: '80ms' }}>
                <label className="field-label" htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  className={`field-input ${errors.email ? 'error-input' : ''}`}
                  {...register("email", {
                    required: "Email is required",
                    pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email" }
                  })}
                />
                {errors.email && <p className="error-msg">⚠ {errors.email.message}</p>}
              </div>

              {/* Password */}
              <div className="fade-up" style={{ marginBottom: '1.75rem', animationDelay: '140ms' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label className="field-label" htmlFor="password" style={{ marginBottom: 0 }}>Password</label>
                  <a href="#" style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#00ff94', textDecoration: 'none', letterSpacing: '0.05em' }}
                    onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                    onMouseLeave={e => e.target.style.textDecoration = 'none'}
                  >Forgot?</a>
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`field-input ${errors.password ? 'error-input' : ''}`}
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 6, message: "At least 6 characters" }
                  })}
                />
                {errors.password && <p className="error-msg">⚠ {errors.password.message}</p>}
              </div>

              {/* Submit */}
              <div className="fade-up" style={{ animationDelay: '200ms' }}>
                <button type="submit" className="btn-submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? <><span className="spinner" />Signing in…</>
                    : 'Sign in →'
                  }
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="fade-up divider" style={{ margin: '1.75rem 0', animationDelay: '260ms', color: '#334155', fontSize: 11, letterSpacing: '0.08em' }}>
              or
            </div>

            {/* Sign up link */}
            <div className="fade-up" style={{ textAlign: 'center', animationDelay: '300ms' }}>
              <p style={{ color: '#64748b', fontSize: 14 }}>
                Don't have an account?{' '}
                <a href="/register" style={{ color: '#00ff94', fontWeight: 600, textDecoration: 'none', transition: 'opacity 0.2s' }}
                  onMouseEnter={e => e.target.style.opacity = '0.75'}
                  onMouseLeave={e => e.target.style.opacity = '1'}
                >
                  Create one free →
                </a>
              </p>
            </div>

          </div>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={4000} theme="dark" />
    </>
  )
}