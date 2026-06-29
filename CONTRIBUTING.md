# Contributing

Thanks for taking a look at Codex Agent Legion.

This project is deliberately small. The best contributions keep the command surface clear, preserve the commander-first safety model, and improve the machine-readable contracts without turning the tool into a heavy platform.

## Local Checks

```bash
npm test
npm run plan:demo
npm pack --pack-destination dist
```

## Good First Contributions

- Improve prompt templates without weakening scope boundaries.
- Add examples for custom scheduling algorithms.
- Add schema tests or fixtures.
- Improve documentation for real operator workflows.

## Design Rules

- Codex remains the final acceptance owner.
- Built-in Codex subagents are preferred before external tools.
- Sensitive tasks should reduce delegation.
- Reviewers should usually run after implementation waves.
- Generated run logs should not be committed.
