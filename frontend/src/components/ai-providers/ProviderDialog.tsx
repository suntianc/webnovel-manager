"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { KNOWN_PROVIDERS } from "@/types";
import {
  useCreateProvider,
  useFetchModels,
  useFetchModelsForConfig,
  useTestConnection,
  useTestProviderConfig,
  useUpdateProvider,
} from "@/hooks/useApi";
import type { AIProvider } from "@/types";

interface Props {
  open: boolean;
  providers: AIProvider[];
  provider: AIProvider | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ProviderDialog({ open, providers, provider, onClose, onSaved }: Props) {
  const createProvider = useCreateProvider();
  const updateProvider = useUpdateProvider();
  const testConnection = useTestConnection();
  const testProviderConfig = useTestProviderConfig();
  const fetchModels = useFetchModels();
  const fetchModelsForConfig = useFetchModelsForConfig();

  // Local state for the provider being edited (after saving for the first time)
  const [localProvider, setLocalProvider] = useState<AIProvider | null>(null);
  const [name, setName] = useState("");
  const [nameSearch, setNameSearch] = useState("");
  const [nameOpen, setNameOpen] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [modelInput, setModelInput] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<{ status: string; message: string } | null>(null);
  const [saveError, setSaveError] = useState("");

  const nameDropdownRef = useRef<HTMLDivElement>(null);

  // The active provider (either from parent or locally saved)
  const activeProvider = provider ?? localProvider;
  const isEditing = !!activeProvider;
  const hasApiId = !!activeProvider?.id;
  const trimmedApiKey = apiKey.trim();
  const canUseSavedConfig = hasApiId && !trimmedApiKey;
  const hasDraftCredentials = !!name.trim() && !!baseUrl.trim() && (!!trimmedApiKey || canUseSavedConfig);
  const isTesting = testConnection.isPending || testProviderConfig.isPending;
  const isFetchingModels = fetchModels.isPending || fetchModelsForConfig.isPending;

  const filteredProviders = useMemo(
    () => KNOWN_PROVIDERS.filter((p) => p.name.toLowerCase().includes(nameSearch.toLowerCase())),
    [nameSearch]
  );

  useEffect(() => {
    if (open) {
      if (provider) {
        setName(provider.name);
        setNameSearch(provider.name);
        setBaseUrl(provider.base_url);
        setApiKey("");
        setModelInput("");
        setModels(provider.models ?? []);
        setLocalProvider(null);
      } else {
        setName("");
        setNameSearch("");
        setBaseUrl("");
        setApiKey("");
        setModelInput("");
        setModels([]);
        setLocalProvider(null);
      }
      setTestResult(null);
      setSaveError("");
    }
  }, [open, provider]);

  useEffect(() => {
    if (!nameOpen) return;
    function handlePointerDown(event: PointerEvent) {
      if (!nameDropdownRef.current?.contains(event.target as Node)) {
        setNameOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [nameOpen]);

  function selectProvider(selected: string) {
    setName(selected);
    setNameSearch(selected);
    setSaveError("");
    setNameOpen(false);
    const known = KNOWN_PROVIDERS.find((p) => p.name === selected);
    if (known && !hasApiId) {
      setBaseUrl(known.base_url);
    }
  }

  function hasDuplicateName(nextName: string) {
    const normalized = nextName.trim().toLowerCase();
    if (!normalized) return false;
    return providers.some(
      (item) => item.name.trim().toLowerCase() === normalized && item.id !== activeProvider?.id
    );
  }

  function getSaveErrorMessage(error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Provider name already exists") return "提供商名称已存在";
      return error.message || "保存失败";
    }
    return "保存失败";
  }

  function handleSave() {
    const trimmedName = name.trim();
    const trimmedBaseUrl = baseUrl.trim();
    setSaveError("");
    if (hasDuplicateName(trimmedName)) {
      setSaveError("提供商名称已存在");
      return;
    }
    if (hasApiId && activeProvider) {
      const data = {
        name: trimmedName,
        base_url: trimmedBaseUrl,
        models,
        ...(trimmedApiKey ? { api_key: trimmedApiKey } : {}),
      };
      updateProvider.mutate(
        { id: activeProvider.id, data },
        {
          onSuccess: () => {
            onClose();
            onSaved();
          },
          onError: (error) => setSaveError(getSaveErrorMessage(error)),
        }
      );
    } else {
      const data = { name: trimmedName, base_url: trimmedBaseUrl, api_key: trimmedApiKey, models };
      createProvider.mutate(data, {
        onSuccess: (saved) => {
          // Save the created provider locally so test/fetch buttons work
          setLocalProvider(saved);
          setApiKey("");
          onClose();
          onSaved();
        },
        onError: (error) => setSaveError(getSaveErrorMessage(error)),
      });
    }
  }

  function handleTest() {
    if (!hasDraftCredentials) return;
    if (canUseSavedConfig && activeProvider) {
      testConnection.mutate(activeProvider.id, {
        onSuccess: (result) => setTestResult(result),
      });
      return;
    }
    testProviderConfig.mutate(
      { name, base_url: baseUrl, api_key: trimmedApiKey, models },
      { onSuccess: (result) => setTestResult(result) }
    );
  }

  function addModel() {
    const model = modelInput.trim();
    if (!model || models.includes(model)) return;
    setModels([...models, model]);
    setModelInput("");
  }

  function handleFetchModels() {
    if (!hasDraftCredentials) return;
    if (canUseSavedConfig && activeProvider) {
      fetchModels.mutate(activeProvider.id, {
        onSuccess: (result) => setModels(result.models),
      });
      return;
    }
    fetchModelsForConfig.mutate(
      { name, base_url: baseUrl, api_key: trimmedApiKey, models },
      { onSuccess: (result) => setModels(result.models) }
    );
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 pl-0 lg:pl-[88px]">
      <div className="flex max-h-[calc(100dvh-48px)] w-[560px] max-w-[calc(100vw-48px)] flex-col overflow-hidden rounded-[24px] border border-soft-border bg-white shadow-[0_24px_60px_rgba(0,0,0,0.25)]">
        <div className="flex shrink-0 items-center justify-between border-b border-soft-border px-6 pb-5 pt-6">
          <h3 className="font-display text-2xl font-bold text-near-black">
            {hasApiId ? "编辑 AI 提供商" : "添加 AI 提供商"}
          </h3>
          <button
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pale-gray text-neutral-gray"
            onClick={onClose}
            type="button"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-6">
          <div className="flex flex-col gap-5">
            {/* Provider Name */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-near-black">提供商名称</label>
              <div className="relative" ref={nameDropdownRef}>
                <div className="flex h-11 w-full items-center gap-2.5 rounded-xl border border-soft-border bg-pale-gray px-3.5">
                  <Icon className="shrink-0 text-neutral-gray" name="search" size={16} />
                  <input
                    className="min-w-0 flex-1 bg-transparent text-sm font-medium text-near-black outline-none"
                    disabled={hasApiId}
                    onChange={(e) => {
                      setNameSearch(e.target.value);
                      setName(e.target.value);
                      setSaveError("");
                      setNameOpen(true);
                    }}
                    onFocus={() => setNameOpen(true)}
                    placeholder="搜索或输入提供商名称..."
                    type="text"
                    value={isEditing ? name : nameSearch}
                  />
                  <Icon className="shrink-0 text-neutral-gray" name="chevronDown" size={16} />
                </div>
                {nameOpen && !hasApiId && (
                  <div className="absolute left-0 top-12 z-20 max-h-[240px] w-full overflow-y-auto rounded-xl border border-soft-border bg-white p-1.5 shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
                    {filteredProviders.map((p) => (
                      <button
                        className="flex h-[38px] w-full items-center rounded-[10px] px-3 text-left text-[13px] font-semibold hover:bg-pale-gray"
                        key={p.name}
                        onClick={() => selectProvider(p.name)}
                        type="button"
                      >
                        {p.name}
                      </button>
                    ))}
                    {filteredProviders.length === 0 && (
                      <p className="px-3 py-2 text-xs font-medium text-neutral-gray">未找到匹配</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Provider Type */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-neutral-gray">提供商类型</label>
              <div className="flex h-11 w-full items-center rounded-xl border border-soft-border bg-pale-gray px-3.5 text-sm font-medium text-neutral-gray">
                Chat API
              </div>
            </div>

            {/* Base URL */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-near-black">Base URL</label>
              <input
                className="h-11 w-full rounded-xl border border-soft-border bg-pale-gray px-3.5 text-sm font-medium text-near-black outline-none"
                onChange={(e) => {
                  setBaseUrl(e.target.value);
                  setSaveError("");
                }}
                placeholder="https://api.openai.com/v1"
                type="text"
                value={baseUrl}
              />
            </div>

            {/* API Key */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-near-black">API Key</label>
              <input
                className="h-11 w-full rounded-xl border border-soft-border bg-pale-gray px-3.5 text-sm font-medium text-near-black outline-none"
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setSaveError("");
                }}
                placeholder={hasApiId ? `留空保持不变${activeProvider?.api_key_masked ? `（${activeProvider.api_key_masked}）` : ""}` : "sk-..."}
                type="password"
                value={apiKey}
              />
            </div>

            {/* Models */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-near-black">可用模型</label>
              <div className="flex items-center gap-2">
                <input
                  className="h-11 min-w-0 flex-1 rounded-xl border border-soft-border bg-pale-gray px-3.5 text-sm font-medium text-near-black outline-none"
                  onChange={(e) => setModelInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addModel();
                    }
                  }}
                  placeholder="输入模型名，如 deepseek-chat"
                  type="text"
                  value={modelInput}
                />
                <button
                  className="flex h-11 shrink-0 items-center rounded-xl bg-pale-gray px-4 text-sm font-semibold text-apple-blue transition hover:bg-white active:scale-[0.98] disabled:opacity-50"
                  disabled={!modelInput.trim()}
                  onClick={addModel}
                  type="button"
                >
                  添加
                </button>
                <button
                  className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-apple-blue px-4 text-sm font-semibold text-white transition hover:bg-highlight-blue active:scale-[0.98] disabled:opacity-50"
                  disabled={!hasDraftCredentials || isFetchingModels}
                  onClick={handleFetchModels}
                  type="button"
                >
                  <Icon name="download" size={15} />
                  {isFetchingModels ? "获取中" : "获取"}
                </button>
              </div>
              {models.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-2">
                  {models.map((m) => (
                    <span
                      className="flex items-center gap-1.5 rounded-full bg-[#e8f3ff] px-3 py-1 text-[12px] font-semibold text-apple-blue"
                      key={m}
                    >
                      {m}
                      <button
                        className="hover:text-highlight-blue"
                        onClick={() => setModels(models.filter((x) => x !== m))}
                        type="button"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Test Connection */}
            <div className="flex items-center gap-3">
              <button
                className="flex items-center gap-1.5 rounded-full border border-soft-border bg-pale-gray px-4 py-2 text-[12px] font-bold text-apple-blue transition hover:bg-white active:scale-[0.98] disabled:opacity-50"
                disabled={!hasDraftCredentials || isTesting}
                onClick={handleTest}
                type="button"
              >
                <Icon name="download" size={14} />
                {isTesting ? "测试中..." : "测试连接"}
              </button>
              {testResult && (
                <span className={`text-xs font-medium ${testResult.status === "ok" ? "text-[#248a3d]" : "text-[#bf4800]"}`}>
                  {testResult.message}
                </span>
              )}
              {!hasDraftCredentials && (
                <span className="text-xs font-medium text-neutral-gray">填写 Base URL 和 API Key 后可测试或获取模型</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 border-t border-soft-border bg-white px-6 py-5">
          <div className="min-w-0 flex-1 text-xs font-semibold text-[#bf4800]">
            {saveError}
          </div>
          <button
            className="h-11 rounded-full bg-pale-gray px-6 text-sm font-semibold text-near-black transition active:scale-[0.98]"
            onClick={onClose}
            type="button"
          >
            取消
          </button>
          <button
            className="h-11 rounded-full bg-apple-blue px-6 text-sm font-semibold text-white transition hover:bg-highlight-blue active:scale-[0.98] disabled:opacity-50"
            disabled={!name || !baseUrl || (!hasApiId && !apiKey.trim()) || createProvider.isPending || updateProvider.isPending}
            onClick={handleSave}
            type="button"
          >
            {createProvider.isPending || updateProvider.isPending ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
