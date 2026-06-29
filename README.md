# Codex Agent Legion

![Codex Agent Legion cover](docs/assets/agent-legion-cover.png)

Codex Agent Legion is a local planning console for a Codex-centered multi-agent workflow.

It keeps Codex gpt-5.5 as the commander, then selects only the specialist agents a task actually needs: explorer, worker, reviewer, browser worker, data worker, or workflow runtime candidates. The output is a machine-readable dispatch plan plus ready-to-use prompt packets.

The project is intentionally small: no hosted backend, no database, no heavy framework. It is a local operator toolkit you can clone, run, inspect, package, and adapt.

## Quick Start

Run a planning pass:

```bash
node tools/legionctl.js plan "帮我分析这个项目并修复构建失败"
```

Or use the stable script entrypoints:

```bash
scripts/army-plan "帮我分析这个项目并修复构建失败"
scripts/army-doctor
```

Generated artifacts are written to:

```text
logs/runs/<timestamp>-<slug>/dispatch-plan.json
logs/runs/<timestamp>-<slug>/dispatch-request.json
logs/runs/<timestamp>-<slug>/prompts/*.md
```

`dispatch-plan.json` is the standard contract. `prompts/*.md` are task packets that the Codex commander can hand to built-in subagents or selected external candidates after checking scope and risk.

## Install As A Local Package

Build a local npm tarball:

```bash
npm pack --pack-destination dist
```

Install it globally from the generated package:

```bash
npm install -g ./dist/codex-agent-legion-0.1.0.tgz
```

Then use the command aliases:

```bash
army-plan "给这个仓库做一次代码审查" --json
army-doctor
legionctl plan "整理一个发布计划"
```

## File Map

- `tools/legionctl.js` is the local CLI and planning engine.
- `scripts/army-*` are stable human-facing entrypoints.
- `config/legion.roster.json` defines the commander, built-in agents, external candidates, scaling policy, and safety gates.
- `config/routing.policy.json`, `config/permissions.policy.json`, and `config/workspace.scope.json` keep the routing and delegation rules explicit.
- `schemas/*.json` define dispatch requests, task plans, agent results, and review findings.
- `prompts/*.md` are role templates for commander, explorer, worker, reviewer, browser, data, and workflow runtime roles.
- `examples/custom-algorithm.sample.js` shows how to plug in a future scheduler.
- `multi-agent-workflow-rulebook.md` is the human-readable main-agent / subagent operating rulebook.
- `agent-github-metadata.tsv` is a snapshot of external open-source agent candidates.
- `docs/blog/introducing-codex-agent-legion.md` is a ready-to-publish launch article.

## Health Check

```bash
npm test
```

This runs:

- JavaScript syntax validation for `tools/legionctl.js`.
- JSON parsing checks for config, schema, and example files.
- `node tools/legionctl.js doctor`.

The doctor checks the required files, roster parsing, commander model, built-in-first policy, external candidate metadata, and a lightweight secret scan.

## Custom Scheduler Hook

Your scheduler only needs to export a `decide(context)` function:

```js
async function decide({ task, request, roster, signals }) {
  return {
    strategy: "algorithm-v1",
    selected_agents: [
      {
        id: "codex-explorer",
        role: "Explorer",
        reason: "先读代码定位模块边界",
        count: 1
      }
    ]
  };
}

module.exports = { decide };
```

Run it like this:

```bash
node tools/legionctl.js plan "你的任务" --algorithm ./path/to/algorithm.js
```

The CLI normalizes the scheduler result into the standard dispatch plan. If `parallel_groups` is not supplied, reviewers are placed in a later wave by default so implementation and review do not fight over unfinished work.

## Default Scaling

- `0` subagents: simple single-point tasks that the commander can finish alone.
- `1` subagent: lightweight exploration, implementation, research, or review.
- `2-3` subagents: code, research, test, and review work can be split safely.
- `4-5` subagents: larger tasks with clear module boundaries and acceptance checks.

Sensitive actions such as secrets, login state, payments, outbound messages, production data, or database writes reduce delegation and keep final control with the Codex commander.

## Launch Materials

- Blog article: [`docs/blog/introducing-codex-agent-legion.md`](docs/blog/introducing-codex-agent-legion.md)
- GitHub Pages starter page: [`docs/index.md`](docs/index.md)
- Cover image: [`docs/assets/agent-legion-cover.png`](docs/assets/agent-legion-cover.png)

## License

MIT. See [`LICENSE`](LICENSE).
