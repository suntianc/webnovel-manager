"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { applyTheme, getStoredTheme, type ThemeMode } from "@/lib/theme";

const navItems = [
  { href: "/", label: "首页看板", icon: "layout" as const },
  { href: "/workspace", label: "创作台", icon: "pen" as const },
  { href: "/materials", label: "素材库", icon: "book" as const },
  { href: "/novels", label: "网文处理", icon: "bookOpen" as const },
  { href: "/ai-providers", label: "AI提供商", icon: "settings" as const },
  { href: "/collect-tasks", label: "采集任务管理", icon: "download" as const },
  { href: "/material-tasks", label: "素材任务管理", icon: "list" as const },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    setTheme(getStoredTheme());
  }, []);

  useEffect(() => {
    const savedCollapsed = window.localStorage.getItem("wm-sidebar-collapsed");

    if (savedCollapsed === "true") {
      setCollapsed(true);
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem("wm-sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  return (
    <aside
      className={`hidden h-[100dvh] shrink-0 flex-col bg-black py-7 text-white transition-[width,padding] duration-200 lg:flex ${
        collapsed ? "w-[88px] px-5" : "w-[248px] px-6"
      }`}
    >
      <Link className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`} href="/">
        <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-white text-near-black">
          <Icon name="bookOpen" size={18} />
        </span>
        {!collapsed && <span className="text-xl font-semibold tracking-normal">墨境书台</span>}
      </Link>

      <nav className="mt-7 flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              className={`flex h-11 items-center rounded-xl text-sm transition active:scale-[0.98] ${
                collapsed ? "justify-center px-0" : "gap-2.5 px-3.5"
              } ${
                isActive
                  ? "bg-graphite-a font-semibold text-white"
                  : "font-medium text-pale-gray hover:bg-graphite-b"
              }`}
              href={item.href}
              key={item.href}
            >
              <Icon
                className={isActive ? "text-highlight-blue" : "text-[#a1a1a6]"}
                name={item.icon}
                size={17}
              />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <div
        className={`flex h-11 items-center gap-1 rounded-[22px] border border-dark-gray bg-graphite-a p-1 ${
          collapsed ? "w-11 flex-col overflow-hidden" : "w-fit"
        }`}
      >
        <button
          aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-near-black text-[#a1a1a6] transition active:scale-[0.96]"
          onClick={() => setCollapsed((value) => !value)}
          type="button"
        >
          <Icon className={collapsed ? "rotate-180" : ""} name="panel" size={16} />
        </button>
        {!collapsed && (
          <>
            <button
              aria-label="浅色主题"
              className={`flex h-9 w-9 items-center justify-center rounded-full transition active:scale-[0.96] ${
                theme === "light" ? "bg-white text-near-black" : "bg-near-black text-[#a1a1a6]"
              }`}
              onClick={() => setTheme("light")}
              type="button"
            >
              <Icon name="sun" size={16} />
            </button>
            <button
              aria-label="深色主题"
              className={`flex h-9 w-9 items-center justify-center rounded-full transition active:scale-[0.96] ${
                theme === "dark" ? "bg-white text-near-black" : "bg-near-black text-[#a1a1a6]"
              }`}
              onClick={() => setTheme("dark")}
              type="button"
            >
              <Icon name="moon" size={16} />
            </button>
            <Link
              aria-label="设置"
              className={`flex h-9 w-9 items-center justify-center rounded-full transition active:scale-[0.96] ${
                pathname.startsWith("/settings")
                  ? "bg-apple-blue text-white"
                  : "bg-near-black text-[#a1a1a6]"
              }`}
              href="/settings/workflows"
            >
              <Icon name="settings" size={16} />
            </Link>
          </>
        )}
      </div>
    </aside>
  );
}
