#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const ROOT = path.resolve(__dirname, "..");
const ROSTER_PATH = path.join(ROOT, "config", "legion.roster.json");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function parseArgs(argv) {
  const args = {
    command: argv[2],
    task: null,
    algorithm: null,
    complexity: null,
    json: false
  };

  const rest = argv.slice(3);
  for (let i = 0; i < rest.length; i += 1) {
    const value = rest[i];
    if (value === "--algorithm") {
      args.algorithm = rest[i + 1];
      i += 1;
    } else if (value === "--complexity") {
      args.complexity = rest[i + 1];
      i += 1;
    } else if (value === "--json") {
      args.json = true;
    } else if (!args.task) {
      args.task = value;
    } else {
      args.task = `${args.task} ${value}`;
    }
  }

  return args;
}

function usage() {
  return [
    "Usage:",
    '  node tools/legionctl.js plan "task description"',
    '  node tools/legionctl.js plan "task description" --algorithm ./algorithm.js',
    "  node tools/legionctl.js doctor",
    "",
    "Options:",
    "  --complexity simple|standard|complex|epic",
    "  --algorithm  path to a JS module exporting decide(context)",
    "  --json       print machine-readable summary"
  ].join("\n");
}

function uniq(values) {
  return [...new Set(values)];
}

function detectDomains(task) {
  const domains = [];
  const lower = task.toLowerCase();
  const checks = [
    ["code", /代码|项目|仓库|repo|bug|修复|实现|构建|build|test|测试|前端|后端|api|cli|文件|diff|patch|重构|部署|vercel|npm|pnpm|python|node/],
    ["research", /调研|研究|资料|搜索|查找|对比|方案|选型|来源|论文|news|latest|research|compare/],
    ["browser", /浏览器|网页|网站|localhost|chrome|登录|表单|截图|browser|web|page/],
    ["data", /数据|csv|excel|表格|数据库|sql|报表|分析|统计|图表|data|sheet|xlsx/],
    ["docs", /文档|说明|readme|规则|prompt|守则|手册|doc|markdown|md/],
    ["review", /审查|review|检查|回归|风险|验收|测试缺口/],
    ["workflow", /agent|subagent|智能体|军团|工作流|编排|调度|算法|orchestration|workflow/],
    ["ops", /发布|上线|部署|权限|自动化|监控|定时|automation|ci|cd/]
  ];

  for (const [domain, pattern] of checks) {
    if (pattern.test(lower)) domains.push(domain);
  }

  return domains.length ? uniq(domains) : ["docs"];
}

function detectRiskFlags(task) {
  const lower = task.toLowerCase();
  const flags = [];
  const checks = [
    ["secret", /密钥|密码|token|api key|apikey|cookie|secret|credential/],
    ["payment", /付款|支付|购买|订阅|payment|pay|billing/],
    ["send_message", /发消息|发送邮件|发邮件|短信|通知别人|send email|send message/],
    ["production_write", /生产库|生产环境|线上数据库|prod|production|delete|删除|drop table|写库|迁移/],
    ["login_state", /登录态|已登录|账号|session|oauth/]
  ];

  for (const [flag, pattern] of checks) {
    if (pattern.test(lower)) flags.push(flag);
  }

  return flags;
}

function explicitAgentCount(task) {
  const match = task.match(/(\d+)\s*(个|名|位)?\s*(agent|agents|智能体|子\s*agent|子智能体)/i);
  if (!match) return null;
  return Number(match[1]);
}

function inferComplexity(task, domains, override) {
  if (override) return override;
  const length = [...task].length;
  if (length < 45 && domains.length <= 1) return "simple";
  if (length < 100 && domains.length <= 2) return "standard";
  if (length < 220 && domains.length <= 4) return "complex";
  return "epic";
}

function targetAgentCount(signals, roster) {
  const cap = roster.default_policy.max_parallel_agents;
  if (signals.risk_flags.length) return Math.min(roster.default_policy.sensitive_task_agent_cap, cap);
  if (signals.requested_agent_count !== null) return Math.max(0, Math.min(signals.requested_agent_count, cap));
  if (signals.complexity === "simple") return 0;
  if (signals.domains.includes("code") && signals.domains.includes("review")) return Math.min(2, cap);
  if (signals.domains.includes("data") && signals.domains.includes("review")) return Math.min(2, cap);
  if (signals.domains.includes("browser") && signals.domains.includes("review")) return Math.min(2, cap);
  if (signals.complexity === "standard") return 1;
  if (signals.complexity === "complex") return Math.min(3, cap);
  return Math.min(5, cap);
}

function findAgent(roster, id) {
  return [...roster.builtin_agents, ...roster.external_agent_candidates].find((agent) => agent.id === id);
}

function buildParallelGroups(selectedAgents) {
  const reviewers = selectedAgents.filter((agent) => /reviewer/i.test(agent.id) || /reviewer/i.test(agent.role));
  const nonReviewers = selectedAgents.filter((agent) => !reviewers.includes(agent));
  const groups = [];
  if (nonReviewers.length) groups.push(nonReviewers.map((agent) => agent.id));
  if (reviewers.length) groups.push(reviewers.map((agent) => agent.id));
  return groups;
}

function heuristicPlan(task, roster, signals) {
  const selected = [];
  const add = (id, role, reason, count = 1) => {
    const existing = selected.find((agent) => agent.id === id);
    if (existing) {
      existing.count = Math.max(existing.count, count);
      return;
    }
    selected.push({ id, role, reason, count });
  };

  if (signals.domains.includes("research") || signals.domains.includes("workflow") || signals.domains.includes("docs")) {
    add("codex-explorer", "Explorer", "先读取现有上下文、边界和风险");
  }

  if (signals.domains.includes("code") || signals.domains.includes("ops")) {
    add("codex-worker", "Code Worker", "实现明确文件范围内的改动");
  }

  if (signals.domains.includes("browser")) {
    add("browser-use", "Browser Worker", "候选外部浏览器 agent，用于网页操作或 QA");
  }

  if (signals.domains.includes("data")) {
    add("dbgpt", "Data Worker", "候选数据 agent，用于 SQL、表格、报表分析");
  }

  if (signals.domains.includes("workflow") && signals.complexity !== "simple") {
    add("langgraph", "Workflow Runtime", "候选长期编排 runtime，用于状态化工作流");
  }

  if (signals.complexity === "complex" || signals.complexity === "epic" || signals.domains.includes("review")) {
    add("codex-reviewer", "Reviewer", "独立检查回归风险和测试缺口");
  }

  const count = targetAgentCount(signals, roster);
  const capped = selected.slice(0, count).map((agent) => {
    const metadata = findAgent(roster, agent.id);
    return {
      ...agent,
      runtime: metadata ? metadata.runtime || "external_candidate" : "unknown",
      agent_type: metadata ? metadata.agent_type || null : null,
      prompt_template: metadata ? metadata.prompt_template || null : null,
      activation: metadata ? metadata.activation || "builtin" : "unknown"
    };
  });

  return {
    strategy: "conservative-heuristic",
    selected_agents: capped,
    parallel_groups: buildParallelGroups(capped),
    commander_only: capped.length === 0,
    notes: [
      `Domains: ${signals.domains.join(", ")}`,
      `Complexity: ${signals.complexity}`,
      `Target subagents: ${count}`
    ]
  };
}

async function loadAlgorithm(file) {
  const resolved = path.resolve(ROOT, file);
  try {
    const moduleUrl = `${pathToFileURL(resolved).href}?t=${Date.now()}`;
    const imported = await import(moduleUrl);
    return imported.decide || (imported.default && imported.default.decide) || imported.default;
  } catch (esmError) {
    delete require.cache[resolved];
    const required = require(resolved);
    return required.decide || required.default || required;
  }
}

function normalizeAlgorithmPlan(raw, roster) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Algorithm must return an object.");
  }

  const selected = Array.isArray(raw.selected_agents) ? raw.selected_agents : [];
  const capped = selected
    .slice(0, roster.default_policy.max_parallel_agents)
    .map((agent) => {
      const id = agent.id;
      const metadata = findAgent(roster, id) || {};
      return {
        id,
        role: agent.role || metadata.role || "Specialist",
        reason: agent.reason || "Selected by custom algorithm",
        count: Math.max(1, Number(agent.count || 1)),
        runtime: metadata.runtime || "external_candidate",
        agent_type: metadata.agent_type || null,
        prompt_template: metadata.prompt_template || null,
        activation: metadata.activation || "selected_by_algorithm"
      };
    });

  return {
    strategy: raw.strategy || "custom-algorithm",
    selected_agents: capped,
    parallel_groups: Array.isArray(raw.parallel_groups) ? raw.parallel_groups : buildParallelGroups(capped),
    commander_only: capped.length === 0,
    notes: Array.isArray(raw.notes) ? raw.notes : []
  };
}

function slugify(text) {
  const ascii = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return ascii || "task";
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function renderTemplate(file, replacements) {
  let content = fs.readFileSync(path.join(ROOT, file), "utf8");
  for (const [key, value] of Object.entries(replacements)) {
    content = content.replaceAll(`{{${key}}}`, String(value));
  }
  return content;
}

function buildDispatchRequest(task, roster, signals) {
  return {
    task,
    commander: {
      id: roster.commander.id,
      model: roster.commander.model
    },
    constraints: {
      max_parallel_agents: roster.default_policy.max_parallel_agents,
      sensitive: signals.risk_flags.length > 0,
      allowed_write_scopes: [],
      forbidden_actions: roster.commander.cannot_delegate
    },
    signals
  };
}

function buildPlan(task, roster, signals, plannerResult) {
  return {
    schema_version: "1.0.0",
    created_at: new Date().toISOString(),
    workspace: roster.workspace,
    commander: roster.commander,
    task,
    signals,
    planner: plannerResult,
    execution_contract: {
      mode: "commander_executes_plan",
      actual_subagent_invocation: "Codex commander calls multi_agent_v1 or external tools after reviewing this plan.",
      final_acceptance_owner: roster.commander.id,
      required_before_execution: [
        "confirm no sensitive data is delegated",
        "assign disjoint write scopes to workers",
        "define validation command or acceptance check"
      ]
    }
  };
}

function writeRunArtifacts(plan, roster) {
  const runDir = path.join(ROOT, "logs", "runs", `${stamp()}-${slugify(plan.task)}`);
  const promptDir = path.join(runDir, "prompts");
  fs.mkdirSync(promptDir, { recursive: true });
  writeJson(path.join(runDir, "dispatch-plan.json"), plan);
  writeJson(path.join(runDir, "dispatch-request.json"), buildDispatchRequest(plan.task, roster, plan.signals));

  const planSummary = plan.planner.selected_agents
    .map((agent) => `${agent.id} (${agent.role}): ${agent.reason}`)
    .join("\n") || "Commander works solo.";

  fs.writeFileSync(
    path.join(promptDir, "commander.md"),
    renderTemplate("prompts/commander.md", {
      TASK: plan.task,
      PLAN_SUMMARY: planSummary
    })
  );

  for (const agent of plan.planner.selected_agents) {
    if (!agent.prompt_template) continue;
    const prompt = renderTemplate(agent.prompt_template, {
      TASK: plan.task,
      ASSIGNMENT: agent.reason,
      SCOPE: "由 commander 在执行前补充具体文件/模块范围",
      FORBIDDEN_SCOPE: "未分配给本 agent 的文件、密钥、账号、生产数据",
      ACCEPTANCE: "由 commander 在执行前补充验证命令或验收标准"
    });
    fs.writeFileSync(path.join(promptDir, `${agent.id}.md`), prompt);
  }

  return runDir;
}

function walkFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(full));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }

  return files;
}

function scanForLikelySecrets(files) {
  const patterns = [
    /sk-[A-Za-z0-9_-]{20,}/,
    /xox[baprs]-[A-Za-z0-9-]{20,}/,
    /(?:api[_-]?key|password|secret|token)\s*[:=]\s*["'][^"']{12,}["']/i,
    /-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----/
  ];

  const hits = [];
  for (const file of files) {
    const relative = path.relative(ROOT, file);
    if (relative.startsWith(`logs${path.sep}runs${path.sep}`)) continue;
    if (relative.startsWith(`runs${path.sep}`)) continue;
    const content = fs.readFileSync(file, "utf8");
    if (patterns.some((pattern) => pattern.test(content))) {
      hits.push(relative);
    }
  }
  return hits;
}

function doctor() {
  const checks = [];
  const pass = (name, detail = "") => checks.push({ status: "PASS", name, detail });
  const warn = (name, detail = "") => checks.push({ status: "WARN", name, detail });
  const fail = (name, detail = "") => checks.push({ status: "FAIL", name, detail });

  const requiredFiles = [
    "README.md",
    "multi-agent-workflow-rulebook.md",
    "agent-github-metadata.tsv",
    "config/legion.roster.json",
    "config/permissions.policy.json",
    "config/routing.policy.json",
    "config/workspace.scope.json",
    "schemas/dispatch-request.schema.json",
    "schemas/task-plan.schema.json",
    "schemas/agent-result.schema.json",
    "schemas/review-finding.schema.json",
    "prompts/commander.md",
    "prompts/explorer.md",
    "prompts/worker.md",
    "prompts/reviewer.md",
    "tools/legionctl.js",
    "scripts/army-plan",
    "scripts/army-doctor"
  ];

  for (const file of requiredFiles) {
    if (fs.existsSync(path.join(ROOT, file))) pass(`required file: ${file}`);
    else fail(`required file: ${file}`, "missing");
  }

  let roster = null;
  try {
    roster = readJson(ROSTER_PATH);
    pass("roster parses as JSON");
  } catch (error) {
    fail("roster parses as JSON", error.message);
  }

  if (roster) {
    if (roster.commander && roster.commander.model === "gpt-5.5") {
      pass("commander model is gpt-5.5");
    } else {
      fail("commander model is gpt-5.5");
    }

    if (roster.default_policy && roster.default_policy.prefer_builtin_codex_agents === true) {
      pass("policy prefers built-in Codex agents first");
    } else {
      warn("policy prefers built-in Codex agents first", "not explicitly true");
    }

    const builtins = Array.isArray(roster.builtin_agents) ? roster.builtin_agents.length : 0;
    const external = Array.isArray(roster.external_agent_candidates) ? roster.external_agent_candidates.length : 0;
    if (builtins >= 3) pass("built-in agent roster", `${builtins} entries`);
    else fail("built-in agent roster", `${builtins} entries`);

    if (external >= 17) pass("external candidate roster", `${external} entries`);
    else warn("external candidate roster", `${external} entries`);

    const repoRoot = roster.source_files && roster.source_files.known_external_repo_root;
    if (repoRoot && fs.existsSync(repoRoot)) {
      const repoCount = fs.readdirSync(repoRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).length;
      if (repoCount >= 17) pass("external repo root", `${repoCount} local candidate repos found`);
      else warn("external repo root", `${repoCount} local candidate repos found`);
    } else {
      warn("external repo root", "path not found; external agents remain metadata-only candidates");
    }
  }

  const metadataLines = fs.existsSync(path.join(ROOT, "agent-github-metadata.tsv"))
    ? fs.readFileSync(path.join(ROOT, "agent-github-metadata.tsv"), "utf8").trim().split(/\r?\n/).length
    : 0;
  if (metadataLines >= 18) pass("metadata snapshot", `${metadataLines - 1} repos`);
  else warn("metadata snapshot", `${Math.max(0, metadataLines - 1)} repos`);

  const textFiles = walkFiles(ROOT).filter((file) => {
    const ext = path.extname(file);
    return [".md", ".json", ".js", ""].includes(ext);
  });
  const secretHits = scanForLikelySecrets(textFiles);
  if (secretHits.length === 0) pass("likely secret scan", "no obvious secrets in framework files");
  else fail("likely secret scan", secretHits.join(", "));

  const failed = checks.filter((check) => check.status === "FAIL").length;
  for (const check of checks) {
    const detail = check.detail ? ` - ${check.detail}` : "";
    console.log(`[${check.status}] ${check.name}${detail}`);
  }

  if (failed > 0) {
    process.exitCode = 1;
  }
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.command === "doctor") {
    doctor();
    return;
  }

  if (args.command !== "plan" || !args.task) {
    console.error(usage());
    process.exit(1);
  }

  const roster = readJson(ROSTER_PATH);
  const domains = detectDomains(args.task);
  const signals = {
    domains,
    complexity: inferComplexity(args.task, domains, args.complexity),
    risk_flags: detectRiskFlags(args.task),
    requested_agent_count: explicitAgentCount(args.task)
  };

  let plannerResult;
  if (args.algorithm) {
    const decide = await loadAlgorithm(args.algorithm);
    if (typeof decide !== "function") {
      throw new Error("Algorithm module must export decide(context).");
    }
    const raw = await decide({
      task: args.task,
      request: buildDispatchRequest(args.task, roster, signals),
      roster,
      signals
    });
    plannerResult = normalizeAlgorithmPlan(raw, roster);
  } else {
    plannerResult = heuristicPlan(args.task, roster, signals);
  }

  const plan = buildPlan(args.task, roster, signals, plannerResult);
  const runDir = writeRunArtifacts(plan, roster);

  const summary = {
    run_dir: runDir,
    strategy: plan.planner.strategy,
    commander: plan.commander.id,
    model: plan.commander.model,
    domains: plan.signals.domains,
    complexity: plan.signals.complexity,
    selected_agents: plan.planner.selected_agents.map((agent) => ({
      id: agent.id,
      role: agent.role,
      count: agent.count,
      runtime: agent.runtime
    }))
  };

  if (args.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(`Run: ${runDir}`);
    console.log(`Commander: ${summary.commander} (${summary.model})`);
    console.log(`Strategy: ${summary.strategy}`);
    console.log(`Signals: ${summary.domains.join(", ")} / ${summary.complexity}`);
    if (summary.selected_agents.length === 0) {
      console.log("Selected agents: commander only");
    } else {
      console.log("Selected agents:");
      for (const agent of summary.selected_agents) {
        console.log(`- ${agent.id} x${agent.count} (${agent.role}, ${agent.runtime})`);
      }
    }
    console.log("Artifacts: dispatch-plan.json, dispatch-request.json, prompts/");
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
