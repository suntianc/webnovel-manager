"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Icon } from "@/components/ui/Icon";
import { useDeleteNovel, useNovels, useUploadNovel, useWorkflows } from "@/hooks/useApi";
import type { NovelSource, WorkflowRun } from "@/types";

const statusOptions = [
  { label: "全部状态", value: "" },
  { label: "已上传", value: "uploaded" },
  { label: "解析中", value: "processing" },
  { label: "已解析", value: "parsed" },
  { label: "处理中", value: "running" },
  { label: "等待确认", value: "waiting_review" },
  { label: "已完成", value: "completed" },
  { label: "失败", value: "failed" },
];

const statusText: Record<string, string> = {
  uploaded: "已上传",
  processing: "解析中",
  parsed: "已解析",
  failed: "失败",
  pending: "等待中",
  running: "处理中",
  waiting_review: "等待确认",
  completed: "已完成",
  canceled: "已取消",
};

const statusClass: Record<string, string> = {
  running: "bg-[#e8f3ff] text-apple-blue",
  parsed: "bg-pale-gray text-neutral-gray",
  processing: "bg-[#e8f3ff] text-apple-blue",
  uploaded: "bg-pale-gray text-neutral-gray",
  waiting_review: "bg-[#ecfff1] text-[#248a3d]",
  completed: "bg-[#ecfff1] text-[#248a3d]",
  failed: "bg-[#fff3e8] text-[#bf4800]",
  canceled: "bg-pale-gray text-neutral-gray",
  pending: "bg-pale-gray text-neutral-gray",
};

function latestWorkflowFor(novel: NovelSource, workflows: WorkflowRun[]) {
  return workflows
    .filter((workflow) => workflow.biz_type === "novel" && workflow.biz_id === novel.id)
    .sort((a, b) => b.id - a.id)[0];
}

function displayStatus(novel: NovelSource, workflow?: WorkflowRun) {
  if (workflow && workflow.status !== "completed") return workflow.status;
  if (workflow?.status === "completed") return "completed";
  return novel.status;
}

function displayProgress(novel: NovelSource, workflow?: WorkflowRun) {
  if (workflow) return workflow.progress;
  if (novel.status === "processing") return 30;
  if (novel.status === "parsed") return novel.part_count > 0 ? 100 : 0;
  return 0;
}

export function NovelProcessing() {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  const novelsQuery = useNovels({
    keyword: keyword || undefined,
    status: status && !["running", "waiting_review", "completed"].includes(status) ? status : undefined,
    page: 1,
    limit: 12,
  });
  const workflowsQuery = useWorkflows({ biz_type: "novel", limit: 100 });
  const uploadMutation = useUploadNovel();
  const deleteMutation = useDeleteNovel();

  const workflows = useMemo(() => workflowsQuery.data?.data ?? [], [workflowsQuery.data?.data]);
  const rows = useMemo(() => {
    const novels = novelsQuery.data?.data ?? [];
    if (!["running", "waiting_review", "completed"].includes(status)) return novels;
    return novels.filter((novel) => latestWorkflowFor(novel, workflows)?.status === status);
  }, [novelsQuery.data?.data, status, workflows]);

  const activeStatus = statusOptions.find((option) => option.value === status)?.label ?? "全部状态";

  useEffect(() => {
    if (!statusOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!statusDropdownRef.current?.contains(event.target as Node)) {
        setStatusOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [statusOpen]);

  function submitUpload() {
    if (!selectedFile) return;
    uploadMutation.mutate(selectedFile, {
      onSuccess: () => {
        setUploadOpen(false);
        setSelectedFile(null);
      },
    });
  }

  function deleteNovel(novel: NovelSource) {
    const confirmed = window.confirm(`确认删除《${novel.title}》？\n将同步删除章节拆分、分组、分析工作流和相关产物。`);
    if (!confirmed) return;
    deleteMutation.mutate(novel.id);
  }

  return (
    <DashboardLayout>
        <section className="flex min-h-full flex-col gap-5 px-8 py-6">
          <div className="rounded-[18px] border border-soft-border bg-white p-5">
            <div className="flex h-[42px] items-center gap-3">
              <label className="flex h-full min-w-0 flex-1 items-center gap-2.5 rounded-[21px] bg-pale-gray px-4 text-sm text-neutral-gray">
                <Icon name="search" size={16} />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium text-near-black outline-none placeholder:text-neutral-gray"
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="搜索小说标题、作者、文件名..."
                  type="search"
                  value={keyword}
                />
              </label>
              <button
                className="flex h-full items-center gap-2 rounded-[21px] bg-apple-blue px-4 text-sm font-semibold text-white transition active:scale-[0.98]"
                onClick={() => setUploadOpen(true)}
                type="button"
              >
                <Icon name="plus" size={15} />
                上传 EPUB
              </button>
            </div>
            <div className="relative mt-3 flex h-[34px] items-center gap-2.5" ref={statusDropdownRef}>
              <button
                className="flex h-full items-center gap-2 rounded-[17px] bg-pale-gray px-3 text-[13px] font-semibold"
                onClick={() => setStatusOpen((open) => !open)}
                type="button"
              >
                状态：{activeStatus.replace("全部状态", "全部")}
                <Icon className="text-neutral-gray" name="chevronDown" size={14} />
              </button>
              {status && (
                <button
                  className="flex h-full items-center rounded-[17px] border border-soft-border bg-white px-3 text-[13px] font-semibold text-neutral-gray"
                  onClick={() => setStatus("")}
                  type="button"
                >
                  清空筛选
                </button>
              )}
              {statusOpen && (
                <div className="absolute left-0 top-10 z-20 w-[200px] rounded-xl border border-soft-border bg-white p-1.5 shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
                  {statusOptions.map((option) => (
                    <button
                      className={`flex h-[38px] w-full items-center justify-between rounded-[10px] px-3 text-left text-[13px] font-semibold ${
                        option.value === status ? "bg-pale-gray text-near-black" : "text-near-black hover:bg-pale-gray"
                      }`}
                      key={option.value || "all"}
                      onClick={() => {
                        setStatus(option.value);
                        setStatusOpen(false);
                      }}
                      type="button"
                    >
                      {option.label}
                      {option.value === status && <Icon className="text-apple-blue" name="check" size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 rounded-[18px] border border-soft-border bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium text-neutral-gray">
                小说处理 · 共 {novelsQuery.data?.total ?? 0} 本 · 当前第 {novelsQuery.data?.page ?? 1} 页
              </p>
              <div className="flex gap-2">
                <button className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-pale-gray text-neutral-gray" type="button">
                  <Icon name="chevronLeft" size={15} />
                </button>
                <button className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-near-black text-white" type="button">
                  <Icon name="chevronRight" size={15} />
                </button>
              </div>
            </div>

            {novelsQuery.isLoading ? (
              <div className="mt-6 grid grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div className="h-[236px] rounded-[18px] bg-pale-gray" key={index} />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div className="mt-6 flex h-[360px] items-center justify-center rounded-[18px] bg-pale-gray text-sm font-semibold text-neutral-gray">
                暂无小说，先上传一本 EPUB。
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
                {rows.map((novel) => {
                  const workflow = latestWorkflowFor(novel, workflows);
                  const statusValue = displayStatus(novel, workflow);
                  const progress = displayProgress(novel, workflow);
                  const isDeleting = deleteMutation.isPending && deleteMutation.variables === novel.id;
                  return (
                    <div
                      className={`relative h-[236px] rounded-[18px] transition hover:-translate-y-0.5 hover:shadow-sm ${
                        workflow?.status === "running" ? "bg-pale-gray" : "border border-soft-border bg-white"
                      }`}
                      key={novel.id}
                    >
                      <Link className="flex h-full flex-col justify-between p-5 pr-14" href={`/novels/${novel.id}`}>
                        <div>
                          <div className="flex items-start justify-between gap-4">
                            <h2 className="min-w-0 text-balance font-display text-2xl font-semibold leading-tight text-near-black">
                              {novel.title}
                            </h2>
                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${statusClass[statusValue] ?? statusClass.pending}`}>
                              {statusText[statusValue] ?? statusValue}
                            </span>
                          </div>
                          <p className="mt-2 text-[13px] font-medium text-neutral-gray">
                            {novel.author || "作者未知"}
                          </p>
                        </div>
                        <div>
                          <p className={`text-xs font-bold ${statusValue === "failed" ? "text-[#bf4800]" : "text-near-black"}`}>
                            进度 {progress}% · {statusText[statusValue] ?? statusValue}
                          </p>
                          <div className="mt-3 h-2 rounded bg-pale-gray">
                            <div
                              className={`h-full rounded ${statusValue === "failed" ? "bg-[#bf4800]" : statusValue === "completed" || statusValue === "waiting_review" ? "bg-[#34c759]" : "bg-apple-blue"}`}
                              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                            />
                          </div>
                        </div>
                      </Link>
                      <button
                        aria-label={`删除 ${novel.title}`}
                        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-gray shadow-sm transition hover:bg-[#fff3f0] hover:text-[#bf4800] active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-45"
                        disabled={isDeleting}
                        onClick={() => deleteNovel(novel)}
                        type="button"
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

      {uploadOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 pl-0 lg:pl-[248px]">
          <div className="w-[684px] max-w-[calc(100vw-48px)] rounded-[28px] border border-soft-border bg-white p-7 shadow-[0_24px_60px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-3xl font-bold">上传 EPUB</h2>
              <button className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-pale-gray text-neutral-gray" onClick={() => setUploadOpen(false)} type="button">
                <Icon name="close" size={16} />
              </button>
            </div>
            <button
              className="mt-5 flex h-[210px] w-full flex-col items-center justify-center gap-3 rounded-[18px] border border-dashed border-soft-border bg-pale-gray px-6 text-center"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <Icon className="text-apple-blue" name="upload" size={36} />
              <span className="text-lg font-extrabold">拖入 EPUB 文件，或点击选择</span>
              <span className="max-w-[460px] text-[13px] font-medium leading-relaxed text-neutral-gray">
                支持单个 EPUB 文件，上传后自动解析书名、作者与章节目录。
              </span>
            </button>
            <input
              accept=".epub,application/epub+zip"
              className="hidden"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              ref={fileInputRef}
              type="file"
            />
            <div className="mt-4 flex h-[62px] items-center gap-3 rounded-2xl border border-soft-border px-4">
              <Icon className="text-apple-blue" name="bookOpen" size={22} />
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold">{selectedFile?.name ?? "尚未选择文件"}</p>
                <p className="text-xs font-semibold text-neutral-gray">
                  {selectedFile ? `已选择 · ${(selectedFile.size / 1024 / 1024).toFixed(1)} MB` : "请选择一个 EPUB 文件"}
                </p>
              </div>
            </div>
            {uploadMutation.isError && (
              <p className="mt-3 text-sm font-semibold text-[#bf4800]">{uploadMutation.error.message}</p>
            )}
            <div className="mt-5 flex h-[46px] gap-3">
              <button className="h-full flex-1 rounded-[23px] bg-pale-gray text-sm font-bold" onClick={() => setUploadOpen(false)} type="button">
                取消
              </button>
              <button
                className="flex h-full flex-1 items-center justify-center gap-2 rounded-[23px] bg-apple-blue text-sm font-extrabold text-white disabled:opacity-40"
                disabled={!selectedFile || uploadMutation.isPending}
                onClick={submitUpload}
                type="button"
              >
                <Icon name="upload" size={16} />
                {uploadMutation.isPending ? "上传中" : "开始上传"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
