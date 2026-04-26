"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Icon } from "@/components/ui/Icon";
import { useStats } from "@/hooks/useApi";
import type { Stats } from "@/types";

const fallbackStats: Stats = {
  total: 0,
  total_tags: 0,
  by_status: {},
  by_category: {},
  avg_score: 0,
  recent_count: 0,
};

const fallbackCategories: Array<[string, number]> = [
  ["世界观", 30],
  ["人物", 25],
  ["剧情", 20],
  ["场景", 15],
  ["文风", 5],
  ["金手指", 3],
  ["资料考据", 2],
];

const tasks = [
  {
    title: "小说素材处理",
    icon: "download" as const,
    body: "当前任务：解析《问道青云》TXT\n进度 68% · 正在拆分章节与候选片段",
    meta: "总任务 24",
    progress: 68,
  },
  {
    title: "素材处理任务",
    icon: "list" as const,
    body: "待审 15 条\n等待 agent 标记了人物卡和桥段素材",
    meta: "未审 11",
    progress: 16,
  },
  {
    title: "小说创作任务",
    icon: "edit" as const,
    body: "《烬野司命》今日目标 3,000 字；完成了 19% 的序章。",
    meta: "今日还需 850 字",
    progress: 0,
    dark: true,
  },
];

function getKpis(stats: Stats) {
  return [
    { label: "素材数量", value: String(stats.total), hint: "全部素材条目", icon: "archive" as const },
    { label: "标签数量", value: String(stats.total_tags), hint: "内容、状态与主题标签", icon: "tag" as const },
    { label: "平均评分", value: stats.avg_score.toFixed(1), hint: "素材价值评分均值", icon: "star" as const },
    { label: "近 7 天新增", value: String(stats.recent_count), hint: "新增素材条目", icon: "trending" as const },
  ];
}

function KpiCard({ item }: { item: ReturnType<typeof getKpis>[number] }) {
  return (
    <section className="flex min-h-[132px] flex-col justify-between rounded-xl border border-soft-border bg-white p-5">
      <div className="flex items-center justify-between text-sm font-semibold text-neutral-gray">
        <span>{item.label}</span>
        <Icon className="text-apple-blue" name={item.icon} size={19} />
      </div>
      <div className="font-display text-[38px] font-semibold leading-none">{item.value}</div>
      <p className="text-xs text-neutral-gray">{item.hint}</p>
    </section>
  );
}

function CategoryDistribution({ categories }: { categories: Array<[string, number]> }) {
  const maxValue = Math.max(1, ...categories.map(([, value]) => value));

  return (
    <section className="rounded-xl border border-soft-border bg-white p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">分类分布</h2>
          <p className="mt-1 text-xs font-medium text-neutral-gray">GET /api/stats.by_category</p>
        </div>
        <button
          aria-label="查看分类分布"
          className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-pale-gray transition active:scale-[0.96]"
          type="button"
        >
          <Icon name="chevronRight" size={16} />
        </button>
      </div>
      <div className="space-y-3">
        {categories.map(([label, value]) => (
          <div className="grid h-[34px] grid-cols-[96px_1fr_28px] items-center gap-3" key={label}>
            <span className="text-sm font-semibold">{label}</span>
            <div className="h-2 overflow-hidden rounded bg-pale-gray">
              <div
                className={`h-full rounded ${label === "世界观" ? "bg-apple-blue" : "bg-[#8d8d93]"}`}
                style={{ width: `${Math.max(4, (value / maxValue) * 100)}%` }}
              />
            </div>
            <span className="text-right text-[13px] font-semibold text-neutral-gray">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatusInfo({ statuses }: { statuses: Array<[string, number]> }) {
  return (
    <section className="rounded-xl border border-soft-border bg-white p-6">
      <div>
        <h2 className="font-display text-2xl font-semibold">整理信息</h2>
        <p className="mt-1 text-xs font-medium text-neutral-gray">GET /api/stats.by_status</p>
      </div>
      <div className="mt-5 space-y-2.5">
        {statuses.map(([label, value], index) => (
          <div
            className={`flex h-11 items-center justify-between rounded-xl px-3.5 ${
              index === 0 ? "bg-pale-gray" : "border border-soft-border bg-white"
            }`}
            key={label}
          >
            <span className="text-sm font-semibold">{label}</span>
            <span className={`font-display text-[22px] font-semibold ${index === 0 ? "text-apple-blue" : ""}`}>
              {value}
            </span>
          </div>
        ))}
        {statuses.length === 0 && (
          <div className="flex h-11 items-center rounded-xl bg-pale-gray px-3.5 text-sm font-semibold text-neutral-gray">
            暂无状态统计
          </div>
        )}
      </div>
    </section>
  );
}

function TaskCard({ task }: { task: (typeof tasks)[number] }) {
  const dark = "dark" in task && task.dark;

  return (
    <section
      className={`flex min-h-[220px] flex-col rounded-xl border p-6 ${
        dark ? "border-graphite-a bg-graphite-a text-white" : "border-soft-border bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-[22px] font-semibold">{task.title}</h3>
        <Icon className="text-apple-blue" name={task.icon} size={22} />
      </div>
      <p className={`mt-4 whitespace-pre-line text-sm leading-6 ${dark ? "text-[#a1a1a6]" : "text-neutral-gray"}`}>
        {task.body}
      </p>
      <div className="mt-auto">
        <span
          className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold ${
            dark ? "bg-black text-white" : "bg-pale-gray text-near-black"
          }`}
        >
          {task.meta}
        </span>
        {!dark && (
          <div className="mt-5 h-2 overflow-hidden rounded bg-pale-gray">
            <div className="h-full rounded bg-apple-blue" style={{ width: `${task.progress}%` }} />
          </div>
        )}
      </div>
    </section>
  );
}

export function DashboardHome() {
  const { data, isError, isLoading } = useStats();
  const stats = data ?? fallbackStats;
  const kpis = getKpis(stats);
  const categories =
    Object.entries(stats.by_category).length > 0
      ? Object.entries(stats.by_category).sort((a, b) => b[1] - a[1]).slice(0, 7)
      : [...fallbackCategories];
  const statuses = Object.entries(stats.by_status)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <DashboardLayout>
      <div className="mx-auto flex min-h-[100dvh] max-w-[1192px] flex-col gap-6 px-4 py-6 sm:px-8">
        <section className="rounded-[28px] bg-black p-8 text-white sm:p-[34px]">
          <p className="text-[13px] font-semibold text-highlight-blue">NOVEL WORKBENCH</p>
          <h1 className="mt-2 max-w-[850px] font-display text-4xl font-semibold leading-[1.08] tracking-normal sm:text-[46px]">
            让每一缕灵感，都有归处。
          </h1>
          <p className="mt-3 max-w-[920px] text-[17px] leading-[1.48] text-[#a1a1a6]">
            墨境书台为长篇小说创作而生：收拢设定、人物、桥段与灵光片段，在安静的秩序里，把零散星火养成一部长夜可读的故事。
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {isLoading && (
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-[#a1a1a6]">
                正在同步统计数据
              </span>
            )}
            {isError && (
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-[#a1a1a6]">
                统计接口暂不可用，已显示本地占位
              </span>
            )}
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((item) => (
            <KpiCard item={item} key={item.label} />
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_372px]">
          <CategoryDistribution categories={categories} />
          <StatusInfo statuses={statuses} />
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          {tasks.map((task) => (
            <TaskCard key={task.title} task={task} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
