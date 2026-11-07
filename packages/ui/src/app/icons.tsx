import type { ReactNode } from "react";

/** Small inline toolbar icons (currentColor). */
const Svg = ({ children }: { children: ReactNode }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
    {children}
  </svg>
);

export const PlayIcon = () => (
  <Svg>
    <path d="M3 1.5v11l9.5-5.5z" />
  </Svg>
);
export const StopIcon = () => (
  <Svg>
    <rect x="2.5" y="2.5" width="9" height="9" rx="1" />
  </Svg>
);
export const RecordIcon = () => (
  <Svg>
    <circle cx="7" cy="7" r="5" />
  </Svg>
);
export const RewindIcon = () => (
  <Svg>
    <path d="M2 2h2v10H2zM12.5 2v10L5 7z" />
  </Svg>
);
export const LoopIcon = () => (
  <Svg>
    <path
      d="M3 5.5A2.5 2.5 0 0 1 5.5 3h5l-1.5-1.5M11 8.5A2.5 2.5 0 0 1 8.5 11h-5L5 12.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
export const MetronomeIcon = () => (
  <Svg>
    <path
      d="M5 1h4l3 12H2zM7 4.5v5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
    <path d="M7 9.5l3-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </Svg>
);
export const MagnetIcon = () => (
  <Svg>
    <path
      d="M3 2v5a4 4 0 0 0 8 0V2M3 4.5h2.5M8.5 4.5H11"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Svg>
);

/** Outline icons share one stroke style. */
const Stroke = ({ d, width = 1.3 }: { d: string; width?: number }) => (
  <path
    d={d}
    fill="none"
    stroke="currentColor"
    strokeWidth={width}
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);

export const EndIcon = () => (
  <Svg>
    <path d="M10 2h2v10h-2zM1.5 2v10L9 7z" />
  </Svg>
);
export const UndoIcon = () => (
  <Svg>
    <Stroke d="M4.5 2.5L2 5l2.5 2.5M2 5h6.5a3 3 0 0 1 0 6H6" width={1.5} />
  </Svg>
);
export const RedoIcon = () => (
  <Svg>
    <Stroke d="M9.5 2.5L12 5 9.5 7.5M12 5H5.5a3 3 0 0 0 0 6H8" width={1.5} />
  </Svg>
);
export const ScissorsIcon = () => (
  <Svg>
    <circle cx="3.5" cy="10.5" r="2" fill="none" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="10.5" cy="10.5" r="2" fill="none" stroke="currentColor" strokeWidth="1.3" />
    <Stroke d="M4.8 9L11 1.5M9.2 9L3 1.5" />
  </Svg>
);
export const DuplicateIcon = () => (
  <Svg>
    <rect x="1.5" y="4.5" width="8" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="1.3" />
    <Stroke d="M4.5 4.5v-2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2" />
  </Svg>
);
export const TrashIcon = () => (
  <Svg>
    <Stroke d="M2 3.5h10M5.5 3.5V2h3v1.5M3.5 3.5l.7 8.5h5.6l.7-8.5M6 6v3.5M8 6v3.5" />
  </Svg>
);
export const MixerIcon = () => (
  <Svg>
    <Stroke d="M3 1.5v11M7 1.5v11M11 1.5v11" width={1.1} />
    <rect x="1.25" y="7.5" width="3.5" height="2.2" rx="0.5" />
    <rect x="5.25" y="3" width="3.5" height="2.2" rx="0.5" />
    <rect x="9.25" y="9" width="3.5" height="2.2" rx="0.5" />
  </Svg>
);
export const GearIcon = () => (
  <Svg>
    <circle cx="7" cy="7" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="7" cy="7" r="1.3" />
    <Stroke
      d="M7 1v1.8M7 11.2V13M1 7h1.8M11.2 7H13M2.8 2.8l1.3 1.3M9.9 9.9l1.3 1.3M2.8 11.2l1.3-1.3M9.9 4.1l1.3-1.3"
      width={1.6}
    />
  </Svg>
);
export const InfoIcon = () => (
  <Svg>
    <circle cx="7" cy="7" r="5.8" fill="none" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="7" cy="4.3" r="0.9" />
    <Stroke d="M7 6.5v4" width={1.5} />
  </Svg>
);
export const ZoomOutIcon = () => (
  <Svg>
    <circle cx="6" cy="6" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
    <Stroke d="M9.2 9.2l3.3 3.3M4 6h4" width={1.5} />
  </Svg>
);
export const ZoomInIcon = () => (
  <Svg>
    <circle cx="6" cy="6" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
    <Stroke d="M9.2 9.2l3.3 3.3M4 6h4M6 4v4" width={1.5} />
  </Svg>
);
