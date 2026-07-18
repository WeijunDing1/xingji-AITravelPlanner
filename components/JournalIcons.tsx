import React from "react";

interface IconProps {
  className?: string;
}

const sharedProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function PlaneIcon({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" {...sharedProps}>
      <path d="M5.5 25.5 21 28l-4.5 12 4.2.8 9-10.8 9.5 1.7c2.5.4 4.8-1.3 5.2-3.8.4-2.5-1.3-4.8-3.8-5.2L30 21.1 24.5 7.3l-4.4-.8 1.4 13.7-12.7-2.1-3.4-4.6-2.8-.5 2.9 12.5Z" />
      <path d="M8 39.5c5.3.8 10.3.1 14.6-2.1" strokeDasharray="2.5 3.5" />
    </svg>
  );
}

export function MicIcon({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...sharedProps}>
      <path d="M8.5 6.1c0-2.1 1.5-3.6 3.5-3.6s3.5 1.5 3.5 3.6v5.5c0 2.1-1.5 3.7-3.5 3.7s-3.5-1.6-3.5-3.7V6.1Z" />
      <path d="M5.4 10.8c0 4.1 2.7 7.2 6.6 7.2s6.6-3.1 6.6-7.2M12 18v3.5M8.7 21.5h6.6" />
    </svg>
  );
}

export function CameraIcon({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...sharedProps}>
      <path d="M3.2 7.8c0-1.1.9-2 2-2h2.4l1.3-2h6.3l1.2 2h2.5c1.1 0 2 .9 2 2v10.3c0 1.1-.9 2-2 2H5.2c-1.1 0-2-.9-2-2V7.8Z" />
      <path d="M15.8 12.8a3.8 3.8 0 1 1-7.6 0 3.8 3.8 0 0 1 7.6 0ZM17.8 8.8h.1" />
    </svg>
  );
}

export function CalendarIcon({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...sharedProps}>
      <path d="M4 5.5h16v15H4zM7.5 3v4.5M16.5 3v4.5M4 9h16M7.5 12.5h2M12 12.5h2M16.5 12.5h.5M7.5 16.5h2M12 16.5h2" />
    </svg>
  );
}

export function MapIcon({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...sharedProps}>
      <path d="m3 5.5 5-2.2 8 2.4 5-2v15l-5 2-8-2.4-5 2.2v-15Z" />
      <path d="M8 3.3v15M16 5.7v15" />
    </svg>
  );
}

export function WalletIcon({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...sharedProps}>
      <path d="M4 6.2h14.4c1 0 1.8.8 1.8 1.8v10.2c0 1-.8 1.8-1.8 1.8H5.6c-1 0-1.8-.8-1.8-1.8V5.8c0-1 .6-1.6 1.5-1.9l11-1.8" />
      <path d="M15.5 11h5v4.5h-5a2.2 2.2 0 0 1 0-4.5Z" />
    </svg>
  );
}

export function LinkIcon({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...sharedProps}>
      <path d="m9.4 14.6 5.2-5.2M7.1 16.9l-1 .9a3.6 3.6 0 0 1-5.1-5.1l3.1-3.1a3.6 3.6 0 0 1 5.1 0M16.9 7.1l1-.9a3.6 3.6 0 0 1 5.1 5.1l-3.1 3.1a3.6 3.6 0 0 1-5.1 0" />
    </svg>
  );
}

export function SparkIcon({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...sharedProps}>
      <path d="M12 2.5c.5 4.8 2.7 7 7.5 7.5-4.8.5-7 2.7-7.5 7.5-.5-4.8-2.7-7-7.5-7.5 4.8-.5 7-2.7 7.5-7.5Z" />
      <path d="M19 16.5c.2 1.8 1.1 2.7 3 3-1.9.3-2.8 1.2-3 3-.3-1.8-1.2-2.7-3-3 1.8-.3 2.7-1.2 3-3ZM5 2.5c.2 1.2.8 1.8 2 2-1.2.2-1.8.8-2 2-.2-1.2-.8-1.8-2-2 1.2-.2 1.8-.8 2-2Z" />
    </svg>
  );
}

export function UploadIcon({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...sharedProps}>
      <path d="M12 16V3M7.5 7.5 12 3l4.5 4.5M4 14.5v5.5h16v-5.5" />
    </svg>
  );
}

export function SaveIcon({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...sharedProps}>
      <path d="M4 3.5h13.2L20.5 7v13.5h-17v-17Z" />
      <path d="M7 3.5v6h9v-6M7.5 20.5v-7h9v7" />
    </svg>
  );
}

export function RefreshIcon({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...sharedProps}>
      <path d="M19.5 7.5V3.8l-3.7.2M19 4.5a8.7 8.7 0 0 0-14.6 4M4.5 16.5v3.7l3.7-.2M5 19.5a8.7 8.7 0 0 0 14.6-4" />
    </svg>
  );
}

export function CloseIcon({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...sharedProps}>
      <path d="m5 5 14 14M19 5 5 19" />
    </svg>
  );
}
