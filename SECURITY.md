# Security

Codex Agent Legion is a local planning console. It writes dispatch plans and prompt packets; it does not intentionally send secrets, credentials, or production data anywhere.

Please do not open public issues containing secrets, tokens, private prompts, customer data, or proprietary code. Remove sensitive content before sharing logs from `logs/runs/`.

## Delegation Boundaries

The default policy keeps these actions under commander control:

- Secrets and credentials.
- Login sessions and cookies.
- Payment or billing actions.
- Outbound messages sent to real people.
- Production database writes or destructive operations.

If you add new agents or custom schedulers, keep those boundaries explicit.
