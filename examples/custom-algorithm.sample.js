async function decide({ task, roster, signals }) {
  const agents = [];

  if (signals.domains.includes("research")) {
    agents.push({
      id: "codex-explorer",
      role: "Explorer",
      count: 1,
      reason: "先定位上下文和风险"
    });
  }

  if (signals.domains.includes("code")) {
    agents.push({
      id: "codex-worker",
      role: "Code Worker",
      count: signals.complexity === "epic" ? 2 : 1,
      reason: "实现明确边界内的代码改动"
    });
  }

  if (signals.domains.includes("data")) {
    agents.push({
      id: "dbgpt",
      role: "Data Worker",
      count: 1,
      reason: "作为候选数据 agent 处理 SQL、CSV、表格或报表分析"
    });
  }

  if (signals.domains.includes("browser")) {
    agents.push({
      id: "browser-use",
      role: "Browser Worker",
      count: 1,
      reason: "作为候选浏览器 agent 处理网页操作或网页 QA"
    });
  }

  if (signals.domains.includes("review") || signals.complexity !== "simple") {
    agents.push({
      id: "codex-reviewer",
      role: "Reviewer",
      count: 1,
      reason: "独立审查 bug、回归和测试缺口"
    });
  }

  const capped = agents.slice(0, roster.default_policy.max_parallel_agents);

  return {
    strategy: "custom-sample",
    selected_agents: capped,
    notes: [
      `Task length: ${task.length}`,
      `Complexity: ${signals.complexity}`
    ]
  };
}

module.exports = { decide };
