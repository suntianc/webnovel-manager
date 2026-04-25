'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: '首页看板', icon: '◉' },
  { href: '/materials', label: '素材管理', icon: '◇' },
  { href: '/search', label: '全文搜索', icon: '⌕' },
  { href: '/tags', label: '标签管理', icon: '⌗' },
  { href: '/categories', label: '分类管理', icon: '☰' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-black text-white flex flex-col h-screen">
      <div className="h-20 flex items-center justify-center">
        <h1 className="text-xl font-semibold tracking-tight">网文素材库</h1>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-apple-blue text-white'
                  : 'text-neutral-gray hover:text-white'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
