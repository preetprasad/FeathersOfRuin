# Sunken Garden & CS Building

> Region One · Trust and misinformation

[Back to the event guide](../../README.md)

> **Project status:** Research reference only. Team 4Freshers selected and implemented [Reid Sentinel](../reid-library/README.md) for the main submission. See the [complete project record](../reid-library/PROJECT_RECORD.md) or open the [public demo](https://reid-sentinel.vercel.app/).

## Mission

The Computer Science Building contains scavenged transmitters, damaged campus Wi-Fi hardware, and relay racks. The Sunken Garden is the robot decision hub. The network carries warnings, safe routes, emergency requests, and supply locations, but peacocks can imitate legitimate broadcasters and interfere with signals.

Build one focused system that helps the robots decide whether, when, and how to trust the network.

## Official project requirements

The solution must contain:

- A usable web interface
- A chart, table, trend, or other readable data component
- A meaningful, well-prompted LLM feature
- One selected problem thread rather than an attempt to solve the entire region

## Supplied data

### Broadcast message log

The log contains individual broadcasts with fields such as:

- Sender
- Timestamp
- Location
- Message type
- Message content

### Sender history

The sender roll-up contains:

- Broadcast history
- Reliability score
- Current status
- Relay or sender identity

[Download the event datasets](https://drive.google.com/drive/folders/1PhiIBZ-ngRpJv91hGCu_9vg9zpwcYfbp?usp=sharing)

## Available threads

### 1. The false all-clear

Peacocks issue fake all-clear broadcasts that divert supply convoys into dangerous areas.

**Decision to improve:** Should a convoy trust a message and change route?

**Strong product direction:** A verification console that combines sender reliability, message freshness, location consistency, and corroborating reports. It should show evidence and allow the user to approve, quarantine, or escalate the broadcast.

### 2. Marv Mail

Marv Mail sends confident reports that later prove false. The cause may be a damaged transmitter, a copied identity, or stale information.

**Decision to improve:** What is wrong with Marv Mail, and how should future reports be handled?

**Strong product direction:** An identity-investigation timeline that compares reports with later corrections and explains evidence for multiple hypotheses without claiming certainty.

### 3. Marv

The network founder refuses to shut the relay down but cannot reliably separate real messages from interference.

**Decision to improve:** Which messages can be acted on immediately and which require review?

**Strong product direction:** A risk-based moderation queue that considers urgency, consequence, sender history, and corroboration while keeping a human reviewer in control.

### 4. The Mini-Marvs

Junior scouts manually compare locations, earlier messages, and eyewitness accounts before acting.

**Decision to improve:** How can evidence cross-checking become faster without removing scout judgment?

**Strong product direction:** An evidence-matching assistant that retrieves related reports, normalises their claims, and presents consistencies and conflicts in one review screen.

### 5. The silent outposts

Some outposts stopped broadcasting because they fear identity copying. Genuine emergencies may now go unheard.

**Decision to improve:** Which silence is expected and which may indicate distress?

**Strong product direction:** An outpost-health monitor that learns normal communication cadence, flags unusual gaps, and prepares a cautious verification workflow.

## Concepts to understand

### Domain

- Misinformation and disinformation
- Sender identity and impersonation
- Source reliability and reputation
- Message freshness
- Corroboration and conflicting evidence
- Communication-network resilience
- Risk, uncertainty, and trust recovery
- False-positive and false-negative consequences

### Data and NLP

- Log and sender-history analysis
- Timestamp and location consistency
- Reliability over time
- Message classification
- Claim and entity extraction
- Semantic similarity
- Contradiction detection
- Cross-source evidence retrieval
- Communication-frequency baselines

### AI and product

- Evidence-grounded LLM outputs
- Structured response schemas
- Retrieval-augmented generation
- Untrusted-input and prompt-injection awareness
- Human-in-the-loop moderation
- Explainable risk indicators
- Investigation timelines and audit trails

## Implementation warning

Do not build an unexplained “AI truth detector.” Writing style alone cannot establish truth. Use the supplied history, time, location, corroboration, and stable record identifiers. Show uncertainty and preserve human approval.

## Suggested directory layout

```text
sunken-garden-and-cs-building/
├── README.md
├── data/          # Raw and cleaned event data
├── analysis/      # Exploration and experiments
├── app/           # Region application
└── docs/          # Decisions, prompts, and demo notes
```

## Decision record

```text
Status: Not selected for the 4Freshers main implementation
Selected thread: None
Reason retained: Preserve Sunken Garden and CS requirements, concepts, and product directions as a research reference
Active team project: Reid Library — Two failures, no warning
Implementation: Reid Sentinel
```
