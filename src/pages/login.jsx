import { useForm } from "react-hook-form"
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import { login } from "../store/slices/authSlice.js";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { Link } from "react-router-dom";
import AuthShell from "@/components/layout/AuthShell";

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
      <AuthShell
        title="Welcome back"
        subtitle="Sign in to your workspace and pick up where you left off."
        kicker="Sprint-driven teams ship faster"
        sideTitle="Win the week."
        sideSubtitle="Ship the product."
        features={[
          { icon: "⬡", label: "Orgs & Projects", desc: "Organise all your work under one roof." },
          { icon: "◎", label: "Sprint Planning", desc: "Time-box goals your team will actually finish." },
          { icon: "▣", label: "Task Assignment", desc: "Every task has an owner and a deadline." },
        ]}
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <div>
            <label className="ww-label" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              className={`ww-input ${errors.email ? "border-destructive focus-visible:ring-destructive/25" : ""}`}
              {...register("email", {
                required: "Email is required",
                pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email" },
              })}
            />
            {errors.email && <p className="mt-2 text-xs text-destructive">⚠ {errors.email.message}</p>}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="ww-label mb-0" htmlFor="password">
                Password
              </label>
              <button type="button" className="text-[11px] font-medium tracking-wide text-primary hover:underline">
                Forgot?
              </button>
            </div>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              className={`ww-input ${errors.password ? "border-destructive focus-visible:ring-destructive/25" : ""}`}
              {...register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "At least 6 characters" },
              })}
            />
            {errors.password && <p className="mt-2 text-xs text-destructive">⚠ {errors.password.message}</p>}
          </div>

          <button type="submit" className="ww-btn-primary w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in →"}
          </button>

          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.10em] text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span>or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link to="/user/register" className="font-semibold text-primary hover:opacity-80">
              Create one free →
            </Link>
          </p>
        </form>
      </AuthShell>

      <ToastContainer position="top-right" autoClose={4000} theme="dark" />
    </>
  )
}
