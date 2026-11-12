import { useEffect, useState } from 'react';
import { shopNow } from '../lib/hours';

/**
 * The Dreamers alarm clock — pizza face and all — showing the real time at the shop.
 */
export default function AlarmClock({ size = 220, ringing = false }) {
  const [now, setNow] = useState(shopNow());
  useEffect(() => {
    const id = setInterval(() => setNow(shopNow()), 1000);
    return () => clearInterval(id);
  }, []);

  const hourDeg = ((now.h % 12) + now.m / 60) * 30;
  const minDeg = (now.m + now.s / 60) * 6;
  const secDeg = now.s * 6;
  const time = `${String(now.h).padStart(2, '0')}:${String(now.m).padStart(2, '0')}`;

  return (
    <svg
      className={`alarm ${ringing ? 'alarm--ring' : ''}`}
      width={size}
      height={size * 1.08}
      viewBox="0 0 200 216"
      role="img"
      aria-label={`Shop time ${time}`}
    >
      <defs>
        <radialGradient id="ac-body" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#ff5a4a" />
          <stop offset="60%" stopColor="#d9261c" />
          <stop offset="100%" stopColor="#9c120c" />
        </radialGradient>
        <radialGradient id="ac-cheese" cx="45%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#ffe08a" />
          <stop offset="100%" stopColor="#f6b84a" />
        </radialGradient>
      </defs>
      <g className="alarm__bells">
        <path d="M38 52a30 30 0 0 1 44-22L46 70a30 30 0 0 1-8-18z" fill="url(#ac-body)" />
        <path d="M162 52a30 30 0 0 0-44-22l36 40a30 30 0 0 0 8-18z" fill="url(#ac-body)" />
        <path d="M60 28c20-18 60-18 80 0" stroke="#b71b12" strokeWidth="7" fill="none" strokeLinecap="round" />
        <rect x="92" y="20" width="16" height="14" rx="3" fill="#c21e15" />
      </g>
      <path d="M52 196l-12 16M148 196l12 16" stroke="#b71b12" strokeWidth="9" strokeLinecap="round" />
      <circle cx="100" cy="124" r="82" fill="url(#ac-body)" />
      <circle cx="100" cy="124" r="66" fill="#e98f2f" />
      <circle cx="100" cy="124" r="58" fill="url(#ac-cheese)" />
      {/* toppings */}
      <g fill="#d63a2a">
        <circle cx="76" cy="100" r="9.5" />
        <circle cx="122" cy="96" r="9" />
        <circle cx="70" cy="140" r="9" />
        <circle cx="112" cy="158" r="9.5" />
        <circle cx="134" cy="132" r="8" />
      </g>
      <g fill="none" stroke="#2a2222" strokeWidth="3.4">
        <circle cx="98" cy="108" r="4" />
        <circle cx="88" cy="160" r="3.6" />
        <circle cx="140" cy="108" r="3.4" />
      </g>
      <g fill="#3e8f2c">
        <path d="M92 132c6-10 16-12 20-8-4 8-12 12-20 8z" />
        <path d="M58 118c2-8 10-12 14-10-2 8-8 12-14 10z" />
        <path d="M126 150c6-4 13-2 15 2-6 4-12 4-15-2z" />
      </g>
      {/* hands */}
      <g strokeLinecap="round">
        <line x1="100" y1="124" x2="100" y2="88" stroke="#151515" strokeWidth="7" transform={`rotate(${hourDeg} 100 124)`} />
        <line x1="100" y1="124" x2="100" y2="74" stroke="#151515" strokeWidth="5" transform={`rotate(${minDeg} 100 124)`} />
        <line x1="100" y1="134" x2="100" y2="72" stroke="#fff6e0" strokeWidth="2" transform={`rotate(${secDeg} 100 124)`} />
      </g>
      <circle cx="100" cy="124" r="7" fill="#151515" />
      <circle cx="100" cy="124" r="2.5" fill="#fff6e0" />
    </svg>
  );
}
