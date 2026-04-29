"use client";

import { useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Icon } from "@/components/ui/Icon";
import { ProviderIcon } from "@/components/ai-providers/ProviderIcon";
import { ProviderDialog } from "@/components/ai-providers/ProviderDialog";
import { useDeleteProvider, useProviders } from "@/hooks/useApi";
import type { AIProvider } from "@/types";

const statusColors: Record<string, string> = {
  untested: "bg-pale-gray text-neutral-gray",
  connected: "bg-[#ecfff1] text-[#248a3d]",
  failed: "bg-[#fff3e8] text-[#bf4800]",
};

const statusText: Record<string, string> = {
  untested: "未测试",
  connected: "已连接",
  failed: "连接失败",
};

export function AIProviderList() {
  const [keyword, setKeyword] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const providersQuery = useProviders();
  const deleteProvider = useDeleteProvider();

  const providers = useMemo(() => providersQuery.data ?? [], [providersQuery.data]);
  const filtered = useMemo(
    () => providers.filter((p) => p.name.toLowerCase().includes(keyword.toLowerCase())),
    [providers, keyword]
  );

  function openAdd() {
    setEditingProvider(null);
    setDialogOpen(true);
  }

  function openEdit(provider: AIProvider) {
    setEditingProvider(provider);
    setDialogOpen(true);
  }

  function handleDelete(provider: AIProvider) {
    const confirmed = window.confirm(`确认删除提供商「${provider.name}」？`);
    if (!confirmed) return;
    deleteProvider.mutate(provider.id);
  }

  function handleSaved() {
    setSaveMessage("保存成功");
    window.setTimeout(() => setSaveMessage(""), 2200);
  }

  return (
    <DashboardLayout>
      <section className="flex min-h-full flex-col gap-5 px-8 py-6">
        <div className="flex h-[42px] items-center gap-3">
          <label className="flex h-full min-w-0 flex-1 items-center gap-2.5 rounded-[18px] border border-soft-border bg-white px-5 text-sm text-neutral-gray">
            <Icon name="search" size={16} />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-near-black outline-none placeholder:text-neutral-gray"
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索提供商..."
              type="search"
              value={keyword}
            />
          </label>
          <button
            className="flex h-full shrink-0 items-center gap-2 rounded-full bg-apple-blue px-5 text-sm font-semibold text-white transition active:scale-[0.98]"
            onClick={openAdd}
            type="button"
          >
            <Icon name="plus" size={15} />
            添加提供商
          </button>
        </div>

        <div className="flex-1">
          {providersQuery.isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div className="h-[72px] rounded-[14px] bg-pale-gray" key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-[360px] items-center justify-center rounded-[18px] bg-pale-gray text-sm font-semibold text-neutral-gray">
              {keyword ? "未找到匹配的提供商" : "暂无 AI 提供商，点击上方按钮添加"}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((provider) => (
                <div
                  className="flex items-center gap-4 rounded-[14px] border border-soft-border bg-white px-5 py-4"
                  key={provider.id}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-pale-gray">
                    <ProviderIcon name={provider.name} size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-near-black">
                      {provider.name}
                    </p>
                    <p className="truncate text-xs font-medium text-neutral-gray">
                      {provider.base_url}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusColors[provider.status] ?? statusColors.untested}`}
                    >
                      {statusText[provider.status] ?? "未测试"}
                    </span>
                    <button
                      className="flex h-7 items-center rounded-full bg-pale-gray px-3 text-[12px] font-semibold text-apple-blue transition hover:bg-white active:scale-[0.97]"
                      onClick={() => openEdit(provider)}
                      type="button"
                    >
                      编辑
                    </button>
                    <button
                      className="flex h-7 items-center rounded-full bg-[#fff3e8] px-3 text-[12px] font-semibold text-[#bf4800] transition hover:bg-white active:scale-[0.97]"
                      onClick={() => handleDelete(provider)}
                      type="button"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>


      <ProviderDialog
        open={dialogOpen}
        providers={providers}
        provider={editingProvider}
        onClose={() => setDialogOpen(false)}
        onSaved={handleSaved}
      />
      {saveMessage && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-near-black px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(0,0,0,0.22)]">
          {saveMessage}
        </div>
      )}
    </DashboardLayout>
  );
}
