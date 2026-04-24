import React from "react";

export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-lg bg-muted/60 ${className}`} />;
}

export function Spinner({ label = "Loading…", className = "" }) {
  return (
    <div className={`flex items-center gap-3 text-muted-foreground ${className}`}>
      <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

