import type { SVGProps } from "react";

type IconName =
  | "archive"
  | "book"
  | "bookOpen"
  | "check"
  | "chevronDown"
  | "chevronLeft"
  | "chevronRight"
  | "close"
  | "download"
  | "edit"
  | "grid"
  | "layout"
  | "list"
  | "moon"
  | "more"
  | "panel"
  | "pen"
  | "plus"
  | "save"
  | "search"
  | "settings"
  | "star"
  | "sun"
  | "tag"
  | "trash"
  | "trending"
  | "users";

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
};

const paths: Record<IconName, string[]> = {
  archive: ["M4 7h16", "M6 7v12h12V7", "M8 4h8l2 3H6l2-3Z", "M10 11h4"],
  book: ["M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3V4Z", "M5 20a3 3 0 0 1 3-3h9"],
  bookOpen: ["M4 5.5A3.5 3.5 0 0 1 7.5 2H20v16H7.5A3.5 3.5 0 0 0 4 21.5v-16Z", "M20 2v16", "M8 6h7", "M8 10h7"],
  check: ["M20 6 9 17l-5-5"],
  chevronDown: ["m6 9 6 6 6-6"],
  chevronLeft: ["m15 18-6-6 6-6"],
  chevronRight: ["m9 18 6-6-6-6"],
  close: ["M18 6 6 18", "M6 6l12 12"],
  download: ["M12 3v12", "m7 10 5 5 5-5", "M5 21h14"],
  edit: ["M12 20h9", "M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z"],
  grid: ["M4 4h7v7H4Z", "M13 4h7v7h-7Z", "M4 13h7v7H4Z", "M13 13h7v7h-7Z"],
  layout: ["M4 5h16", "M4 12h16", "M4 19h16"],
  list: ["M8 6h13", "M8 12h13", "M8 18h13", "M3 6h.01", "M3 12h.01", "M3 18h.01"],
  moon: ["M21 14.8A8 8 0 0 1 9.2 3 7 7 0 1 0 21 14.8Z"],
  more: ["M12 6h.01", "M12 12h.01", "M12 18h.01"],
  panel: ["M4 5h16v14H4Z", "M9 5v14"],
  pen: ["M12 20h9", "M16 4l4 4L8 20H4v-4L16 4Z"],
  plus: ["M12 5v14", "M5 12h14"],
  save: ["M5 4h12l2 2v14H5Z", "M8 4v6h8", "M8 20v-6h8"],
  search: ["M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z", "m21 21-4.3-4.3"],
  settings: ["M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z", "M19 12h2", "M3 12h2", "M12 3v2", "M12 19v2", "m18 6-1.4 1.4", "M7.4 16.6 6 18", "m6 6 1.4 1.4", "M16.6 16.6 18 18"],
  star: ["m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.8 6.4 21l1.1-6.2L3 10.4l6.2-.9L12 3Z"],
  sun: ["M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z", "M12 1v3", "M12 20v3", "M4.2 4.2l2.1 2.1", "M17.7 17.7l2.1 2.1", "M1 12h3", "M20 12h3", "M4.2 19.8l2.1-2.1", "M17.7 6.3l2.1-2.1"],
  tag: ["M20 13 13 20 4 11V4h7l9 9Z", "M7.5 7.5h.01"],
  trash: ["M4 7h16", "M10 11v6", "M14 11v6", "M6 7l1 14h10l1-14", "M9 7V4h6v3"],
  trending: ["M3 17 9 11l4 4 7-8", "M14 7h6v6"],
  users: ["M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2", "M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M22 21v-2a4 4 0 0 0-3-3.9", "M16 3.1a4 4 0 0 1 0 7.8"],
};

export function Icon({ name, size = 18, className = "", ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      {paths[name].map((d) => (
        <path d={d} key={d} />
      ))}
    </svg>
  );
}
