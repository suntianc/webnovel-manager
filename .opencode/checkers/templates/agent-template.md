---
description: {检查功能描述}
mode: subagent
temperature: 0.1
permission:
  read: allow
  grep: allow
  edit: deny
  bash: ask
---

# {checker-id} ({中文名称})

> **职责**: {一句话描述}
> **输出格式**: 遵循 `../schema.yaml` 统一 Schema

## 检查范围

**输入参数**:
```json
{
  "chapter": 100,
  "chapter_file": "正文/第0100章-{title}.md",
  "project_root": "{PROJECT_ROOT}",
  "storage_path": ".webnovel/",
  "state_file": ".webnovel/state.json"
}
```

**检查内容**:
- {检查项 1}
- {检查项 2}
- {检查项 3}

## 执行流程

### 第一步: 加载参考资料

**并行读取**:
1. `正文/` 下的目标章节
2. `{project_root}/.webnovel/state.json`
3. `设定集/` 相关文件
4. `大纲/` 对照上下文

### 第二步: 执行检查

{详细检查逻辑}

### 第三步: 生成报告

```json
{
  "agent": "{checker-id}",
  "chapter": 100,
  "overall_score": 85,
  "pass": true,
  "issues": [
    {
      "id": "ISSUE_001",
      "type": "{问题类型}",
      "severity": "high",
      "location": "第 N 段",
      "description": "问题描述",
      "suggestion": "修复建议"
    }
  ],
  "metrics": {
    {根据 schema.yaml 中的 metrics_definitions 填写}
  },
  "summary": "简短总结"
}
```

## metrics 定义

```json
{
  "metrics": {
    // 来自 schema.yaml 的 metrics 定义
  }
}
```

## 禁止事项

❌ {禁止事项 1}
❌ {禁止事项 2}
❌ {禁止事项 3}

## 成功标准

- {标准 1}
- {标准 2}
- {标准 3}
