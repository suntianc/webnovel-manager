---
name: webnovel-review
description: 审查章节质量并生成报告。用于用户说"审查第X章"、"质量报告"、"章节检查"时，或执行/webnovel-review命令。调用审查代理执行设定一致性、连贯性、人物OOC、追读力等多维检查，产出带评分的审查报告和改进建议。配合--full执行完整审查（包含节奏、爽点检查），--range指定章节范围。
allowed-tools: Read Grep Write Edit Bash Task AskUserQuestion
---

# 网文审查 Skill

## 快速参考

| 参数 | 说明 |
|------|------|
| `--full` | 完整审查（包含节奏、爽点检查） |
| `--range 1-5` | 审查指定章节范围 |

**产出**：`审查报告/第X-Y章审查报告.md`、`review_metrics` 落库

## 核心约束

- **审查深度**：Core（默认4项）vs Full（+节奏/爽点）
- **critical 问题**：必须用 AskUserQuestion 询问用户处理方式
- **审查指标**：必须落库（index.db）

## 执行流程

### Step 1：加载参考

```bash
cat "${SKILL_ROOT}/../../references/shared/core-constraints.md"
```

### Step 2：加载项目状态

```bash
cat "$PROJECT_ROOT/.webnovel/state.json"
```

### Step 3：调用审查器

**动态加载审查器**（从 registry.yaml）：
```bash
python -X utf8 "${SCRIPTS_DIR}/webnovel.py" checkers list --mode {standard|minimal|full} --format json
```

**审查器分类**：
- `core`：始终执行
- `conditional`：满足触发条件时执行

**Task 调用**：使用 registry.yaml 中的 `invoke_template` 调用各审查器

**审查器输出格式**：
```json
{
  "agent": "审查器ID",
  "chapter": 章节号,
  "overall_score": 0-100,
  "pass": true/false,
  "issues": [{"severity": "critical|high|medium|low", "description": "...", "suggestion": "..."}],
  "summary": "一句话总结"
}
```

### Step 4：生成审查报告

保存到：`审查报告/第{start}-{end}章审查报告.md`

```markdown
# 第 {start}-{end} 章质量审查报告

## 综合评分
- 爽点密度 / 设定一致性 / 节奏控制 / 人物塑造 / 连贯性 / 追读力

## 修改优先级
- 🔴 高优先级（必须修改）
- 🟠 中优先级（建议修改）
```

### Step 5：保存审查指标

```bash
python "${SCRIPTS_DIR}/webnovel.py" --project-root "${PROJECT_ROOT}" index save-review-metrics --data '@review_metrics.json'
```

### Step 6：写回 state.json

```bash
python "${SCRIPTS_DIR}/webnovel.py" --project-root "${PROJECT_ROOT}" update-state -- --add-review "{start}-{end}" "审查报告/第{start}-{end}章审查报告.md"
```

### Step 7：处理 critical 问题

如 `severity_counts.critical > 0`，使用 AskUserQuestion 询问：
- A) 立即修复（推荐）
- B) 仅保存报告，稍后处理

### Step 8：收尾

```bash
python "${SCRIPTS_DIR}/webnovel.py" --project-root "${PROJECT_ROOT}" workflow complete-task --artifacts '{"ok":true}' || true
```

## 审查指标 JSON 格式

```json
{
  "start_chapter": 1,
  "end_chapter": 5,
  "overall_score": 75,
  "dimension_scores": {
    "爽点密度": 8,
    "设定一致性": 7,
    "节奏控制": 7,
    "人物塑造": 8,
    "连贯性": 9,
    "追读力": 9
  },
  "severity_counts": {"critical": 0, "high": 2, "medium": 3, "low": 1}
}
```

## 验证

- 审查报告文件存在
- review_metrics 已落库