# 把 Codex 变成一支按需调度的 agent 军团

![Codex Agent Legion cover](../assets/agent-legion-cover.png)

Codex Agent Legion 是一个很轻的本地控制台：你给它一个任务，它先不急着“全员出动”，而是生成一份调度计划，告诉主 Codex 应该自己做、叫一个 explorer 先读上下文、安排 worker 去实现，还是最后再把 reviewer 放到后置波次里验收。

它不是一个庞大的 agent 平台，也不是又一套复杂的低代码编排系统。它更像一个能放在项目根目录旁边的操作台：有名册、有边界、有提示词模板、有机器可读的计划文件，还有一个未来可以替换的调度算法入口。

## 它解决什么

很多 multi-agent 工作流的问题不在于“agent 不够多”，而在于一开始就叫了太多 agent。

如果任务只是改一处文案，主 Codex 自己做就够了。如果任务要先读陌生仓库，再改代码，再审查风险，才值得拆成 explorer、worker、reviewer。Codex Agent Legion 的默认策略就是把这个判断显式化：先看任务信号，再决定数量，再生成可检查的调度合同。

## 一次典型使用

```bash
scripts/army-plan "帮我分析这个项目并修复构建失败" --json
```

它会生成：

```text
logs/runs/<timestamp>-<slug>/dispatch-plan.json
logs/runs/<timestamp>-<slug>/dispatch-request.json
logs/runs/<timestamp>-<slug>/prompts/commander.md
logs/runs/<timestamp>-<slug>/prompts/<agent>.md
```

你真正要看的通常是 `dispatch-plan.json`。里面会写清楚任务域、复杂度、风险信号、被选中的 agent、并行分组，以及最终验收人。

## 项目里有什么

- `tools/legionctl.js`：本地 CLI，负责生成计划和健康检查。
- `config/legion.roster.json`：军团名册，包含 commander、内置 agent、外部候选 agent 和默认扩缩容策略。
- `schemas/*.json`：计划、请求、回传结果和审查问题的标准数据结构。
- `prompts/*.md`：不同角色的任务包模板。
- `scripts/army-*`：更稳定的人类入口，适合放进自己的日常工作流。
- `examples/custom-algorithm.sample.js`：以后接入自研调度算法的位置。

## 一个更重要的小设计

reviewer 默认不和 worker 放在同一个执行波次里。

这点很朴素，但实用。实现还没完成时就并行审查，很容易让 reviewer 盯着半成品写结论。这里的默认计划会把实现类 agent 放在前一组，把 reviewer 放到后一组，主 Codex 再根据实际 diff 和验证命令做最终接受。

## 核心技术，一笔带过

底层没有神秘技术：一个 Node CLI、几份 JSON 配置、几份 JSON Schema、一些 prompt 模板，再加上一个可替换的 `decide(context)` 调度函数。真正的价值不在复杂实现，而在把“谁能做什么、什么时候做、谁负责验收”写成稳定、可读、可检查的合同。

## 怎么把它带走

克隆仓库后可以直接运行：

```bash
npm test
npm run plan:demo
```

也可以打成一个本地 npm 包：

```bash
npm pack --pack-destination dist
npm install -g ./dist/codex-agent-legion-0.1.0.tgz
army-plan "整理这个项目的发布计划"
```

## 适合谁

它适合已经在用 Codex 做项目工作、并且开始遇到这些问题的人：

- 不想每次都手写一遍“主 agent / 子 agent”分工。
- 想让任务复杂时自动扩展，但简单任务不要过度调用。
- 想保留一个未来接入自研调度算法的位置。
- 想让每次 delegation 都留下可审计的计划文件。

Codex Agent Legion 的目标不是替你创造一支永远在线的自动化团队。它只是让主 Codex 在需要帮手时，叫得更准、更少、更有边界。
