import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

export default function Logo({ to = "/", className, size = "md" }) {
  const box = size === "sm" ? "h-7 w-7 rounded-md" : size === "lg" ? "h-10 w-10 rounded-xl" : "h-8 w-8 rounded-lg"
  const letter = size === "sm" ? "text-[13px]" : size === "lg" ? "text-[18px]" : "text-[15px]"
  const text = size === "sm" ? "text-[1rem]" : size === "lg" ? "text-[1.25rem]" : "text-[1.15rem]"

  const content = (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className={cn("grid place-items-center bg-primary text-primary-foreground", box)}>
        <span className={cn("ww-heading leading-none", letter)}>W</span>
      </span>
      <span className={cn("ww-heading", text)}>WeekWins</span>
    </span>
  )

  return to ? (
    <Link to={to} className="no-underline">
      {content}
    </Link>
  ) : (
    content
  )
}

