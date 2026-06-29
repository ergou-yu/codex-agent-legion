# Codex 多 Agent 工作守则

更新时间：2026-06-21  
定位：把 Codex 当主 agent，按任务需要调用内置子 agent 与已下载的开源/免费 agent 工具。主 agent 保留拆解、权限控制、整合、验收与最终回复权。

## 本文件夹里的军团控制台

当前文件夹已经按这份守则搭好一个以 `Codex gpt-5.5` 为中心的本地 agent 军团控制台：

- `config/legion.roster.json`：军团名册，gpt-5.5 commander 是唯一主控，Codex 内置 `explorer` / `worker` / `reviewer` 是默认第一梯队。
- `config/permissions.policy.json`、`config/routing.policy.json`、`config/workspace.scope.json`：权限、路由和工作区边界。
- `schemas/*.json`：之后调度算法、任务计划、agent 结果、review finding 的机器可读接口。
- `prompts/*.md`：commander、explorer、worker、reviewer、browser、data、workflow runtime 的任务模板。
- `tools/legionctl.js` 与 `scripts/army-*`：本地计划生成和健康检查入口。

常用命令：

```bash
scripts/army-doctor
scripts/army-plan "你的任务描述"
scripts/army-plan "你的任务描述" --algorithm ./path/to/algorithm.js
```

说明：`army-plan` 只生成调度计划和 prompts，不会擅自安装或启动 17 个外部 agent。真正执行时仍由主 Codex 按计划调用内置子 agent 或按需启用外部工具，并做最终验收。

## 以后可直接发给 Codex 的短版

请按“主 agent + 专职子 agent”的方式工作：

1. 主 Codex 先判断任务是否值得拆分。小任务自己完成；复杂任务才拆给子 agent。
2. 优先使用 Codex 内置子 agent：`explorer` 负责快速调研/读代码，`worker` 负责明确边界的实现，主 Codex 负责整合和验收。
3. 只有当外部工具明显更适合时，才调用本地下载的 agent 仓库：代码 worker 用 Aider、mini-SWE-agent、Qwen Code、OpenHands；浏览网页用 Browser Use；深度研究用 DeerFlow；数据分析用 DB-GPT；多 agent 编排实验用 LangGraph、CrewAI、AgentScope、AG2、Microsoft Agent Framework、Qwen-Agent。
4. 给每个子 agent 的任务必须有清楚的输入、产出、文件范围、禁止事项、超时和验收标准。
5. 多个 worker 不要改同一批文件；如果必须碰同一文件，先由主 Codex 串行安排。
6. 子 agent 的输出都只是候选结果。主 Codex 必须检查 diff、运行必要验证、修正冲突，再给用户最终结论。
7. 不把密钥、登录态、私人文件、生产数据库写入子 agent 提示。需要外部访问时先说明风险。
8. 能用沙箱就用沙箱；能只读就只读；能小范围授权就不要给全仓权限。

## 可选的本地 Agent 仓库

如果你想让外部开源 agent 从“候选”变成“可本地执行”，建议把浅克隆仓库放到这个目录：

`external-agent-repos/`

元数据快照：

`agent-github-metadata.tsv`

| 仓库 | 本地目录 | 适合角色 | 许可证 | 当前下载 commit |
|---|---|---|---|---|
| [OpenHands/OpenHands](https://github.com/OpenHands/OpenHands) | `OpenHands` | 重型代码执行、长任务软件工程、自托管 coding agent | GitHub API: `NOASSERTION` | `7b228db` |
| [QwenLM/qwen-code](https://github.com/QwenLM/qwen-code) | `qwen-code` | 终端代码 agent、中文/通义生态、MCP/子 agent/团队能力 | Apache-2.0 | `f1a5b70` |
| [Aider-AI/aider](https://github.com/Aider-AI/aider) | `aider` | 小范围代码 patch、结对编程式 worker | Apache-2.0 | `5dc9490` |
| [SWE-agent/mini-swe-agent](https://github.com/SWE-agent/mini-swe-agent) | `mini-swe-agent` | 轻量代码修复 worker、跑测试、修 issue | MIT | `674e908` |
| [browser-use/browser-use](https://github.com/browser-use/browser-use) | `browser-use` | 浏览器自动化、网页操作、表单/网页 QA | MIT | `48c3c88` |
| [bytedance/deer-flow](https://github.com/bytedance/deer-flow) | `deer-flow` | 长链路研究、资料收集、报告/代码/创作型 super agent | MIT | `5a699e2` |
| [eosphoros-ai/DB-GPT](https://github.com/eosphoros-ai/DB-GPT) | `DB-GPT` | 数据分析、SQL、CSV/Excel、报表型 data agent | MIT | `177bfc8` |
| [agentscope-ai/agentscope](https://github.com/agentscope-ai/agentscope) | `agentscope` | 中国生态的生产向多 agent runtime、权限/会话/沙箱实验 | Apache-2.0 | `fd1c2cd` |
| [QwenLM/Qwen-Agent](https://github.com/QwenLM/Qwen-Agent) | `Qwen-Agent` | Qwen 工具调用、RAG、Code Interpreter、MCP 包装层 | Apache-2.0 | `31a4d36` |
| [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) | `langgraph` | 可恢复、状态化、多 agent workflow 编排 | MIT | `711b315` |
| [crewAIInc/crewAI](https://github.com/crewAIInc/crewAI) | `crewAI` | 角色型研究/写作/运营 crew，快速搭流程 | MIT | `9db2d44` |
| [ag2ai/ag2](https://github.com/ag2ai/ag2) | `ag2` | AutoGen 路线的多 agent 对话、专家组、人机协同 | Apache-2.0 | `da4fbec` |
| [microsoft/agent-framework](https://github.com/microsoft/agent-framework) | `agent-framework` | Microsoft 生产向 agent/workflow 框架，Python/.NET | MIT | `098e521` |
| [camel-ai/camel](https://github.com/camel-ai/camel) | `camel` | 多 agent 研究、模拟环境、数据生成、实验 | Apache-2.0 | `51ae9bb` |
| [FoundationAgents/OpenManus](https://github.com/FoundationAgents/OpenManus) | `OpenManus` | 通用任务 agent、MCP 入口试验、轻量 Manus 替代 | MIT | `52a13f2` |
| [FoundationAgents/MetaGPT](https://github.com/FoundationAgents/MetaGPT) | `MetaGPT` | 软件公司式 PRD/架构/工程/测试 SOP 原型 | MIT | `11cdf46` |
| [OpenBMB/ChatDev](https://github.com/OpenBMB/ChatDev) | `ChatDev` | 可视化/零代码多 agent 工作流平台实验 | Apache-2.0 | `a6a5cda` |

说明：这些仓库本身是免费/开源或有开源核心；运行时调用 OpenAI、Qwen、Anthropic、Gemini、云浏览器、云沙箱等服务可能需要账号、额度或付费。当前只做了浅克隆，没有全局安装依赖，也没有配置密钥。

## 任务分工法

### 1. 主 Codex 的职责

主 Codex 永远承担：

- 识别用户真实目标和交付物。
- 判断是否需要拆分。
- 定义每个子任务的边界、输入、输出、文件范围和验收标准。
- 保护用户文件、密钥、账号、数据库和浏览器登录态。
- 合并子 agent 结果，解决冲突。
- 运行最终验证。
- 用简洁语言向用户交付结果。

主 Codex 不把最终判断权交给外部 agent。外部 agent 是工具，不是项目负责人。

### 2. 什么时候不拆分

以下情况主 Codex 自己做：

- 单文件、小修小补、简单解释、简单命令。
- 需求还很模糊，拆分会制造噪音。
- 涉及密钥、隐私、生产数据，且无法做脱敏或只读隔离。
- 子 agent 会比直接做更慢，比如只是查一个函数或改几行 UI。

### 3. 什么时候拆分

以下情况适合拆：

- 需要同时读多个模块或多个资料源。
- 代码改动能天然拆成互不重叠的文件范围。
- 一个 agent 可以继续实现，另一个 agent 可以并行验证。
- 任务包含不同技能：研究、浏览、代码、测试、文档、数据分析。
- 用户明确要求多 agent、分工、并行推进。

### 4. 标准角色

| 角色 | 首选工具 | 产出 |
|---|---|---|
| Planner | 主 Codex | 分工方案、风险点、验收标准 |
| Explorer | Codex `explorer`、DeerFlow | 代码/资料调研结论，带文件或来源引用 |
| Code Worker | Codex `worker`、Aider、mini-SWE-agent、Qwen Code、OpenHands | 有边界的 patch、测试结果 |
| Browser Worker | Browser Use、Codex 浏览器工具 | 网页操作、截图/表单验证、网页数据摘录 |
| Data Worker | DB-GPT、Qwen-Agent | SQL/CSV/Excel 分析、图表和报告草案 |
| Workflow Runtime | LangGraph、AgentScope、CrewAI、AG2、Microsoft Agent Framework | 可复用工作流、agent 编排原型 |
| Reviewer | 主 Codex 或单独 Codex `explorer` | bug 风险、缺测试、行为回归 |
| Archivist | 主 Codex | 产物路径、命令记录、复用说明 |

## 工具选择规则

### 代码任务

优先级：

1. Codex 内置 `worker`：最适合本工作区内的明确改动。
2. Aider：适合小范围文件 patch、重构、文档补充。
3. mini-SWE-agent：适合 issue 修复、跑测试、命令行修 bug。
4. Qwen Code：适合中文语境、Qwen 生态、MCP 或另一个 terminal coding agent。
5. OpenHands：适合长时间、复杂工程任务，但要优先沙箱。

规则：

- 每个 worker 必须有文件或模块所有权。
- worker 不要重置 git、不回滚别人的修改。
- worker 回来后主 Codex 必须检查 diff。
- 大改动分批合并，先测核心路径，再测全量。

### 研究任务

优先级：

1. 主 Codex 浏览官方来源。
2. Codex `explorer` 并行查不同问题。
3. DeerFlow 处理长链路 deep research。
4. CrewAI/AG2/CAMEL 用于实验性多角色研究。

规则：

- 研究必须区分官方来源、二手文章、社区讨论。
- 涉及时效性时必须标注日期。
- 不把单个 agent 的结论当事实，重要结论要交叉验证。

### 浏览网页/操作网页

优先级：

1. 当前 Codex 浏览器/Chrome 工具，适合已登录状态或本地 localhost。
2. Browser Use，适合自动化普通网站操作。

规则：

- 登录、付款、发消息、改权限、删数据前必须得到用户明确授权。
- 不绕 CAPTCHA，不规避网站限制。
- 浏览器 agent 不接触密钥管理页面，除非用户明确要求且任务必要。

### 数据分析

优先级：

1. 主 Codex 直接用本地脚本处理小数据。
2. DB-GPT 处理数据库/SQL/BI/report agent。
3. Qwen-Agent 处理 RAG、Code Interpreter、MCP 工具调用。

规则：

- 数据库默认只读账号。
- SQL 先解释再执行，涉及写操作必须单独确认。
- 输出报告前保留可复算脚本或查询。

### 多 agent 编排/长期系统

优先级：

1. LangGraph：状态机、可恢复、生产型流程。
2. AgentScope：可见、可控、权限/会话隔离，多 agent runtime。
3. Microsoft Agent Framework：Microsoft/Python/.NET/企业栈。
4. CrewAI：快速角色型 crew。
5. AG2：对话式专家组和 human-in-loop。
6. CAMEL/MetaGPT/ChatDev/OpenManus：适合研究、原型和特定范式试验。

规则：

- 先用一条真实任务验证，再抽象成工作流。
- 长期运行必须加日志、超时、重试和人工接管点。
- 每个 agent 的工具权限要最小化。

## 子 Agent 任务模板

### Explorer 模板

```text
你是本任务的 explorer。请只做调研，不修改文件。

目标：
<要回答的问题>

范围：
<仓库路径/模块/资料源>

请输出：
1. 关键结论
2. 证据位置，代码请给文件路径和行号，网页请给官方链接
3. 风险或不确定点
4. 建议主 agent 下一步怎么做

限制：
- 不要改文件
- 不要运行破坏性命令
- 不要重复探索主 agent 已经说明过的内容
```

### Worker 模板

```text
你是本任务的 worker。你不是仓库里唯一的 agent，不要回滚别人改动。

目标：
<要实现/修复的内容>

你负责的文件/模块：
<明确写范围>

你不能改：
<禁止范围>

验收标准：
<测试/命令/行为>

请直接修改文件，完成后输出：
1. 改了哪些文件
2. 核心实现说明
3. 运行了哪些验证
4. 还剩什么风险
```

### Reviewer 模板

```text
你是 reviewer。请按代码审查方式找 bug、回归风险和缺失测试。

输入：
<diff/文件/功能说明>

请优先输出问题，按严重度排序。每个问题包含：
- 文件和行号
- 为什么会出错
- 建议修复方式

如果没有发现问题，请明确说没有发现阻塞问题，并说明剩余测试缺口。
```

## 安全边界

1. 密钥和账号：不把 API key、cookie、密码、个人 token 放进子 agent prompt。
2. 文件权限：外部 agent 默认只在工作区内运行；生产目录、家目录、云盘目录需要明确原因。
3. Git：不允许子 agent 执行 `git reset --hard`、`git checkout -- .`、强推、删除分支，除非用户明确要求。
4. 网络：下载依赖前先确认来源；运行未知脚本前先读 README、锁版本、优先虚拟环境。
5. 浏览器：不要让浏览器 agent 在未知页面读取本地 localhost 控制面板或敏感管理页。
6. 数据库：默认只读；写库、删库、迁移、付款、发消息、发邮件必须单独确认。
7. 成本：外部模型/API/云服务可能收费；长任务先估计调用范围。
8. 时间：每个子 agent 要有超时，卡住后主 Codex接管。

## 推荐的默认协作流程

1. 主 Codex 先读需求，判断是否需要分工。
2. 如果需要分工，先列 2-5 个子任务，每个子任务有清楚产出。
3. 并行启动互不依赖的 explorer/worker。
4. 主 Codex 同时做不重叠的主线工作。
5. 子 agent 回来后，主 Codex 整合结论或 patch。
6. 运行验证：测试、构建、lint、截图、curl、文档渲染，按任务选择。
7. 给用户最终交付：改了什么、验证了什么、产物在哪、还有什么风险。

## 本机后续按需安装命令

这些命令目前没有执行；仅作为后续需要时的入口。

```bash
# 轻量代码 worker
pip install mini-swe-agent

# Aider
python -m pip install aider-install

# Browser Use
pip install "browser-use[core]"

# Qwen Code
npm install -g @qwen-code/qwen-code@latest

# Qwen-Agent
pip install -U "qwen-agent[gui,rag,code_interpreter,mcp]"

# AgentScope
pip install agentscope

# LangGraph
pip install -U langgraph

# CrewAI
pip install crewai

# AG2
pip install "ag2[openai]"

# DB-GPT
pip install dbgpt-app
```

## 当前选型结论

最实用的默认组合：

- 主控与整合：Codex 主 agent。
- 本地并行读代码/实现：Codex 内置 `explorer` / `worker`。
- 轻量代码补丁：Aider 或 mini-SWE-agent。
- 中文/Qwen 生态终端 agent：Qwen Code。
- 重型工程自动化：OpenHands。
- 浏览器执行：Browser Use。
- 深度研究：DeerFlow。
- 数据分析：DB-GPT。
- 长期多 agent 工作流：LangGraph 或 AgentScope。

不要默认把所有 agent 都拉进一个任务。好的多 agent 协作是少数精确分工，而不是热闹。

## 参考来源

- GitHub: [Microsoft Agent Framework](https://github.com/microsoft/agent-framework)
- GitHub: [LangGraph](https://github.com/langchain-ai/langgraph)
- GitHub: [CrewAI](https://github.com/crewAIInc/crewAI)
- GitHub: [OpenHands](https://github.com/OpenHands/OpenHands)
- GitHub: [DeerFlow](https://github.com/bytedance/deer-flow)
- GitHub: [Qwen-Agent](https://github.com/QwenLM/Qwen-Agent)
- GitHub: [Qwen Code](https://github.com/QwenLM/qwen-code)
- GitHub: [AgentScope](https://github.com/agentscope-ai/agentscope)
- GitHub: [OpenManus](https://github.com/FoundationAgents/OpenManus)
- GitHub: [MetaGPT](https://github.com/FoundationAgents/MetaGPT)
- GitHub: [CAMEL](https://github.com/camel-ai/camel)
- GitHub: [DB-GPT](https://github.com/eosphoros-ai/DB-GPT)
- GitHub: [ChatDev 2.0](https://github.com/OpenBMB/ChatDev)
- GitHub: [mini-SWE-agent](https://github.com/SWE-agent/mini-swe-agent)
- GitHub: [Aider](https://github.com/Aider-AI/aider)
- GitHub: [Browser Use](https://github.com/browser-use/browser-use)
- GitHub: [AG2](https://github.com/ag2ai/ag2)
