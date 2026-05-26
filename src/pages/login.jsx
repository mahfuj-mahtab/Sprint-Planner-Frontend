import { useForm } from "react-hook-form";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { login } from "../store/slices/authSlice.js";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { Link } from "react-router-dom";
import AuthShell from "@/components/layout/AuthShell";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/users/login`, data);
      toast.success(response.data.message, { position: "top-right", autoClose: 3000, theme: "dark" });
      dispatch(
        login({
          user: response.data.user,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          isAuthenticated: true,
        })
      );
      navigate("/user/profile");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed", {
        position: "top-right",
        autoClose: 4000,
        theme: "dark",
      });
    }
  };

  return (
    <>
      <AuthShell
        title="Welcome back, founder."
        subtitle="Sign in to the workspace where your sprints, clients, and cash stay connected."
        kicker="WeekWins"
        sideTitle="Run the business."
        sideSubtitle="Ship the week."
        footerQuote="Operational clarity beats another task board."
        features={[
          {
            icon: "◎",
            label: "Plan → Ship",
            desc: "Versions, sprints, and Kanban on the work you’re actually building.",
          },
          {
            icon: "◈",
            label: "Operate",
            desc: "CRM, follow-ups, and client context beside delivery — not in another tab.",
          },
          {
            icon: "▣",
            label: "Understand",
            desc: "Partitions, subscriptions, income & expenses without a separate spreadsheet.",
          },
        ]}
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <div>
            <label className="ww-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@yourstudio.dev"
              autoComplete="email"
              className={`ww-input ${errors.email ? "border-destructive focus-visible:ring-destructive/25" : ""}`}
              {...register("email", {
                required: "Email is required",
                pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email" },
              })}
            />
            {errors.email && <p className="mt-2 text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="ww-label mb-0" htmlFor="password">
                Password
              </label>
              <button type="button" className="text-[11px] font-medium text-primary hover:underline">
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
            {errors.password && <p className="mt-2 text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <button type="submit" className="ww-btn-primary w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>

          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.10em] text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span>or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <p className="text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/user/register" className="font-semibold text-primary hover:opacity-80">
              Create a free workspace
            </Link>
          </p>
        </form>
      </AuthShell>

      <ToastContainer position="top-right" autoClose={4000} theme="dark" />
    </>
  );
}
