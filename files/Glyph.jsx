// Simple line glyphs, one per seva category. Stroke inherits currentColor.
export function Glyph({ name, size = 34 }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "drop":
      return (<svg {...p}><path d="M12 3s6 6.4 6 10.4A6 6 0 0 1 6 13.4C6 9.4 12 3 12 3Z" /><path d="M9.5 14.2a2.6 2.6 0 0 0 2.6 2.4" /></svg>);
    case "leaf":
      return (<svg {...p}><path d="M5 19c8.5 1 14-4.2 14-13 -8.5-1-14 4.2-14 13Z" /><path d="M5 19c2-5 5.5-8 9.5-10" /></svg>);
    case "bowl":
      return (<svg {...p}><path d="M3.5 11h17a8.5 8.5 0 0 1-17 0Z" /><path d="M12 11V7.5" /><path d="M9 11c-.4-1.6.4-3 2-3.6" /><path d="M21 20H3" /></svg>);
    case "blanket":
      return (<svg {...p}><rect x="4" y="5" width="16" height="14" rx="2.5" /><path d="M8 5v14M16 5v14" /><path d="M4 9.5h16M4 14.5h16" opacity=".55" /></svg>);
    case "toy":
      return (<svg {...p}><circle cx="12" cy="8" r="3.2" /><path d="M12 11.2V14" /><path d="M7.5 20c.4-3.2 2.1-5 4.5-5s4.1 1.8 4.5 5Z" /><path d="M9.4 6.6 8 5.4M14.6 6.6 16 5.4" /></svg>);
    case "lotus":
      return (<svg {...p}><path d="M12 4c1.7 1.7 2.6 3.6 2.6 5.7 0 .9-.2 1.7-.6 2.5" /><path d="M12 4c-1.7 1.7-2.6 3.6-2.6 5.7 0 .9.2 1.7.6 2.5" /><path d="M4.5 9.8c2.3.3 4.1 1.2 5.4 2.6.6.6 1 1.3 1.3 2.1" /><path d="M19.5 9.8c-2.3.3-4.1 1.2-5.4 2.6-.6.6-1 1.3-1.3 2.1" /><path d="M4 14.5c2.4 3 4.9 4.5 8 4.5s5.6-1.5 8-4.5c-2.4-1-4.6-1.2-6.6-.6" /></svg>);
    default:
      return null;
  }
}
