# Matilda Bay

> Region Two · Resource allocation and inequity

[Back to the event guide](../../README.md)

> **Project status:** Research reference only. Team 4Freshers selected and implemented [Reid Sentinel](../reid-library/README.md) for the main submission. See the [complete project record](../reid-library/PROJECT_RECORD.md) or open the [public demo](https://reid-sentinel.vercel.app/).

## Mission

Four orca pods collectively have enough water, food, and medicine, but the resources are poorly distributed. Transport is damaged, routes are disrupted, and failed deliveries have undermined trust.

Build one focused system that improves an allocation or delivery decision without treating mathematical efficiency as the same thing as fairness.

## Official project requirements

The solution must contain:

- A usable web interface
- A chart, table, trend, or other readable data component
- A meaningful, well-prompted LLM feature
- One selected problem thread rather than an attempt to solve the entire region

## Supplied data

### Pod inventory and needs

- Food, water, and medicine stock
- Consumption levels
- Status flags
- Delivery records
- Information for all four pods

### Consumption trends

- Daily resource levels
- Day-to-day consumption changes

### Council allocations

- Six bay-wide allocation meetings
- Pod requests and needs
- Distribution outcomes

[Download the event datasets](https://drive.google.com/drive/folders/1PhiIBZ-ngRpJv91hGCu_9vg9zpwcYfbp?usp=sharing)

## Available threads

### 1. Orca Pod 1

Pod 1 controls the last water purifier and charges steep food tolls because its own food supply is nearly exhausted.

**Decision to improve:** What exchange protects water access without starving Pod 1 or exploiting other pods?

**Strong product direction:** A fair-exchange scenario planner showing resource runway, safety buffers, purifier capacity, and the impact of proposed exchanges on every pod.

### 2. Orca Pod 2

Pod 2 has medicine but almost no transport capacity.

**Decision to improve:** Which medicine should move first, to which pod, and through which delivery option?

**Strong product direction:** A medicine-dispatch queue that combines medical urgency, shortage, distance, disruption, cargo capacity, and delivery feasibility.

### 3. Orca Pod 3

Pod 3 overproduces food but stopped sharing after an intercepted convoy.

**Decision to improve:** What limited, safe commitment could rebuild trust and resume sharing?

**Strong product direction:** A trust-aware sharing planner that proves Pod 3 retains a safety buffer and offers staged transfers with route safeguards.

### 4. The courier network

Boats and carts operate without central coordination, causing low-priority cargo to move ahead of urgent deliveries.

**Decision to improve:** How should limited courier capacity be scheduled?

**Strong product direction:** A dispatch board with ranked jobs, capacity, route risk, shortage impact, manual reassignment, and immediate what-if feedback.

### 5. Orca Pod 4

Pod 4 is difficult to reach and its elders stopped requesting help after repeated delays and abandoned deliveries.

**Decision to improve:** How can the system detect serious need when a disadvantaged group no longer asks?

**Strong product direction:** An equity monitor comparing need, requests, allocations, and completed deliveries while flagging systematic exclusion.

## Concepts to understand

### Domain

- Resource scarcity and distribution
- Consumption, replenishment, and resource runway
- Equality versus equity
- Vulnerable populations and hidden need
- Transport constraints and route disruption
- Mutual dependency
- Hoarding and trust
- Short-term relief versus sustainability

### Data and algorithms

- Inventory and consumption analysis
- Shortage forecasting
- Request-versus-allocation comparison
- Population-adjusted need
- Historical inequity detection
- Constraint satisfaction
- Priority queues
- Resource-allocation optimisation
- Delivery scheduling and capacity
- Fairness constraints
- What-if and sensitivity analysis

### AI and product

- Request and urgency extraction
- Council-record summarisation
- Scenario and fairness explanations
- Evidence-linked proposals
- Allocation planners
- Courier dispatch boards
- Equity monitors
- Manual adjustment and approval

## Implementation warning

Do not optimise only for the largest quantity moved or the shortest route. Include minimum survival levels, urgency, access barriers, previous exclusion, feasibility, and the impact on every pod.

## Suggested directory layout

```text
matilda-bay/
├── README.md
├── data/          # Raw and cleaned event data
├── analysis/      # Forecasting and optimisation experiments
├── app/           # Region application
└── docs/          # Decisions, prompts, and demo notes
```

## Decision record

```text
Status: Not selected for the 4Freshers main implementation
Selected thread: None
Reason retained: Preserve Matilda Bay requirements, concepts, and product directions as a research reference
Active team project: Reid Library — Two failures, no warning
Implementation: Reid Sentinel
```
