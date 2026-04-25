"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Icon } from "@/components/ui/Icon";

type MaterialRow = {
  id: number;
  title: string;
  summary: string;
  category: string;
  status: string;
  score: number;
  time: string;
  tags: string[];
  selected?: boolean;
};

const rows: MaterialRow[] = [
  {
    id: 1,
    title: "帝国政治体系设定",
    summary: "中央集权、地方领主、监察体系",
    category: "世界观 / 政治",
    status: "已整理",
    score: 5,
    time: "今天 10:00",
    tags: ["帝国", "权谋"],
    selected: true,
  },
  {
    id: 2,
    title: "冷面剑修说话方式",
    summary: "短句、克制、反问式压迫",
    category: "人物 / 话术",
    status: "待整理",
    score: 4,
    time: "昨天 22:18",
    tags: ["冷感"],
  },
  {
    id: 3,
    title: "巨额赎金谈判桥段",
    summary: "主动、试探、筹码交换",
    category: "剧情 / 冲突",
    status: "已整理",
    score: 5,
    time: "04-24 18:40",
    tags: ["谈判"],
  },
  {
    id: 4,
    title: "古代城市货币资料",
    summary: "纹银、铜钱、商票换算",
    category: "资料 / 经济",
    status: "已归档",
    score: 3,
    time: "04-23 09:12",
    tags: ["考据"],
  },
];

const pageSize = 4;

function FilterChip({
  children,
  active = false,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      className={`flex h-[34px] items-center gap-2 rounded-full px-3 text-[13px] font-semibold transition active:scale-[0.98] ${
        active ? "bg-near-black text-white" : "bg-pale-gray text-near-black"
      }`}
      type="button"
    >
      {children}
    </button>
  );
}

function Toolbar({
  activeTag,
  onClear,
  onCreate,
  onSearch,
  query,
}: {
  activeTag: string | null;
  onClear: () => void;
  onCreate: () => void;
  onSearch: (value: string) => void;
  query: string;
}) {
  return (
    <section className="rounded-xl border border-soft-border bg-white p-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <label className="flex h-[42px] min-w-0 flex-1 items-center gap-2 rounded-full bg-pale-gray px-4 text-sm text-neutral-gray">
          <Icon name="search" size={15} />
          <input
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-neutral-gray"
            onChange={(event) => onSearch(event.target.value)}
            placeholder="搜索素材标题、正文、摘要、标签..."
            type="search"
            value={query}
          />
        </label>
        <div className="flex h-[42px] gap-2">
          <button
            aria-label="网格视图"
            className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-pale-gray transition active:scale-[0.96]"
            type="button"
          >
            <Icon name="grid" size={15} />
          </button>
          <button
            className="flex h-[42px] items-center gap-2 rounded-full bg-near-black px-4 text-sm font-semibold text-white transition active:scale-[0.98]"
            type="button"
          >
            <Icon name="download" size={15} />
            批量导入
          </button>
          <button
            className="flex h-[42px] items-center gap-2 rounded-full bg-apple-blue px-4 text-sm font-semibold text-white transition active:scale-[0.98]"
            onClick={onCreate}
            type="button"
          >
            <Icon name="plus" size={15} />
            新建素材
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2.5">
        <FilterChip>
          分类：全部 <Icon className="text-neutral-gray" name="chevronDown" size={14} />
        </FilterChip>
        <FilterChip>
          状态：全部 <Icon className="text-neutral-gray" name="chevronDown" size={14} />
        </FilterChip>
        <FilterChip>
          价值评分：不限 <Icon className="text-neutral-gray" name="chevronDown" size={14} />
        </FilterChip>
        {activeTag && (
          <FilterChip active>
            标签：{activeTag} <Icon className="text-[#a1a1a6]" name="close" size={14} />
          </FilterChip>
        )}
        <button
          className="h-[34px] rounded-full border border-soft-border bg-white px-3 text-[13px] font-semibold text-neutral-gray transition active:scale-[0.98]"
          onClick={onClear}
          type="button"
        >
          清空筛选
        </button>
      </div>
    </section>
  );
}

function Checkbox({ checked = false }: { checked?: boolean }) {
  return (
    <span
      className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border ${
        checked ? "border-apple-blue bg-apple-blue text-white" : "border-mid-border bg-white"
      }`}
    >
      {checked && <Icon name="check" size={12} />}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const active = status === "待整理";
  return (
    <span
      className={`flex h-7 w-[88px] items-center justify-center rounded-full text-xs font-semibold ${
        active ? "bg-pale-gray text-apple-blue" : "border border-soft-border bg-white text-near-black"
      }`}
    >
      {status}
    </span>
  );
}

function TagPill({ label, dark = false }: { label: string; dark?: boolean }) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded-full px-2.5 text-xs font-semibold ${
        dark ? "bg-near-black text-white" : "border border-soft-border bg-white text-near-black"
      }`}
    >
      {label}
    </span>
  );
}

function MaterialTable({
  currentPage,
  onArchive,
  onDelete,
  onEdit,
  onNext,
  onPrev,
  onSelect,
  onSelectAll,
  rows,
  selectedIds,
  total,
  totalPages,
}: {
  currentPage: number;
  onArchive: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (row: MaterialRow) => void;
  onNext: () => void;
  onPrev: () => void;
  onSelect: (id: number) => void;
  onSelectAll: () => void;
  rows: MaterialRow[];
  selectedIds: Set<number>;
  total: number;
  totalPages: number;
}) {
  const allVisibleSelected = rows.length > 0 && rows.every((row) => selectedIds.has(row.id));

  return (
    <section className="overflow-hidden rounded-xl border border-soft-border bg-white">
      <div className="flex h-[58px] items-center justify-between px-5">
        <div className="flex items-center gap-2.5">
          <button aria-label="选择当前页素材" onClick={onSelectAll} type="button">
            <Checkbox checked={allVisibleSelected} />
          </button>
          <span className="text-[13px] font-medium text-neutral-gray">选择素材后可批量整理、归档或删除</span>
        </div>
        <div className="hidden gap-2 md:flex">
          <button className="h-8 rounded-full bg-pale-gray px-3 text-xs font-semibold" type="button">
            批量变更
          </button>
          <button className="h-8 rounded-full bg-pale-gray px-3 text-xs font-semibold" type="button">
            归档
          </button>
        </div>
      </div>

      <div className="hidden h-10 grid-cols-[18px_310px_130px_88px_58px_120px_150px_130px] items-center gap-3 bg-pale-gray px-5 text-xs font-semibold text-neutral-gray xl:grid">
        <button aria-label="选择当前页素材" onClick={onSelectAll} type="button">
          <Checkbox checked={allVisibleSelected} />
        </button>
        <span>素材</span>
        <span>分类</span>
        <span>状态</span>
        <span className="text-center">价值</span>
        <span>更新时间</span>
        <span>标签</span>
        <span className="text-right">操作</span>
      </div>

      <div className="min-h-[650px] divide-y divide-[#ececf0]">
        {rows.length === 0 && (
          <div className="flex h-[300px] items-center justify-center text-sm font-medium text-neutral-gray">
            没有匹配的素材
          </div>
        )}
        {rows.map((row) => {
          const selected = selectedIds.has(row.id);
          return (
          <article
            className={`grid gap-3 px-5 py-4 xl:h-[74px] xl:grid-cols-[18px_310px_130px_88px_58px_120px_150px_130px] xl:items-center xl:py-0 ${
              selected ? "bg-pale-gray" : "bg-white"
            }`}
            key={row.id}
          >
            <button aria-label={`选择 ${row.title}`} onClick={() => onSelect(row.id)} type="button">
              <Checkbox checked={selected} />
            </button>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold">{row.title}</h3>
              <p className="mt-1 truncate text-xs text-neutral-gray">{row.summary}</p>
            </div>
            <span className="text-[13px] font-medium">{row.category}</span>
            <StatusPill status={row.status} />
            <span className={`font-display text-[22px] font-semibold xl:text-center ${row.score >= 5 ? "text-apple-blue" : ""}`}>
              {row.score}
            </span>
            <span className="text-[13px] font-medium text-neutral-gray">{row.time}</span>
            <div className="flex gap-1.5">
              {row.tags.map((tag, index) => (
                <TagPill dark={index === 0 && selected} key={tag} label={tag} />
              ))}
            </div>
            <div className="flex justify-end gap-1.5">
              <button
                aria-label="编辑素材"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-apple-blue transition active:scale-[0.96]"
                onClick={() => onEdit(row)}
                type="button"
              >
                <Icon name="edit" size={15} />
              </button>
              <button
                aria-label="归档素材"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white transition active:scale-[0.96]"
                onClick={() => onArchive(row.id)}
                type="button"
              >
                <Icon name="archive" size={15} />
              </button>
              <button
                aria-label="删除素材"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white transition active:scale-[0.96]"
                onClick={() => onDelete(row.id)}
                type="button"
              >
                <Icon name="trash" size={15} />
              </button>
            </div>
          </article>
          );
        })}
      </div>

      <div className="flex h-[54px] items-center justify-between px-5">
        <span className="text-[13px] font-medium text-neutral-gray">
          共 {total} 条 · 每页 {pageSize} 条 · 当前第 {currentPage} 页 / 共 {totalPages} 页
        </span>
        <div className="flex gap-2">
          <button
            aria-label="上一页"
            className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-pale-gray transition disabled:opacity-40 active:scale-[0.96]"
            disabled={currentPage <= 1}
            onClick={onPrev}
            type="button"
          >
            <Icon name="chevronLeft" size={16} />
          </button>
          <button
            aria-label="下一页"
            className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-near-black text-white transition disabled:opacity-40 active:scale-[0.96]"
            disabled={currentPage >= totalPages}
            onClick={onNext}
            type="button"
          >
            <Icon name="chevronRight" size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}

function EditModal({
  initialRow,
  onClose,
}: {
  initialRow: MaterialRow | null;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/35 px-4 py-6"
      onMouseDown={onClose}
    >
      <section
        className="max-h-[calc(100dvh-48px)] w-full max-w-[684px] overflow-y-auto rounded-[28px] border border-soft-border bg-white p-7 shadow-[0_24px_60px_rgba(0,0,0,0.25)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-3xl font-semibold">编辑素材</h2>
            <p className="mt-1 text-xs font-semibold text-neutral-gray">PUT /api/materials/{"{material_id}"}</p>
          </div>
          <button aria-label="关闭" className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-pale-gray transition active:scale-[0.96]" onClick={onClose} type="button">
            <Icon name="close" size={17} />
          </button>
        </div>

        <form className="mt-[18px] space-y-[18px]" onSubmit={(event) => event.preventDefault()}>
          <Field label="标题">
            <input className="field-control" defaultValue={initialRow?.title ?? "未命名素材"} />
          </Field>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="分类 / 子类">
              <button className="field-control flex items-center justify-between text-left" type="button">
                {initialRow?.category ?? "世界观 / 政治体系"} <Icon className="text-neutral-gray" name="chevronDown" size={15} />
              </button>
            </Field>
            <Field label="整理状态">
              <button className="field-control flex items-center justify-between text-left" type="button">
                {initialRow?.status ?? "待整理"} <Icon className="text-neutral-gray" name="chevronDown" size={15} />
              </button>
            </Field>
          </div>
          <Field label="摘要">
            <textarea
              className="field-control min-h-[86px] resize-none py-3.5 leading-[1.45]"
              defaultValue={initialRow?.summary ?? "记录素材摘要，方便后续检索与复用。"}
            />
          </Field>
          <Field label="正文内容">
            <textarea
              className="field-control min-h-[190px] resize-none py-3.5 leading-6"
              defaultValue="皇权并非垂直压倒地方，而是通过贡赋、军权与官僚任命维持一种精密的张力。真正危险的不是藩王反叛，而是三方都相信自己仍在秩序之内。"
            />
          </Field>
          <div className="grid gap-3.5 sm:grid-cols-[1fr_168px]">
            <Field label="标签">
              <div className="field-control flex items-center gap-2">
                {(initialRow?.tags ?? ["帝国", "权谋"]).map((tag, index) => (
                  <TagPill dark={index === 0} key={tag} label={tag} />
                ))}
              </div>
            </Field>
            <Field label="价值评分">
              <button className="field-control flex items-center justify-between text-left text-apple-blue" type="button">
                {initialRow?.score ?? 5} / 5 <Icon name="star" size={15} />
              </button>
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button className="h-[46px] rounded-full bg-pale-gray text-sm font-semibold transition active:scale-[0.98]" onClick={onClose} type="button">
              取消
            </button>
            <button className="flex h-[46px] items-center justify-center gap-2 rounded-full bg-apple-blue text-sm font-semibold text-white transition active:scale-[0.98]" type="submit">
              <Icon name="save" size={15} />
              保存修改
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-semibold text-neutral-gray">{label}</span>
      {children}
    </label>
  );
}

export function MaterialLibrary() {
  const [activeTag, setActiveTag] = useState<string | null>("帝国");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingRow, setEditingRow] = useState<MaterialRow | null | undefined>(undefined);
  const [items, setItems] = useState(rows);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set([1]));

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((row) => {
      const matchesTag = !activeTag || row.tags.includes(activeTag);
      const matchesQuery =
        !normalizedQuery ||
        [row.title, row.summary, row.category, row.status, ...row.tags]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesTag && matchesQuery;
    });
  }, [activeTag, items, query]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pageRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTag, query]);

  const toggleSelect = (id: number) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      const allSelected = pageRows.length > 0 && pageRows.every((row) => next.has(row.id));
      pageRows.forEach((row) => {
        if (allSelected) {
          next.delete(row.id);
        } else {
          next.add(row.id);
        }
      });
      return next;
    });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto flex min-h-[100dvh] max-w-[1192px] flex-col gap-5 px-4 py-6 sm:px-8">
        <Toolbar
          activeTag={activeTag}
          onClear={() => {
            setActiveTag(null);
            setQuery("");
          }}
          onCreate={() => setEditingRow(null)}
          onSearch={setQuery}
          query={query}
        />
        <MaterialTable
          currentPage={currentPage}
          onArchive={(id) =>
            setItems((current) =>
              current.map((row) => (row.id === id ? { ...row, status: "已归档" } : row))
            )
          }
          onDelete={(id) => {
            setItems((current) => current.filter((row) => row.id !== id));
            setSelectedIds((current) => {
              const next = new Set(current);
              next.delete(id);
              return next;
            });
          }}
          onEdit={setEditingRow}
          onNext={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
          onPrev={() => setCurrentPage((page) => Math.max(1, page - 1))}
          onSelect={toggleSelect}
          onSelectAll={toggleSelectAllVisible}
          rows={pageRows}
          selectedIds={selectedIds}
          total={filteredRows.length}
          totalPages={totalPages}
        />
      </div>
      {editingRow !== undefined && <EditModal initialRow={editingRow} onClose={() => setEditingRow(undefined)} />}
    </DashboardLayout>
  );
}
