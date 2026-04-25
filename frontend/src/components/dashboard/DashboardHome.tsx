import DashboardLayout from "@/components/layout/DashboardLayout";
import { Icon } from "@/components/ui/Icon";

const kpis = [
  { label: "小说数量", value: "6", hint: "连载与完本总数", icon: "book" as const },
  { label: "素材数量", value: "100", hint: "设定、桥段、考据", icon: "archive" as const },
  { label: "角色卡数量", value: "28", hint: "主角、配角与群像", icon: "users" as const },
  { label: "近 7 天新增", value: "5", hint: "新增素材与章节", icon: "trending" as const },
];

const categories = [
  ["世界观", 30],
  ["人物", 25],
  ["剧情", 20],
  ["场景", 15],
  ["文风", 5],
  ["金手指", 3],
  ["资料考据", 2],
] as const;

const writingStats = [
  ["创作中的小说", "3 本", true],
  ["已完本小说", "2 本", false],
  ["昨日输出字数", "4,860", false],
  ["今日输出字数", "2,120", false],
] as const;

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

function KpiCard({ item }: { item: (typeof kpis)[number] }) {
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

function CategoryDistribution() {
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
                style={{ width: `${Math.max(4, value * 3)}%` }}
              />
            </div>
            <span className="text-right text-[13px] font-semibold text-neutral-gray">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function WritingInfo() {
  return (
    <section className="rounded-xl border border-soft-border bg-white p-6">
      <div>
        <h2 className="font-display text-2xl font-semibold">创作信息</h2>
        <p className="mt-1 text-xs font-medium text-neutral-gray">小说项目与日更节奏</p>
      </div>
      <div className="mt-5 space-y-2.5">
        {writingStats.map(([label, value, active]) => (
          <div
            className={`flex h-11 items-center justify-between rounded-xl px-3.5 ${
              active ? "bg-pale-gray" : "border border-soft-border bg-white"
            }`}
            key={label}
          >
            <span className="text-sm font-semibold">{label}</span>
            <span className={`font-display text-[22px] font-semibold ${active ? "text-apple-blue" : ""}`}>
              {value}
            </span>
          </div>
        ))}
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
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((item) => (
            <KpiCard item={item} key={item.label} />
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_372px]">
          <CategoryDistribution />
          <WritingInfo />
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
