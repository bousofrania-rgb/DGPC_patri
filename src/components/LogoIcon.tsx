import React from 'react';

export default function LogoIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12 2L2 7.5L12 13L22 7.5L12 2Z" fill="currentColor" fillOpacity="0.8" />
      <path d="M2 7.5V16.5L12 22V13L2 7.5Z" fill="currentColor" />
      <path d="M22 7.5V16.5L12 22V13L22 7.5Z" fill="currentColor" fillOpacity="0.6" />
      {/* Network Dot */}
      <circle cx="12" cy="13" r="1.5" fill="white" />
      {/* Data Lines */}
      <path d="M12 2L12 13" stroke="white" strokeWidth="0.5" strokeDasharray="1 1" />
    </svg>
  );
}
