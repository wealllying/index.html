'use client';

export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Left house (blue) */}
      <path d="M8 28L16 20L24 28V38H8V28Z" fill="#1B6B9A" />
      <rect x="12" y="30" width="4" height="4" rx="0.5" fill="white" />
      {/* Right house (teal) */}
      <path d="M24 28L32 20L40 28V38H24V28Z" fill="#2EC4A0" />
      <rect x="32" y="30" width="4" height="4" rx="0.5" fill="white" />
      {/* Bridge arc (gold) */}
      <path d="M16 24C16 16 32 16 32 24" stroke="#E8A838" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}
