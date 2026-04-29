"use client";

import {
  Anthropic,
  DeepSeek,
  Groq,
  Mistral,
  Moonshot,
  OpenAI,
  OpenRouter,
  Qwen,
  SiliconCloud,
  Together,
  XAI,
  Zhipu,
} from "@lobehub/icons";

const iconMap = {
  Anthropic,
  DeepSeek,
  Groq,
  Mistral,
  Moonshot,
  OpenAI,
  OpenRouter,
  Qwen,
  SiliconFlow: SiliconCloud,
  "Together AI": Together,
  xAI: XAI,
  ZhipuAI: Zhipu,
};

export function ProviderIcon({ name, size = 20 }: { name: string; size?: number }) {
  const Icon = iconMap[name as keyof typeof iconMap] ?? OpenAI;
  return <Icon.Avatar size={size} />;
}
