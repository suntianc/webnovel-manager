"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Icon } from "@/components/ui/Icon";
import { API_BASE } from "@/lib/api";
import {
  useArtifacts,
  useGenerateNovelParts,
  useNovel,
  useNovelChapters,
  useNovelParts,
  useRetryWorkflow,
  useStartNovelAnalysis,
  useWorkflowEvents,
  useWorkflows,
} from "@/hooks/useApi";
import type { Artifact, WorkflowEvent, WorkflowRun } from "@/types";

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

const eventText: Record<string, string> = {
  workflow_created: "工作流已创建",
  workflow_started: "工作流开始",
  workflow_completed: "工作流完成",
  workflow_canceled: "工作流已取消",
  task_started: "任务开始",
  task_progress: "任务进度",
  task_completed: "任务完成",
  task_failed: "任务失败",
  artifact_created: "产物已生成",
  artifact_updated: "产物已更新",
};

const artifactText: Record<string, string> = {
  novel_parse_report: "解析报告",
  chapter_batch_note: "章节批次笔记",
  arc_note: "篇章摘要",
  novel_profile: "全书概览",
  character_profile: "人物分析",
  worldbuilding_profile: "世界观分析",
  plot_profile: "剧情结构",
  material_candidate: "素材候选",
  creation_plan: "创作规划",
  outline: "大纲",
  chapter_draft: "章节草稿",
  review_report: "审稿报告",
  consistency_report: "一致性检查",
};

const streamEventTypes = [
  "workflow_created",
  "workflow_started",
  "workflow_completed",
  "workflow_canceled",
  "task_started",
  "task_progress",
  "task_completed",
  "task_failed",
  "artifact_created",
  "artifact_updated",
];

function latestWorkflowFor(novelId: number, workflows: WorkflowRun[]) {
  return workflows
    .filter((workflow) => workflow.biz_type === "novel" && workflow.biz_id === novelId)
    .sort((a, b) => b.id - a.id)[0];
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

function dedupeEvents(events: WorkflowEvent[]) {
  const map = new Map<number, WorkflowEvent>();
  events.forEach((event) => map.set(event.id, event));
  return Array.from(map.values()).sort((a, b) => a.id - b.id);
}

export function NovelDetail({ novelId }: { novelId: number }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [selectedArtifactType, setSelectedArtifactType] = useState<string | null>(null);
  const novelQuery = useNovel(novelId);
  const partsQuery = useNovelParts(novelId);
  const chaptersQuery = useNovelChapters(novelId);
  const workflowsQuery = useWorkflows({ biz_type: "novel", limit: 100 });
  const generateParts = useGenerateNovelParts();
  const startAnalysis = useStartNovelAnalysis();
  const retryWorkflow = useRetryWorkflow();

  const workflow = useMemo(
    () => latestWorkflowFor(novelId, workflowsQuery.data?.data ?? []),
    [novelId, workflowsQuery.data?.data]
  );
  const eventsQuery = useWorkflowEvents(workflow?.id ?? 0);
  const artifactsQuery = useArtifacts({ run_id: workflow?.id, limit: 100 });
  const [events, setEvents] = useState<WorkflowEvent[]>([]);
  const lastEventIdRef = useRef(0);

  useEffect(() => {
    const nextEvents = eventsQuery.data ?? [];
    setEvents(nextEvents);
    lastEventIdRef.current = nextEvents.at(-1)?.id ?? 0;
  }, [eventsQuery.data]);

  useEffect(() => {
    if (!workflow?.id || ["completed", "failed", "canceled"].includes(workflow.status)) return;
    const lastId = lastEventIdRef.current;
    const source = new EventSource(`${API_BASE}/api/workflows/${workflow.id}/events/stream?after_id=${lastId}`);
    const handleEvent = (message: MessageEvent<string>) => {
      const parsed = JSON.parse(message.data) as WorkflowEvent;
      lastEventIdRef.current = Math.max(lastEventIdRef.current, parsed.id);
      setEvents((current) => dedupeEvents([...current, parsed]));
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      queryClient.invalidateQueries({ queryKey: ["artifacts"] });
      queryClient.invalidateQueries({ queryKey: ["workflow-events", workflow.id] });
    };
    streamEventTypes.forEach((eventType) => source.addEventListener(eventType, handleEvent));
    return () => {
      streamEventTypes.forEach((eventType) => source.removeEventListener(eventType, handleEvent));
      source.close();
    };
  }, [queryClient, workflow?.id, workflow?.status]);

  const novel = novelQuery.data;
  const parts = partsQuery.data ?? [];
  const chapters = chaptersQuery.data ?? [];
  const artifacts = artifactsQuery.data?.data ?? [];
  const visibleEvents = events.filter((event) => event.event_type !== "task_progress");
  const artifactGroups = Object.entries(
    artifacts.reduce<Record<string, number>>((acc, artifact) => {
      acc[artifact.artifact_type] = (acc[artifact.artifact_type] ?? 0) + 1;
      return acc;
    }, {})
  ).sort(([left], [right]) => left.localeCompare(right));
  const typeArtifacts = useMemo(
    () => (selectedArtifactType ? artifacts.filter((a) => a.artifact_type === selectedArtifactType) : []),
    [selectedArtifactType, artifacts]
  );
  const progress = workflow?.progress ?? (novel?.status === "parsed" ? 100 : 0);
  const status = workflow?.status ?? novel?.status ?? "pending";
  const hasGeneratedParts = parts.length > 0;
  const analysisLocked = startAnalysis.isPending || (!!workflow ? workflow.status !== "failed" : analysisStarted) || retryWorkflow.isPending;

  if (novelQuery.isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="h-[150px] rounded-[18px] bg-white" />
        </div>
      </DashboardLayout>
    );
  }

  if (!novel) {
    return (
      <DashboardLayout>
        <div className="p-8 text-sm font-semibold text-neutral-gray">未找到小说。</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <section className="flex min-h-full flex-col gap-5 px-8 py-6">
        <div className="flex h-[150px] items-center gap-5 rounded-[18px] border border-soft-border bg-white p-6">
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
            <button
              className="flex w-fit items-center gap-1 rounded-full text-xs font-bold text-apple-blue transition hover:text-highlight-blue active:scale-[0.98]"
              onClick={() => router.push("/novels")}
              type="button"
            >
              <Icon name="chevronLeft" size={14} />
              返回
            </button>
            <h1 className="font-display text-3xl font-bold text-near-black">{novel.title}</h1>
            <p className="text-sm font-semibold text-neutral-gray">
              {novel.author || "作者未知"} · {statusText[novel.status]} · {novel.chapter_count} 章 · {novel.part_count} 分组
            </p>
          </div>
          <div className="flex h-full w-[340px] flex-col justify-center gap-3 rounded-[18px] bg-pale-gray p-4">
            <div className="flex items-center">
              <span className="text-[13px] font-extrabold text-neutral-gray">工作流进度</span>
              <span className="ml-auto font-display text-[28px] font-bold">{progress}%</span>
            </div>
            <div className="h-2 rounded bg-white">
              <div className="h-full rounded bg-apple-blue" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex items-center gap-2">
              <p className={`text-xs font-bold ${status === "failed" ? "text-[#bf4800]" : "text-apple-blue"}`}>
                {statusText[status] ?? status}
              </p>
              {status === "failed" && workflow?.error_message && (
                <span className="ml-auto truncate text-[11px] font-semibold text-[#bf4800]" title={workflow.error_message}>
                  {workflow.error_message}
                </span>
              )}
              {status === "failed" && (
                <button
                  className="ml-auto h-7 shrink-0 rounded-full bg-apple-blue px-3 text-[11px] font-extrabold text-white transition hover:bg-highlight-blue active:scale-[0.97] disabled:opacity-50"
                  disabled={retryWorkflow.isPending}
                  onClick={() => workflow && retryWorkflow.mutate(workflow.id)}
                  type="button"
                >
                  {retryWorkflow.isPending ? "重试中" : "重试"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid min-h-[760px] grid-cols-[430px_1fr] gap-4">
          <div className="rounded-[18px] border border-soft-border bg-white p-5">
            <h2 className="font-display text-[22px] font-semibold">章节分组</h2>
            <div className="mt-4 flex h-[42px] rounded-[21px] bg-pale-gray p-1">
              <div className="flex flex-1 items-center justify-center rounded-[17px] bg-white text-[13px] font-extrabold">
                分组 {parts.length}
              </div>
              <div className="flex flex-1 items-center justify-center text-[13px] font-bold text-neutral-gray">
                章节 {chapters.length}
              </div>
            </div>

            <div className="mt-4 flex max-h-[750px] flex-col gap-3 overflow-y-auto pr-1">
              {parts.map((part, index) => (
                <div
                  className={`rounded-[14px] p-3.5 ${index === 0 ? "bg-pale-gray" : "border border-soft-border bg-white"}`}
                  key={part.id}
                >
                  <p className="text-sm font-extrabold text-near-black">
                    分组 {String(part.part_index).padStart(3, "0")} · 第 {part.chapter_start}-{part.chapter_end} 章
                  </p>
                  <p className={`mt-1 text-xs font-bold ${index === 0 ? "text-apple-blue" : "text-neutral-gray"}`}>
                    {formatNumber(part.word_count)} 字 · 就绪
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl bg-near-black p-4 text-white">
              <p className="text-sm font-extrabold">拆解操作</p>
              <div className="mt-3 flex gap-2">
                <button
                  className="h-9 flex-1 rounded-full bg-white text-xs font-extrabold text-near-black disabled:opacity-50"
                  disabled={generateParts.isPending || hasGeneratedParts}
                  onClick={() => generateParts.mutate({ id: novelId, chaptersPerPart: 10 })}
                  type="button"
                >
                  {hasGeneratedParts ? "已生成" : generateParts.isPending ? "生成中" : "生成分组"}
                </button>
                <button
                  className="h-9 flex-1 rounded-full bg-apple-blue text-xs font-extrabold text-white disabled:opacity-50"
                  disabled={analysisLocked || parts.length === 0}
                  onClick={() =>
                    startAnalysis.mutate(novelId, {
                      onSuccess: () => setAnalysisStarted(true),
                    })
                  }
                  type="button"
                >
                  {analysisLocked ? "已启动" : "启动分析"}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[18px] border border-soft-border bg-white p-5">
            <div className="flex h-10 items-center justify-between">
              <h2 className="font-display text-[22px] font-semibold">实时事件与产物</h2>
              <span className="rounded-full bg-[#e8f3ff] px-2.5 py-1 text-[11px] font-extrabold text-apple-blue">
                {workflow && !["completed", "failed", "canceled"].includes(workflow.status) ? "实时连接中" : "历史记录"}
              </span>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {visibleEvents.slice(-6).reverse().map((event, index) => (
                <div
                  className={`rounded-[14px] p-3.5 ${index === 0 ? "bg-pale-gray" : "border border-soft-border bg-white"}`}
                  key={event.id}
                >
                  <p className="text-[13px] font-extrabold">
                    {formatTime(event.created_at)} · {eventText[event.event_type] ?? event.event_type}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-neutral-gray">{event.message}</p>
                </div>
              ))}
              {visibleEvents.length === 0 && (
                <div className="rounded-[14px] bg-pale-gray p-4 text-sm font-semibold text-neutral-gray">
                  暂无工作流事件。
                </div>
              )}
            </div>

            <div className="mt-4 rounded-2xl bg-near-black p-4 text-white">
              <h3 className="text-base font-extrabold">产物统计</h3>
              {artifactGroups.length > 0 ? (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {artifactGroups.map(([type, count]) => (
                    <button
                      className="rounded-[14px] bg-graphite-a p-3.5 text-left transition hover:bg-graphite-b active:scale-[0.98]"
                      key={type}
                      onClick={() => setSelectedArtifactType(type)}
                      type="button"
                    >
                      <p className="font-display text-3xl font-bold text-white">{count}</p>
                      <p className="mt-1 text-[11px] font-bold text-[#a1a1a6]">
                        {artifactText[type] ?? type}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-3 flex flex-col items-center gap-2 rounded-[14px] bg-graphite-a p-4">
                  <p className="text-xs font-bold text-[#a1a1a6]">暂无产物</p>
                  <p className="text-[11px] font-semibold text-[#6e6e73]">工作流完成后将在此处展示分析结果</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {selectedArtifact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pl-0 lg:pl-[88px]">
          <div className="max-h-[82vh] w-[720px] max-w-[calc(100vw-48px)] overflow-hidden rounded-[24px] border border-soft-border bg-white shadow-[0_24px_60px_rgba(0,0,0,0.25)]">
            <div className="flex items-start justify-between gap-4 border-b border-soft-border p-5">
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-apple-blue">
                  {artifactText[selectedArtifact.artifact_type] ?? selectedArtifact.artifact_type}
                </p>
                <h3 className="mt-1 truncate font-display text-2xl font-bold">{selectedArtifact.title}</h3>
                <p className="mt-1 text-xs font-semibold text-neutral-gray">
                  {selectedArtifact.created_by_agent ?? "系统节点"} · v{selectedArtifact.version} · {statusText[selectedArtifact.status] ?? selectedArtifact.status}
                </p>
              </div>
              <button
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pale-gray text-neutral-gray"
                onClick={() => setSelectedArtifact(null)}
                type="button"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
            <div className="max-h-[calc(82vh-112px)] overflow-y-auto p-5">
              <pre className="whitespace-pre-wrap rounded-[16px] bg-pale-gray p-4 text-sm font-medium leading-relaxed text-near-black">
                {selectedArtifact.content || "该产物暂无正文内容。"}
              </pre>
              {Object.keys(selectedArtifact.structured_data).length > 0 && (
                <pre className="mt-3 whitespace-pre-wrap rounded-[16px] bg-white p-4 text-xs font-semibold leading-relaxed text-neutral-gray ring-1 ring-soft-border">
                  {JSON.stringify(selectedArtifact.structured_data, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedArtifactType && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 pl-0 lg:pl-[88px]">
          <div className="max-h-[82vh] w-[550px] max-w-[calc(100vw-48px)] overflow-hidden rounded-[24px] border border-soft-border bg-white shadow-[0_24px_60px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-between border-b border-soft-border p-5">
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-apple-blue">
                  {artifactText[selectedArtifactType] ?? selectedArtifactType}
                </p>
                <h3 className="font-display text-2xl font-bold">产物列表</h3>
              </div>
              <button
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pale-gray text-neutral-gray"
                onClick={() => setSelectedArtifactType(null)}
                type="button"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
            <div className="max-h-[calc(82vh-80px)] overflow-y-auto p-4">
              {typeArtifacts.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {typeArtifacts.map((artifact) => (
                    <button
                      className="flex items-start gap-3 rounded-[14px] border border-soft-border bg-white p-3.5 text-left transition hover:bg-pale-gray active:scale-[0.99]"
                      key={artifact.id}
                      onClick={() => setSelectedArtifact(artifact)}
                      type="button"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f3ff] text-apple-blue">
                        <Icon name="archive" size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold text-near-black">{artifact.title}</p>
                        <p className="mt-1 text-xs font-semibold text-neutral-gray">
                          {artifact.created_by_agent ?? "系统节点"} · v{artifact.version} · {statusText[artifact.status] ?? artifact.status}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 rounded-[14px] bg-pale-gray p-8">
                  <p className="text-sm font-bold text-neutral-gray">暂无该类型产物</p>
                  <p className="text-xs font-semibold text-neutral-gray">当前没有{artifactText[selectedArtifactType] ?? selectedArtifactType}类型的产物</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
