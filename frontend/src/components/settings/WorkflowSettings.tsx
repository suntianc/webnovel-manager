"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Icon } from "@/components/ui/Icon";
import { useAgents, useProviders, useUpdateAgent } from "@/hooks/useApi";
import type { AgentDefinition, AIProvider } from "@/types";

type FlowConfig = {
  key: string;
  title: string;
  subtitle: string;
  description: string;
  nodes: FlowNodeConfig[];
};

type FlowNodeConfig = {
  nodeName: string;
  nodeLabel: string;
  agentName: string | null;
  agentLabel: string;
  taskType: string;
  taskLabel: string;
  artifactType: string | null;
  artifactLabel: string;
  parameterSummary: string;
};

type EditingContext = {
  agent: AgentDefinition;
  flow: FlowConfig;
  node: FlowNodeConfig;
};

const flows: FlowConfig[] = [
  {
    key: "novel_analysis",
    title: "素材处理流程",
    subtitle: "从原文解析到素材入库",
    description: "把上传的小说分组阅读、总结、分析人物设定剧情，并自动提取可入库素材。",
    nodes: [
      {
        nodeName: "ParseNovelNode",
        nodeLabel: "解析原文",
        agentName: null,
        agentLabel: "系统",
        taskType: "parse_novel",
        taskLabel: "读取章节与分组",
        artifactType: "novel_parse_report",
        artifactLabel: "解析报告",
        parameterSummary: "系统解析节点",
      },
      {
        nodeName: "BatchReadNode",
        nodeLabel: "阅读分组",
        agentName: "ReaderAgent",
        agentLabel: "原文阅读助手",
        taskType: "chapter_batch_notes",
        taskLabel: "抽取事实与证据",
        artifactType: "chapter_batch_note",
        artifactLabel: "阅读笔记",
        parameterSummary: "1 part · 2200 chars",
      },
      {
        nodeName: "ArcSummaryNode",
        nodeLabel: "梳理篇章",
        agentName: "SummarizerAgent",
        agentLabel: "摘要助手",
        taskType: "arc_summary",
        taskLabel: "归纳剧情阶段",
        artifactType: "arc_note",
        artifactLabel: "篇章摘要",
        parameterSummary: "前序上下文 · 6000 chars",
      },
      {
        nodeName: "NovelProfileNode",
        nodeLabel: "整理作品档案",
        agentName: "SummarizerAgent",
        agentLabel: "摘要助手",
        taskType: "novel_profile",
        taskLabel: "生成整体档案",
        artifactType: "novel_profile",
        artifactLabel: "作品档案",
        parameterSummary: "前序上下文 · 6000 chars",
      },
      {
        nodeName: "CharacterAnalysisNode",
        nodeLabel: "分析人物",
        agentName: "CharacterAgent",
        agentLabel: "人物分析助手",
        taskType: "character_analysis",
        taskLabel: "提取人物与关系",
        artifactType: "character_profile",
        artifactLabel: "人物分析",
        parameterSummary: "1 part · 2200 chars",
      },
      {
        nodeName: "WorldbuildingAnalysisNode",
        nodeLabel: "分析世界观",
        agentName: "WorldbuildingAgent",
        agentLabel: "世界观助手",
        taskType: "worldbuilding_analysis",
        taskLabel: "提取设定与规则",
        artifactType: "worldbuilding_profile",
        artifactLabel: "世界观分析",
        parameterSummary: "1 part · 2200 chars",
      },
      {
        nodeName: "PlotAnalysisNode",
        nodeLabel: "分析剧情",
        agentName: "PlotAgent",
        agentLabel: "剧情分析助手",
        taskType: "plot_analysis",
        taskLabel: "提取冲突与伏笔",
        artifactType: "plot_profile",
        artifactLabel: "剧情分析",
        parameterSummary: "1 part · 2200 chars",
      },
      {
        nodeName: "MaterialExtractionNode",
        nodeLabel: "提取素材",
        agentName: "MaterialAgent",
        agentLabel: "素材提炼助手",
        taskType: "material_extraction",
        taskLabel: "生成并导入素材",
        artifactType: "material_candidate",
        artifactLabel: "素材候选",
        parameterSummary: "1 part · 1800 chars · auto import",
      },
    ],
  },
  {
    key: "novel_creation",
    title: "小说创作流程",
    subtitle: "从设定规划到章节修订",
    description: "根据创作设定规划世界观、人物、大纲和章节草稿，并做审稿与一致性检查。",
    nodes: [
      {
        nodeName: "DirectorPlanNode",
        nodeLabel: "制定创作计划",
        agentName: "DirectorAgent",
        agentLabel: "总控规划助手",
        taskType: "director_plan",
        taskLabel: "拆解创作任务",
        artifactType: "creation_plan",
        artifactLabel: "创作计划",
        parameterSummary: "规划节点",
      },
      {
        nodeName: "WorldbuildingCreateNode",
        nodeLabel: "创建世界观",
        agentName: "WorldbuildingAgent",
        agentLabel: "世界观助手",
        taskType: "worldbuilding_create",
        taskLabel: "生成设定体系",
        artifactType: "worldbuilding_profile",
        artifactLabel: "世界观档案",
        parameterSummary: "世界观创建",
      },
      {
        nodeName: "CharacterCreateNode",
        nodeLabel: "创建角色",
        agentName: "CharacterAgent",
        agentLabel: "人物分析助手",
        taskType: "character_create",
        taskLabel: "生成人物档案",
        artifactType: "character_profile",
        artifactLabel: "人物档案",
        parameterSummary: "角色创建",
      },
      {
        nodeName: "PlotCreateNode",
        nodeLabel: "创建大纲",
        agentName: "PlotAgent",
        agentLabel: "剧情分析助手",
        taskType: "plot_create",
        taskLabel: "生成剧情大纲",
        artifactType: "outline",
        artifactLabel: "剧情大纲",
        parameterSummary: "大纲创建",
      },
      {
        nodeName: "ChapterWritingNode",
        nodeLabel: "撰写章节",
        agentName: "WriterAgent",
        agentLabel: "正文写作助手",
        taskType: "chapter_writing",
        taskLabel: "生成章节草稿",
        artifactType: "chapter_draft",
        artifactLabel: "章节草稿",
        parameterSummary: "章节草稿",
      },
      {
        nodeName: "ReviewNode",
        nodeLabel: "审阅草稿",
        agentName: "ReviewerAgent",
        agentLabel: "审稿助手",
        taskType: "review",
        taskLabel: "提出修改意见",
        artifactType: "review_report",
        artifactLabel: "审稿报告",
        parameterSummary: "审稿反馈",
      },
      {
        nodeName: "ConsistencyCheckNode",
        nodeLabel: "检查一致性",
        agentName: "ConsistencyAgent",
        agentLabel: "一致性检查助手",
        taskType: "consistency_check",
        taskLabel: "检查设定与时间线",
        artifactType: "consistency_report",
        artifactLabel: "一致性报告",
        parameterSummary: "一致性检查",
      },
      {
        nodeName: "RevisionNode",
        nodeLabel: "修订章节",
        agentName: "WriterAgent",
        agentLabel: "正文写作助手",
        taskType: "revision",
        taskLabel: "根据反馈修订",
        artifactType: "chapter_draft",
        artifactLabel: "修订草稿",
        parameterSummary: "修订草稿",
      },
    ],
  },
];

export function WorkflowSettings() {
  const agentsQuery = useAgents();
  const providersQuery = useProviders();
  const updateAgent = useUpdateAgent();
  const [editing, setEditing] = useState<EditingContext | null>(null);
  const [saveMessage, setSaveMessage] = useState("");

  const agents = useMemo(() => agentsQuery.data ?? [], [agentsQuery.data]);
  const providers = useMemo(() => providersQuery.data ?? [], [providersQuery.data]);

  function findAgent(agentName: string) {
    return agents.find((agent) => agent.name === agentName) ?? null;
  }

  function handleSaved() {
    setEditing(null);
    setSaveMessage("保存成功");
    window.setTimeout(() => setSaveMessage(""), 2200);
  }

  return (
    <DashboardLayout>
      <section className="flex min-h-full flex-col gap-6 px-8 py-6">
        <header className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[34px] font-bold leading-tight text-near-black">
              流程配置
            </h1>
            <p className="mt-2 text-sm font-medium text-neutral-gray">
              按流程配置节点 Agent、模型和运行参数；供应商凭证仍在 AI 提供商菜单中维护。
            </p>
          </div>
          <div className="flex h-10 items-center gap-2 rounded-full bg-apple-blue px-5 text-sm font-bold text-white">
            <Icon name="check" size={15} />
            已自动保存
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <div className="min-h-0 flex-1 rounded-[18px] border border-soft-border bg-white p-5">
            <div className="flex flex-col gap-8">
              {flows.map((flow) => (
                <FlowSection
                  agentsLoading={agentsQuery.isLoading}
                  findAgent={findAgent}
                  flow={flow}
                  key={flow.key}
                  onEdit={(context) => setEditing(context)}
                  providers={providers}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {editing && (
        <AgentConfigDialog
          agent={editing.agent}
          flow={editing.flow}
          isSaving={updateAgent.isPending}
          onClose={() => setEditing(null)}
          onSave={(data) =>
            updateAgent.mutate(
              { id: editing.agent.id, data },
              { onSuccess: handleSaved }
            )
          }
          node={editing.node}
          providers={providers}
        />
      )}

      {saveMessage && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-near-black px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(0,0,0,0.22)]">
          {saveMessage}
        </div>
      )}
    </DashboardLayout>
  );
}

function FlowSection({
  agentsLoading,
  findAgent,
  flow,
  onEdit,
  providers,
}: {
  agentsLoading: boolean;
  findAgent: (agentName: string) => AgentDefinition | null;
  flow: FlowConfig;
  onEdit: (context: EditingContext) => void;
  providers: AIProvider[];
}) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-bold text-near-black">{flow.title}</h2>
          <p className="mt-1 text-xs font-semibold text-neutral-gray">
            {flow.subtitle} · {flow.description}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-soft-border bg-pale-gray">
        <div className="grid h-11 grid-cols-[220px_150px_190px_minmax(220px,1fr)_190px_88px] items-center gap-3 bg-white px-4 text-xs font-bold text-neutral-gray">
          <span>流程步骤</span>
          <span>要做什么</span>
          <span>负责助手</span>
          <span>供应商 / 模型</span>
          <span>输出内容 / 固定参数</span>
          <span>操作</span>
        </div>
        {flow.nodes.map((node, index) => {
          const agent = node.agentName ? findAgent(node.agentName) : null;
          const provider = providers.find((item) => item.id === agent?.provider_id);
          return (
            <div
              className={`grid min-h-[62px] grid-cols-[220px_150px_190px_minmax(220px,1fr)_190px_88px] items-center gap-3 px-4 py-2 text-[13px] ${
                index % 2 ? "bg-white" : "bg-pale-gray"
              }`}
              key={node.nodeName}
            >
              <div className="min-w-0">
                <div className="truncate font-bold text-near-black">{node.nodeLabel}</div>
                <div className="truncate text-[11px] font-semibold text-[#8a8f98]">{node.nodeName}</div>
              </div>
              <span className="truncate text-xs font-semibold text-neutral-gray">{node.taskLabel}</span>
              <div className="min-w-0">
                <div className="truncate font-semibold text-near-black">{node.agentLabel}</div>
                <div className="truncate text-[11px] font-semibold text-[#8a8f98]">
                  {node.agentName ?? "无需配置"}
                </div>
              </div>
              <span className="truncate font-semibold text-neutral-gray">
                {agent
                  ? provider
                    ? `${provider.name} / ${agent.model}`
                    : `未配置提供商 / ${agent.model}`
                  : node.agentName
                    ? agentsLoading
                      ? "加载中..."
                      : "未找到 Agent"
                    : "不需要模型配置"}
              </span>
              <div className="min-w-0 text-xs font-semibold text-neutral-gray">
                <div className="truncate">{node.artifactLabel}</div>
                <div className="truncate text-[11px] text-[#8a8f98]">{node.parameterSummary}</div>
              </div>
              <button
                className="flex h-8 items-center justify-center rounded-full bg-[#e8f3ff] text-xs font-bold text-apple-blue transition active:scale-[0.97] disabled:opacity-40"
                disabled={!agent}
                onClick={() => agent && onEdit({ agent, flow, node })}
                type="button"
              >
                {agent ? "配置" : "系统"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function AgentConfigDialog({
  agent,
  flow,
  isSaving,
  node,
  onClose,
  onSave,
  providers,
}: {
  agent: AgentDefinition;
  flow: FlowConfig;
  isSaving: boolean;
  node: FlowNodeConfig;
  onClose: () => void;
  onSave: (data: {
    provider_id: number | null;
    model: string;
    temperature: number;
    max_tokens: number;
    system_prompt: string;
  }) => void;
  providers: AIProvider[];
}) {
  const [providerId, setProviderId] = useState<number | null>(agent.provider_id);
  const [model, setModel] = useState(agent.model);
  const [temperature, setTemperature] = useState(String(agent.temperature));
  const [maxTokens, setMaxTokens] = useState(String(agent.max_tokens));
  const [systemPrompt, setSystemPrompt] = useState(agent.system_prompt);

  const selectedProvider = providers.find((provider) => provider.id === providerId);
  const modelOptions = selectedProvider?.models ?? [];

  useEffect(() => {
    setProviderId(agent.provider_id);
    setModel(agent.model);
    setTemperature(String(agent.temperature));
    setMaxTokens(String(agent.max_tokens));
    setSystemPrompt(agent.system_prompt);
  }, [agent]);

  function handleProviderChange(value: string) {
    const nextProviderId = value ? Number(value) : null;
    const nextProvider = providers.find((provider) => provider.id === nextProviderId);
    setProviderId(nextProviderId);
    if (nextProvider?.models.length) {
      setModel(nextProvider.models[0]);
    }
  }

  function handleSave() {
    onSave({
      provider_id: providerId,
      model: model.trim(),
      temperature: Number(temperature) || 0,
      max_tokens: Number(maxTokens) || 2000,
      system_prompt: systemPrompt.trim(),
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 pl-0 lg:pl-[248px]">
      <div className="flex max-h-[calc(100dvh-80px)] w-[792px] max-w-[calc(100vw-64px)] flex-col overflow-hidden rounded-[24px] border border-soft-border bg-white shadow-[0_24px_60px_rgba(0,0,0,0.25)]">
        <header className="flex h-[86px] shrink-0 items-center gap-4 border-b border-soft-border px-7">
          <div className="min-w-0 flex-1">
            <h3 className="text-2xl font-bold text-near-black">编辑 Agent 配置</h3>
            <p className="mt-1 text-[13px] font-semibold text-neutral-gray">
              {flow.title} / {node.nodeLabel} / {node.taskLabel}
            </p>
          </div>
          <button
            className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-pale-gray text-neutral-gray"
            onClick={onClose}
            type="button"
          >
            <Icon name="close" size={17} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-7">
          <div className="mb-5 grid grid-cols-3 gap-3 rounded-[14px] bg-pale-gray p-3 text-xs font-semibold text-neutral-gray">
            <div className="min-w-0">
              <div className="text-[#8a8f98]">对应 Agent</div>
              <div className="mt-1 truncate text-near-black">{node.agentLabel}</div>
            </div>
            <div className="min-w-0">
              <div className="text-[#8a8f98]">输出内容</div>
              <div className="mt-1 truncate text-near-black">{node.artifactLabel}</div>
            </div>
            <div className="min-w-0">
              <div className="text-[#8a8f98]">固定参数</div>
              <div className="mt-1 truncate text-near-black">{node.parameterSummary}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="默认提供商">
              <select
                className="field-control h-[46px] rounded-xl"
                onChange={(event) => handleProviderChange(event.target.value)}
                value={providerId ?? ""}
              >
                <option value="">未配置</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="默认模型">
              {modelOptions.length > 0 ? (
                <select
                  className="field-control h-[46px] rounded-xl"
                  onChange={(event) => setModel(event.target.value)}
                  value={model}
                >
                  {modelOptions.includes(model) ? null : <option value={model}>{model}</option>}
                  {modelOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="field-control h-[46px] rounded-xl"
                  onChange={(event) => setModel(event.target.value)}
                  value={model}
                />
              )}
            </Field>
            <Field label="Temperature">
              <input
                className="field-control h-[44px] rounded-xl"
                max={2}
                min={0}
                onChange={(event) => setTemperature(event.target.value)}
                step={0.1}
                type="number"
                value={temperature}
              />
            </Field>
            <Field label="Max Tokens">
              <input
                className="field-control h-[44px] rounded-xl"
                min={1}
                onChange={(event) => setMaxTokens(event.target.value)}
                type="number"
                value={maxTokens}
              />
            </Field>
          </div>

          <label className="mt-5 block text-sm font-bold text-near-black">系统提示词</label>
          <textarea
            className="mt-2 min-h-[340px] w-full resize-none rounded-[14px] bg-near-black p-4 text-sm font-medium leading-relaxed text-pale-gray outline-none"
            onChange={(event) => setSystemPrompt(event.target.value)}
            value={systemPrompt}
          />
        </div>

        <footer className="flex h-[82px] shrink-0 items-center justify-end gap-3 border-t border-soft-border px-7">
          <button
            className="h-11 rounded-full bg-pale-gray px-7 text-sm font-bold text-near-black transition active:scale-[0.98]"
            onClick={onClose}
            type="button"
          >
            取消
          </button>
          <button
            className="h-11 rounded-full bg-apple-blue px-7 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
            disabled={isSaving || !model.trim() || !systemPrompt.trim()}
            onClick={handleSave}
            type="button"
          >
            {isSaving ? "保存中..." : "保存 Agent"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="flex min-w-0 flex-col gap-2">
      <span className="text-xs font-bold text-neutral-gray">{label}</span>
      {children}
    </label>
  );
}
