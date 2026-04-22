import { useForm } from "react-hook-form"
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "@/components/layout/AuthShell";

export default function Register() {
    const navigate = useNavigate()
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm()
    const onSubmit = (data) => {
        axios
            .post(`${import.meta.env.VITE_API_URL}/api/v1/users/register`, data)
            .then((response) => {
                toast.success(response.data.message || "Account created", {
                    position: "top-right",
                    autoClose: 2500,
                    theme: "dark",
                });
                setTimeout(() => navigate("/user/login"), 600);
            })
            .catch((error) => {
                toast.error(error.response?.data?.message || "Registration failed", {
                    position: "top-right",
                    autoClose: 4000,
                    theme: "dark",
                });
                console.error("There was an error!", error);
            });
    }
    const password = watch("password")
    return (
        <>
            <AuthShell
                title="Create your account"
                subtitle="Create an org, plan sprints, assign tasks — and ship what you planned."
                kicker="Start free"
                sideTitle="One structure."
                sideSubtitle="Zero chaos."
                features={[
                    { icon: "⚡", label: "Sprint Planning", desc: "Build focused sprint plans in minutes." },
                    { icon: "🧑‍💻", label: "Team Assignment", desc: "Every task has a clear owner." },
                    { icon: "📊", label: "Priority & Status", desc: "Track work from Pending to Done." },
                ]}
            >
                <form onSubmit={handleSubmit(onSubmit)} method="POST" className="space-y-5">
                    <div>
                        <label className="ww-label" htmlFor="fullName">
                            Full name
                        </label>
                        <input
                            id="fullName"
                            type="text"
                            autoComplete="name"
                            className={`ww-input ${errors.fullName ? "border-destructive focus-visible:ring-destructive/25" : ""}`}
                            {...register("fullName", { required: "Full name is required" })}
                        />
                        {errors.fullName && <p className="mt-2 text-xs text-destructive">⚠ {errors.fullName.message}</p>}
                    </div>

                    <div>
                        <label className="ww-label" htmlFor="username">
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            autoComplete="username"
                            className={`ww-input ${errors.username ? "border-destructive focus-visible:ring-destructive/25" : ""}`}
                            {...register("username", { required: "Username is required" })}
                        />
                        {errors.username && <p className="mt-2 text-xs text-destructive">⚠ {errors.username.message}</p>}
                    </div>

                    <div>
                        <label className="ww-label" htmlFor="email">
                            Email address
                        </label>
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@company.com"
                            className={`ww-input ${errors.email ? "border-destructive focus-visible:ring-destructive/25" : ""}`}
                            {...register("email", {
                                required: "Email is required",
                                pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email" },
                            })}
                        />
                        {errors.email && <p className="mt-2 text-xs text-destructive">⚠ {errors.email.message}</p>}
                    </div>

                    <div>
                        <label className="ww-label" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            autoComplete="new-password"
                            placeholder="At least 6 characters"
                            className={`ww-input ${errors.password ? "border-destructive focus-visible:ring-destructive/25" : ""}`}
                            {...register("password", { required: "Password is required", minLength: { value: 6, message: "At least 6 characters" } })}
                        />
                        {errors.password && <p className="mt-2 text-xs text-destructive">⚠ {errors.password.message}</p>}
                    </div>

                    <div>
                        <label className="ww-label" htmlFor="confirmPassword">
                            Confirm password
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            className={`ww-input ${errors.confirmPassword ? "border-destructive focus-visible:ring-destructive/25" : ""}`}
                            {...register("confirmPassword", {
                                required: "Please confirm your password",
                                validate: (v) => v === password || "Passwords do not match",
                            })}
                        />
                        {errors.confirmPassword && (
                            <p className="mt-2 text-xs text-destructive">⚠ {errors.confirmPassword.message}</p>
                        )}
                    </div>

                    <button type="submit" className="ww-btn-primary w-full">
                        Create account →
                    </button>

                    <p className="text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link to="/user/login" className="font-semibold text-primary hover:opacity-80">
                            Sign in →
                        </Link>
                    </p>
                </form>
            </AuthShell>
            <ToastContainer position="top-right" autoClose={4000} theme="dark" />
        </>
    )
}
