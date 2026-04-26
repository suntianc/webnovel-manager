"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Icon } from "@/components/ui/Icon";
import {
  useCategories,
  useCreateMaterial,
  useDeleteMaterial,
  useMaterials,
  useTags,
  useUpdateMaterial,
} from "@/hooks/useApi";
import type { CategoriesResponse, Material, MaterialCreate, MaterialStatus, MaterialUpdate, Tag } from "@/types";

const pageSize = 20;
const statusOptions: MaterialStatus[] = ["待整理", "已整理", "采集中", "已使用", "已归档", "已废弃"];
type ViewMode = "list" | "card";
type TagTab = "内容标签" | "人物标签";

type FormState = {
  title: string;
  category: string;
  subcategory: string;
  status: MaterialStatus;
  summary: string;
  content: string;
  tags: string;
  value_score: number;
};

function toFormState(material: Material | null): FormState {
  return {
    title: material?.title ?? "",
    category: material?.category ?? "世界观",
    subcategory: material?.subcategory ?? "政治体系",
    status: material?.status ?? "待整理",
    summary: material?.summary ?? "",
    content: material?.content ?? "",
    tags: material?.tags.join("，") ?? "",
    value_score: material?.value_score ?? 3,
  };
}

function parseTags(value: string) {
  return value
    .replaceAll("，", ",")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const scoreRanges = [
  { label: "不限", min: null, max: null },
  { label: "0–1 分", min: 0, max: 1 },
  { label: "2–3 分", min: 2, max: 3 },
  { label: "4–5 分", min: 4, max: 5 },
];

function DropdownPopover({
  children,
  onClose,
  width = "w-[200px]",
}: {
  children: React.ReactNode;
  onClose: () => void;
  width?: string;
}) {
  return (
    <>
      <div className="fixed inset-0 z-20" onMouseDown={onClose} />
      <div
        className={`absolute left-0 top-full z-20 mt-1 ${width} rounded-xl border border-soft-border bg-white p-1.5 shadow-[0_18px_42px_rgba(0,0,0,0.18)]`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-0.5">{children}</div>
      </div>
    </>
  );
}

function DropdownOption({
  active = false,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex h-[38px] w-full items-center justify-between rounded-[10px] px-3 text-left text-[13px] font-semibold transition active:scale-[0.99] ${
        active ? "bg-pale-gray text-apple-blue" : "text-near-black hover:bg-pale-gray"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
      {active && <Icon name="check" size={13} />}
    </button>
  );
}

function FilterChip({
  children,
  active = false,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={`flex h-[34px] items-center gap-2 rounded-full px-3 text-[13px] font-semibold transition active:scale-[0.98] ${
        active ? "bg-near-black text-white" : "bg-pale-gray text-near-black"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function ViewToggle({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div className="flex h-[42px] items-center rounded-full bg-pale-gray p-1">
      <button
        aria-label="列表视图"
        className={`flex h-[34px] w-[34px] items-center justify-center rounded-full transition active:scale-[0.96] ${
          mode === "list" ? "bg-white text-near-black shadow-sm" : "text-neutral-gray"
        }`}
        onClick={() => onChange("list")}
        type="button"
      >
        <Icon name="list" size={15} />
      </button>
      <button
        aria-label="卡片视图"
        className={`flex h-[34px] w-[34px] items-center justify-center rounded-full transition active:scale-[0.96] ${
          mode === "card" ? "bg-near-black text-white shadow-sm" : "text-neutral-gray"
        }`}
        onClick={() => onChange("card")}
        type="button"
      >
        <Icon name="grid" size={15} />
      </button>
    </div>
  );
}

function TagPickerPopover({
  activeTag,
  onApply,
  onClose,
  tags,
}: {
  activeTag: string | null;
  onApply: (tag: string | null) => void;
  onClose: () => void;
  tags: Tag[];
}) {
  const [tab, setTab] = useState<TagTab>("内容标签");
  const [search, setSearch] = useState("");
  const [draftTag, setDraftTag] = useState<string | null>(activeTag);

  const options = useMemo(() => {
    const normalized = tags
      .filter((tag) => {
        if (!tag.tag_type) {
          return true;
        }
        if (tab === "人物标签") {
          return tag.tag_type.includes("人物") || tag.tag_type.toLowerCase().includes("character");
        }
        return !tag.tag_type.includes("人物") && !tag.tag_type.toLowerCase().includes("character");
      })
      .map((tag) => tag.name)
      .filter((name) => name.includes(search.trim()));

    return Array.from(new Set(normalized)).slice(0, 8);
  }, [search, tab, tags]);

  return (
    <div className="absolute left-0 top-[42px] z-20 w-[360px] rounded-xl border border-soft-border bg-white p-[18px] shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-near-black">选择标签</h3>
        <button
          aria-label="关闭标签选择"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-pale-gray text-neutral-gray"
          onClick={onClose}
          type="button"
        >
          <Icon name="close" size={14} />
        </button>
      </div>
      <label className="mt-3 flex h-[34px] items-center gap-2 rounded-full bg-pale-gray px-3 text-xs text-neutral-gray">
        <Icon name="search" size={13} />
        <input
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-neutral-gray"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="搜索标签名称..."
          value={search}
        />
      </label>
      <div className="mt-3 flex gap-2">
        {(["内容标签", "人物标签"] as TagTab[]).map((item) => (
          <button
            className={`h-7 rounded-full px-3 text-xs font-semibold ${
              tab === item ? "bg-near-black text-white" : "bg-pale-gray text-neutral-gray"
            }`}
            key={item}
            onClick={() => setTab(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>
      <div className="mt-3 space-y-2">
        {options.length === 0 && (
          <div className="flex h-[112px] items-center justify-center rounded-[12px] bg-pale-gray text-xs font-semibold text-neutral-gray">
            暂无匹配标签
          </div>
        )}
        {options.map((tag) => (
          <button
            className="flex h-[34px] w-full items-center justify-between rounded-[12px] border border-soft-border bg-white px-3 text-left text-xs font-semibold transition active:scale-[0.99]"
            key={tag}
            onClick={() => setDraftTag((current) => (current === tag ? null : tag))}
            type="button"
          >
            <span>{tag}</span>
            <span
              className={`flex h-[18px] w-[18px] items-center justify-center rounded-full border ${
                draftTag === tag ? "border-apple-blue bg-apple-blue text-white" : "border-mid-border bg-white"
              }`}
            >
              {draftTag === tag && <Icon name="check" size={11} />}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-[1fr_1.4fr] gap-2">
        <button
          className="h-[34px] rounded-full bg-pale-gray text-xs font-semibold text-near-black"
          onClick={onClose}
          type="button"
        >
          取消
        </button>
        <button
          className="h-[34px] rounded-full bg-apple-blue text-xs font-semibold text-white"
          onClick={() => onApply(draftTag)}
          type="button"
        >
          应用 {draftTag ? 1 : 0} 个标签
        </button>
      </div>
    </div>
  );
}

function Toolbar({
  activeTag,
  availableTags,
  category,
  categories,
  isFetching,
  maxScore,
  minScore,
  onCategoryChange,
  onClear,
  onCreate,
  onScoreChange,
  onStatusChange,
  onTagApply,
  onSearch,
  onViewModeChange,
  query,
  statusFilter,
  subcategory,
  viewMode,
}: {
  activeTag: string | null;
  availableTags: Tag[];
  category: string | null;
  categories: CategoriesResponse | undefined;
  isFetching: boolean;
  maxScore: number | null;
  minScore: number | null;
  onCategoryChange: (category: string | null, subcategory: string | null) => void;
  onClear: () => void;
  onCreate: () => void;
  onScoreChange: (min: number | null, max: number | null) => void;
  onStatusChange: (status: string | null) => void;
  onTagApply: (tag: string | null) => void;
  onSearch: (value: string) => void;
  onViewModeChange: (mode: ViewMode) => void;
  query: string;
  statusFilter: string | null;
  subcategory: string | null;
  viewMode: ViewMode;
}) {
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [scoreOpen, setScoreOpen] = useState(false);

  const categoryEntries = useMemo(
    () => Object.entries(categories?.categories ?? {}),
    [categories]
  );

  const activeCategoryLabel = category || "全部";
  const activeStatusLabel = statusFilter || "全部";
  const activeScoreLabel = scoreRanges.find(
    (r) => r.min === minScore && r.max === maxScore
  )?.label ?? "不限";

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
          <ViewToggle mode={viewMode} onChange={onViewModeChange} />
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
        <div className="relative">
          <FilterChip active={categoryOpen} onClick={() => setCategoryOpen((open) => !open)}>
            分类：{activeCategoryLabel} <Icon className="text-neutral-gray" name="chevronDown" size={14} />
          </FilterChip>
          {categoryOpen && (
            <DropdownPopover onClose={() => setCategoryOpen(false)}>
              <DropdownOption
                active={!category}
                onClick={() => { onCategoryChange(null, null); setCategoryOpen(false); }}
              >
                全部
              </DropdownOption>
              {categoryEntries.map(([catName]) => (
                <DropdownOption
                  active={category === catName && !subcategory}
                  key={catName}
                  onClick={() => { onCategoryChange(catName, null); setCategoryOpen(false); }}
                >
                  {catName}
                </DropdownOption>
              ))}
            </DropdownPopover>
          )}
        </div>
        <div className="relative">
          <FilterChip active={statusOpen} onClick={() => setStatusOpen((open) => !open)}>
            状态：{activeStatusLabel} <Icon className="text-neutral-gray" name="chevronDown" size={14} />
          </FilterChip>
          {statusOpen && (
            <DropdownPopover onClose={() => setStatusOpen(false)}>
              <DropdownOption
                active={!statusFilter}
                onClick={() => { onStatusChange(null); setStatusOpen(false); }}
              >
                全部
              </DropdownOption>
              {statusOptions.map((status) => (
                <DropdownOption
                  active={statusFilter === status}
                  key={status}
                  onClick={() => { onStatusChange(status); setStatusOpen(false); }}
                >
                  {status}
                </DropdownOption>
              ))}
            </DropdownPopover>
          )}
        </div>
        <div className="relative">
          <FilterChip active={scoreOpen} onClick={() => setScoreOpen((open) => !open)}>
            价值评分：{activeScoreLabel} <Icon className="text-neutral-gray" name="chevronDown" size={14} />
          </FilterChip>
          {scoreOpen && (
            <DropdownPopover onClose={() => setScoreOpen(false)} width="w-[180px]">
              {scoreRanges.map((range) => (
                <DropdownOption
                  active={minScore === range.min && maxScore === range.max}
                  key={range.label}
                  onClick={() => { onScoreChange(range.min, range.max); setScoreOpen(false); }}
                >
                  {range.label}
                </DropdownOption>
              ))}
            </DropdownPopover>
          )}
        </div>
        <div className="relative">
          <FilterChip active={tagPickerOpen} onClick={() => setTagPickerOpen((open) => !open)}>
            <Icon className={tagPickerOpen ? "text-white" : "text-apple-blue"} name="tag" size={14} />
            选择标签
          </FilterChip>
          {tagPickerOpen && (
            <TagPickerPopover
              activeTag={activeTag}
              onApply={(tag) => {
                onTagApply(tag);
                setTagPickerOpen(false);
              }}
              onClose={() => setTagPickerOpen(false)}
              tags={availableTags}
            />
          )}
        </div>
        {activeTag && (
          <FilterChip active onClick={() => onTagApply(null)}>
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
        {isFetching && (
          <span className="flex h-[34px] items-center rounded-full bg-pale-gray px-3 text-[13px] font-semibold text-neutral-gray">
            正在同步
          </span>
        )}
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

function TableSkeleton() {
  return (
    <div className="min-h-[650px] divide-y divide-[#ececf0]">
      {Array.from({ length: 5 }).map((_, index) => (
        <div className="grid gap-3 px-5 py-4 xl:h-[74px] xl:grid-cols-[18px_310px_130px_88px_58px_120px_150px_130px] xl:items-center xl:py-0" key={index}>
          <div className="h-[18px] w-[18px] rounded bg-pale-gray" />
          <div className="space-y-2">
            <div className="h-4 w-40 rounded bg-pale-gray" />
            <div className="h-3 w-56 rounded bg-pale-gray" />
          </div>
          <div className="h-4 w-24 rounded bg-pale-gray" />
          <div className="h-7 w-[88px] rounded-full bg-pale-gray" />
          <div className="h-5 w-8 rounded bg-pale-gray" />
          <div className="h-4 w-20 rounded bg-pale-gray" />
          <div className="h-7 w-24 rounded-full bg-pale-gray" />
          <div className="h-8 w-24 rounded-full bg-pale-gray" />
        </div>
      ))}
    </div>
  );
}

function MaterialTable({
  currentPage,
  isDeleting,
  isLoading,
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
  isDeleting: boolean;
  isLoading: boolean;
  onArchive: (material: Material) => void;
  onDelete: (id: number) => void;
  onEdit: (material: Material) => void;
  onNext: () => void;
  onPrev: () => void;
  onSelect: (id: number) => void;
  onSelectAll: () => void;
  rows: Material[];
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

      {isLoading ? (
        <TableSkeleton />
      ) : (
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
                  <p className="mt-1 truncate text-xs text-neutral-gray">
                    {row.summary || row.content.slice(0, 36) || "暂无摘要"}
                  </p>
                </div>
                <span className="text-[13px] font-medium">
                  {[row.category, row.subcategory].filter(Boolean).join(" / ") || "未分类"}
                </span>
                <StatusPill status={row.status} />
                <span className={`font-display text-[22px] font-semibold xl:text-center ${row.value_score >= 5 ? "text-apple-blue" : ""}`}>
                  {row.value_score}
                </span>
                <span className="text-[13px] font-medium text-neutral-gray">{formatTime(row.updated_at)}</span>
                <div className="flex gap-1.5 overflow-hidden">
                  {row.tags.length > 0 ? (
                    row.tags.slice(0, 2).map((tag) => (
                      <TagPill dark={false} key={tag} label={tag} />
                    ))
                  ) : (
                    <span className="text-xs font-medium text-neutral-gray">无标签</span>
                  )}
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
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white transition disabled:opacity-40 active:scale-[0.96]"
                    disabled={row.status === "已归档"}
                    onClick={() => onArchive(row)}
                    type="button"
                  >
                    <Icon name="archive" size={15} />
                  </button>
                  <button
                    aria-label="删除素材"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white transition disabled:opacity-40 active:scale-[0.96]"
                    disabled={isDeleting}
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
      )}

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

function CardSkeleton() {
  return (
    <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className="h-[170px] rounded-xl border border-soft-border bg-white p-4" key={index}>
          <div className="h-3 w-28 rounded bg-pale-gray" />
          <div className="mt-4 h-5 w-40 rounded bg-pale-gray" />
          <div className="mt-3 h-3 w-full rounded bg-pale-gray" />
          <div className="mt-2 h-3 w-3/4 rounded bg-pale-gray" />
          <div className="mt-8 h-7 w-24 rounded-full bg-pale-gray" />
        </div>
      ))}
    </div>
  );
}

function MaterialCards({
  currentPage,
  isDeleting,
  isLoading,
  onArchive,
  onDelete,
  onEdit,
  onNext,
  onPrev,
  onSelect,
  rows,
  selectedIds,
  total,
  totalPages,
}: {
  currentPage: number;
  isDeleting: boolean;
  isLoading: boolean;
  onArchive: (material: Material) => void;
  onDelete: (id: number) => void;
  onEdit: (material: Material) => void;
  onNext: () => void;
  onPrev: () => void;
  onSelect: (id: number) => void;
  rows: Material[];
  selectedIds: Set<number>;
  total: number;
  totalPages: number;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-soft-border bg-white">
      <div className="flex h-[54px] items-center justify-between px-5">
        <span className="text-[13px] font-medium text-neutral-gray">
          卡片视图 · 共 {total} 条 · 每页 {pageSize} 条 · 当前第 {currentPage} 页 / 共 {totalPages} 页
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

      {isLoading ? (
        <CardSkeleton />
      ) : (
        <div className="min-h-[650px] p-5">
          {rows.length === 0 && (
            <div className="flex h-[300px] items-center justify-center text-sm font-medium text-neutral-gray">
              没有匹配的素材
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((row) => {
              const selected = selectedIds.has(row.id);
              return (
                <article
                  className={`flex h-[174px] flex-col rounded-xl border p-4 transition ${
                    selected
                      ? "border-soft-border bg-pale-gray"
                      : "border-soft-border bg-white hover:border-mid-border"
                  }`}
                  key={row.id}
                >
                  <button
                    className="flex min-h-0 flex-1 flex-col text-left"
                    onClick={() => onSelect(row.id)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="truncate text-xs font-semibold text-neutral-gray">
                        {[row.category, row.subcategory].filter(Boolean).join(" / ") || "未分类"}
                      </span>
                      <span className={`font-display text-[13px] font-semibold ${row.value_score >= 5 ? "text-apple-blue" : "text-near-black"}`}>
                        {row.value_score} / 5
                      </span>
                    </div>
                    <h3 className="mt-2 truncate text-[20px] font-semibold leading-6 text-near-black">
                      {row.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-[1.55] text-neutral-gray">
                      {row.summary || row.content.slice(0, 96) || "暂无摘要"}
                    </p>
                  </button>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 gap-1.5 overflow-hidden">
                      {row.tags.length > 0 ? (
                        row.tags.slice(0, 2).map((tag) => (
                          <TagPill dark={false} key={tag} label={tag} />
                        ))
                      ) : (
                        <span className="text-xs font-medium text-neutral-gray">{row.status}</span>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1.5">
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
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white transition disabled:opacity-40 active:scale-[0.96]"
                        disabled={row.status === "已归档"}
                        onClick={() => onArchive(row)}
                        type="button"
                      >
                        <Icon name="archive" size={15} />
                      </button>
                      <button
                        aria-label="删除素材"
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white transition disabled:opacity-40 active:scale-[0.96]"
                        disabled={isDeleting}
                        onClick={() => onDelete(row.id)}
                        type="button"
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function EditModal({
  initialMaterial,
  isSaving,
  onClose,
  onSave,
  categories,
}: {
  initialMaterial: Material | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (data: FormState) => void;
  categories: CategoriesResponse | undefined;
}) {
  const [form, setForm] = useState<FormState>(() => toFormState(initialMaterial));

  const categoryOptions = useMemo(
    () => Object.keys(categories?.categories ?? {}),
    [categories]
  );

  const subcategoryOptions = useMemo(
    () => categories?.categories[form.category] ?? [],
    [categories, form.category]
  );

  useEffect(() => {
    setForm(toFormState(initialMaterial));
  }, [initialMaterial]);

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

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

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
            <h2 className="font-display text-3xl font-semibold">{initialMaterial ? "编辑素材" : "新建素材"}</h2>
            <p className="mt-1 text-xs font-semibold text-neutral-gray">
              {initialMaterial ? `PUT /api/materials/${initialMaterial.id}` : "POST /api/materials"}
            </p>
          </div>
          <button aria-label="关闭" className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-pale-gray transition active:scale-[0.96]" onClick={onClose} type="button">
            <Icon name="close" size={17} />
          </button>
        </div>

        <form className="mt-[18px] space-y-[18px]" onSubmit={(event) => {
          event.preventDefault();
          onSave(form);
        }}>
          <Field label="标题">
            <input
              className="field-control"
              onChange={(event) => update("title", event.target.value)}
              required
              value={form.title}
            />
          </Field>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="分类 / 子类">
              <div className="grid grid-cols-2 gap-2">
                <FormSelect
                  onChange={(val) => {
                    update("category", val);
                    update("subcategory", "");
                  }}
                  options={categoryOptions.map((c) => ({ label: c, value: c }))}
                  value={form.category}
                />
                <FormSelect
                  onChange={(val) => update("subcategory", val)}
                  options={subcategoryOptions.map((s) => ({ label: s, value: s }))}
                  value={form.subcategory}
                />
              </div>
            </Field>
            <Field label="整理状态">
              <FormSelect
                options={statusOptions.map((s) => ({ label: s, value: s }))}
                onChange={(val) => update("status", val as MaterialStatus)}
                value={form.status}
              />
            </Field>
          </div>
          <Field label="摘要">
            <textarea
              className="field-control min-h-[86px] resize-none py-3.5 leading-[1.45]"
              onChange={(event) => update("summary", event.target.value)}
              value={form.summary}
            />
          </Field>
          <Field label="正文内容">
            <textarea
              className="field-control min-h-[190px] resize-none py-3.5 leading-6"
              onChange={(event) => update("content", event.target.value)}
              required
              value={form.content}
            />
          </Field>
          <div className="grid gap-3.5 sm:grid-cols-[1fr_168px]">
            <Field label="标签">
              <input
                className="field-control"
                onChange={(event) => update("tags", event.target.value)}
                placeholder="帝国，权谋"
                value={form.tags}
              />
            </Field>
            <Field label="价值评分">
              <FormSelect
                options={[0, 1, 2, 3, 4, 5].map((score) => ({
                  label: `${score} / 5`,
                  value: String(score),
                }))}
                onChange={(val) => update("value_score", Number(val))}
                value={String(form.value_score)}
              />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button className="h-[46px] rounded-full bg-pale-gray text-sm font-semibold transition active:scale-[0.98]" onClick={onClose} type="button">
              取消
            </button>
            <button
              className="flex h-[46px] items-center justify-center gap-2 rounded-full bg-apple-blue text-sm font-semibold text-white transition disabled:opacity-60 active:scale-[0.98]"
              disabled={isSaving}
              type="submit"
            >
              <Icon name="save" size={15} />
              {isSaving ? "保存中" : "保存修改"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function FormSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const currentLabel = options.find((o) => o.value === value)?.label ?? value;

  return (
    <div className="relative">
      <button
        className="field-control flex items-center justify-between"
        onClick={() => setOpen((o) => !o)}
        type="button"
      >
        <span className={open ? "text-apple-blue" : ""}>{currentLabel}</span>
        <Icon
          className={`transition ${open ? "text-apple-blue" : "text-neutral-gray"}`}
          name="chevronDown"
          size={15}
        />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onMouseDown={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-30 mt-1 w-full rounded-xl border border-soft-border bg-white p-1.5 shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
            <div className="flex flex-col gap-0.5">
              {options.map((opt) => (
                <button
                  className={`flex h-[38px] w-full items-center justify-between rounded-[10px] px-3 text-left text-[13px] font-semibold transition active:scale-[0.99] ${
                    opt.value === value
                      ? "bg-pale-gray text-apple-blue"
                      : "text-near-black hover:bg-pale-gray"
                  }`}
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  type="button"
                >
                  {opt.label}
                  {opt.value === value && <Icon name="check" size={13} />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
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
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [minScore, setMinScore] = useState<number | null>(null);
  const [maxScore, setMaxScore] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingMaterial, setEditingMaterial] = useState<Material | null | undefined>(undefined);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const materialsQuery = useMaterials({
    keyword: query || undefined,
    category: category || undefined,
    subcategory: subcategory || undefined,
    status: statusFilter || undefined,
    min_score: minScore ?? undefined,
    max_score: maxScore ?? undefined,
    tag: activeTag || undefined,
    page: currentPage,
    limit: pageSize,
  });
  const tagsQuery = useTags();
  const categoriesQuery = useCategories();
  const createMaterial = useCreateMaterial();
  const updateMaterial = useUpdateMaterial();
  const deleteMaterial = useDeleteMaterial();

  const availableTags = useMemo<Tag[]>(() => {
    const apiTags = tagsQuery.data ?? [];
    const apiTagNames = new Set(apiTags.map((tag) => tag.name));
    const sourceRows = materialsQuery.data?.data ?? [];
    const materialTags = sourceRows
      .flatMap((material: Material) => material.tags)
      .filter((tag: string) => tag && !apiTagNames.has(tag))
      .map((tag: string, index: number) => ({
        id: -index - 1,
        name: tag,
        tag_type: "内容标签",
        created_at: "",
      }));

    return [...apiTags, ...materialTags];
  }, [materialsQuery.data, tagsQuery.data]);

  const pageRows = materialsQuery.data?.data ?? [];
  const totalItems = materialsQuery.data?.total ?? 0;
  const totalPages = materialsQuery.data ? Math.ceil(materialsQuery.data.total / materialsQuery.data.limit) : 1;

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

  const saveMaterial = async (form: FormState) => {
    const payload: MaterialCreate | MaterialUpdate = {
      title: form.title,
      content: form.content,
      summary: form.summary,
      category: form.category,
      subcategory: form.subcategory,
      source_type: "手动",
      status: form.status,
      value_score: form.value_score,
      tags: parseTags(form.tags),
    };

    if (editingMaterial) {
      await updateMaterial.mutateAsync({ id: editingMaterial.id, data: payload });
    } else {
      await createMaterial.mutateAsync(payload as MaterialCreate);
    }
    setEditingMaterial(undefined);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto flex min-h-[100dvh] max-w-[1192px] flex-col gap-5 px-4 py-6 sm:px-8">
        <Toolbar
          activeTag={activeTag}
          availableTags={availableTags}
          category={category}
          categories={categoriesQuery.data}
          isFetching={materialsQuery.isFetching}
          maxScore={maxScore}
          minScore={minScore}
          onCategoryChange={(cat, sub) => { setCategory(cat); setSubcategory(sub); }}
          onClear={() => {
            setActiveTag(null);
            setCategory(null);
            setSubcategory(null);
            setStatusFilter(null);
            setMinScore(null);
            setMaxScore(null);
            setQuery("");
          }}
          onCreate={() => setEditingMaterial(null)}
          onScoreChange={(min, max) => { setMinScore(min); setMaxScore(max); }}
          onStatusChange={setStatusFilter}
          onTagApply={setActiveTag}
          onSearch={setQuery}
          onViewModeChange={setViewMode}
          query={query}
          statusFilter={statusFilter}
          subcategory={subcategory}
          viewMode={viewMode}
        />
        {materialsQuery.isError && (
          <div className="rounded-xl border border-soft-border bg-white p-4 text-sm font-semibold text-neutral-gray">
            素材接口暂不可用，请确认后端服务已启动。
          </div>
        )}
        {viewMode === "list" ? (
          <MaterialTable
            currentPage={currentPage}
            isDeleting={deleteMaterial.isPending}
            isLoading={materialsQuery.isLoading}
            onArchive={(material) =>
              updateMaterial.mutate({
                id: material.id,
                data: { status: "已归档" },
              })
            }
            onDelete={(id) => {
              if (window.confirm("确认删除这条素材吗？")) {
                deleteMaterial.mutate(id);
                setSelectedIds((current) => {
                  const next = new Set(current);
                  next.delete(id);
                  return next;
                });
              }
            }}
            onEdit={setEditingMaterial}
            onNext={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            onPrev={() => setCurrentPage((page) => Math.max(1, page - 1))}
            onSelect={toggleSelect}
            onSelectAll={toggleSelectAllVisible}
            rows={pageRows}
            selectedIds={selectedIds}
            total={totalItems}
            totalPages={totalPages}
          />
        ) : (
          <MaterialCards
            currentPage={currentPage}
            isDeleting={deleteMaterial.isPending}
            isLoading={materialsQuery.isLoading}
            onArchive={(material) =>
              updateMaterial.mutate({
                id: material.id,
                data: { status: "已归档" },
              })
            }
            onDelete={(id) => {
              if (window.confirm("确认删除这条素材吗？")) {
                deleteMaterial.mutate(id);
                setSelectedIds((current) => {
                  const next = new Set(current);
                  next.delete(id);
                  return next;
                });
              }
            }}
            onEdit={setEditingMaterial}
            onNext={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            onPrev={() => setCurrentPage((page) => Math.max(1, page - 1))}
            onSelect={toggleSelect}
            rows={pageRows}
            selectedIds={selectedIds}
            total={totalItems}
            totalPages={totalPages}
          />
        )}
      </div>
      {editingMaterial !== undefined && (
        <EditModal
          initialMaterial={editingMaterial}
          categories={categoriesQuery.data}
          isSaving={createMaterial.isPending || updateMaterial.isPending}
          onClose={() => setEditingMaterial(undefined)}
          onSave={saveMaterial}
        />
      )}
    </DashboardLayout>
  );
}
