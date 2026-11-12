/* Small inline icon set (stroke icons, 24px grid). */
const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
};

const make = (paths) =>
  function Icon(props) {
    return (
      <svg {...base} {...props}>
        {paths}
      </svg>
    );
  };

export const IconGrid = make(
  <>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.6" fill="currentColor" stroke="none" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" fill="currentColor" stroke="none" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" fill="currentColor" stroke="none" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" fill="currentColor" stroke="none" />
  </>,
);
export const IconPhone = make(
  <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />,
);
export const IconMail = make(
  <>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
  </>,
);
export const IconBag = make(
  <>
    <path d="M5 8h14l-1.2 11.2A2 2 0 0 1 15.8 21H8.2a2 2 0 0 1-2-1.8z" />
    <path d="M9 10V7a3 3 0 0 1 6 0v3" />
  </>,
);
export const IconArrowRight = make(
  <>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </>,
);
export const IconArrowLeft = make(
  <>
    <path d="M19 12H5" />
    <path d="m11 18-6-6 6-6" />
  </>,
);
export const IconArrowDown = make(
  <>
    <path d="M12 5v14" />
    <path d="m6 13 6 6 6-6" />
  </>,
);
export const IconClose = make(
  <>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </>,
);
export const IconMenu = make(
  <>
    <path d="M4 8h16" />
    <path d="M4 16h16" />
  </>,
);
export const IconLeaf = make(
  <>
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z" />
    <path d="M2 21c0-3 1.9-5.4 5.1-6" />
  </>,
);
export const IconCheese = make(
  <>
    <path d="M3 18 12 5l9 13z" />
    <circle cx="10" cy="14" r="1.3" />
    <circle cx="14.5" cy="15.5" r="1" />
    <circle cx="12.5" cy="10.5" r="0.8" />
  </>,
);
export const IconTomato = make(
  <>
    <circle cx="12" cy="13.5" r="7.5" />
    <path d="M12 6c-1.5-1.6-3.6-2-5-1.5 1.2.6 2.2 1.6 2.7 2.8M12 6c1.5-1.6 3.6-2 5-1.5-1.2.6-2.2 1.6-2.7 2.8M12 6V3" />
  </>,
);
export const IconFlame = make(
  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3.4.3 1.3 1.3 2.5 2.5 2.9z" />,
);
export const IconClock = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>,
);
export const IconPin = make(
  <>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </>,
);
export const IconDownload = make(
  <>
    <path d="M12 3v12" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 21h14" />
  </>,
);
export const IconEye = make(
  <>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </>,
);
export const IconHeart = make(
  <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z" />,
);
export const IconStar = make(
  <path
    d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"
    fill="currentColor"
    stroke="none"
  />,
);
export const IconSparkle = make(
  <path d="M12 3c.6 4.5 2.5 6.4 7 7-4.5.6-6.4 2.5-7 7-.6-4.5-2.5-6.4-7-7 4.5-.6 6.4-2.5 7-7Z" fill="currentColor" stroke="none" />,
);
export const IconScooter = make(
  <>
    <circle cx="6" cy="17" r="2.5" />
    <circle cx="18" cy="17" r="2.5" />
    <path d="M8.5 17h7M15 6h2l2 8.5M15 14H9l-2-4h6" />
  </>,
);
export const IconPizza = make(
  <>
    <path d="M12 3 3.5 20.5a17 17 0 0 0 17 0z" />
    <path d="M5.2 17a14 14 0 0 0 13.6 0" />
    <circle cx="11" cy="11" r="1.2" />
    <circle cx="13.5" cy="15.5" r="1.2" />
    <circle cx="9" cy="16" r="1" />
  </>,
);
export const IconCalendar = make(
  <>
    <rect x="3" y="5" width="18" height="16" rx="2.5" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </>,
);
export const IconInstagram = make(
  <>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
  </>,
);
export const IconFacebook = make(<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />);
