export function EngineerIllustration() {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="size-32 drop-shadow-xl sm:size-40"
      aria-hidden="true"
    >
      {/* Background glow for depth */}
      <circle cx="100" cy="100" r="80" fill="#ff8a2a" fillOpacity="0.1" />
      
      {/* Body/Shoulders */}
      <path
        d="M40 180C40 135 70 110 100 110C130 110 160 135 160 180"
        fill="#e5e7eb"
        stroke="#ffffff"
        strokeWidth="4"
      />
      
      {/* Face/Head */}
      <circle cx="100" cy="85" r="25" fill="#f3f4f6" stroke="#ffffff" strokeWidth="4" />
      
      {/* Hardhat/Helmet */}
      <path
        d="M65 80C65 60 80 45 100 45C120 45 135 60 135 80"
        fill="#ff8a2a"
      />
      <rect x="60" y="80" width="80" height="8" rx="4" fill="#ea7a1f" />
      
      {/* Blueprint/Clipboard prop */}
      <rect x="120" y="120" width="40" height="50" rx="4" fill="#374151" stroke="#9ca3af" strokeWidth="2" />
      <line x1="128" y1="135" x2="152" y2="135" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
      <line x1="128" y1="145" x2="145" y2="145" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
