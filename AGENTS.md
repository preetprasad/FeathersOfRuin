# Project agent instructions

## Local-model delegation

Ollama is installed on the project owner's Mac and may be used for small, bounded, low-risk subtasks.

Good delegation targets include:

- Drafting test cases and edge-case lists
- Summarising isolated data findings
- Structured extraction and reformatting
- Boilerplate or repetitive transformations
- Reviewing a small, self-contained module

Keep architecture, security-sensitive work, cross-module integration, external side effects, and final verification with the primary agent.

Treat all local-model output as an untrusted draft. Review it against the source material and run appropriate checks before incorporating it.

Preferred routing:

- `gemma3:4b` or `edge-slm-databricks:latest` for isolated coding and reasoning
- `qwen2.5:3b` for structured extraction and drafting
- 0.5B–1B models only for simple classification or formatting

Do not send secrets, credentials, private user data, or sensitive logs to any model unless the user explicitly authorises that exact use.
