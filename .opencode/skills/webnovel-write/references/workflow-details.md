# Workflow Details (Deprecated)

本文件已拆分为按步骤单文件，主流程不再直接引用。

请改为按 Step 加载以下文件：

- Step 1.5：`references/step-1.5-contract.md`
- Step 3：`../../checkers/registry.yaml`（审查器注册表）+ `../../checkers/schema.yaml`（Schema 定义）
- Step 5：`references/step-5-debt-switch.md`

说明：
- Step 2B 请读取 `references/style-adapter.md`
- Step 4 请读取 `references/polish-guide.md` 与 `references/writing/typesetting.md`

审查器管理命令：
```bash
# 列出审查器
python webnovel.py checkers list

# 验证配置
python webnovel.py checkers validate
```
