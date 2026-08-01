# Feathers of Ruin — Ultimate Hackathon Team Guide

> A comprehensive working brief for the UWA **Ultimate Hackathon: Vibe to Survive**.
>
> This README converts the event website into an actionable guide for ideation, implementation, and presentation. Statements marked **Official brief** come directly from the event material. Sections labelled **Suggested direction** are team guidance, not extra competition rules.

## Team 4Freshers

| Team member |
|---|
| Preet Prasad |
| Juan enrique Somadinata |
| Dinh Khanh Duy Nguyen |
| jeongyun chae |

## Current project status

| Item | Current state |
|---|---|
| Selected location | **Reid Library** |
| Selected thread | **Two failures, no warning** |
| Product | **Reid Sentinel** |
| Delivery state | Implemented, tested, documented, pushed, and deployed |
| Automated checks | 32 passing tests plus lint and production build |
| Supporting Reid modules | Cross-failure replay, Cloudy-note corroboration, interactive sensor stress testing, and cited AI evidence ledger |
| Public demo | [reid-sentinel.vercel.app](https://reid-sentinel.vercel.app/) |
| Complete project history | [Decisions, pivots, risks, takeaways, and action plan](locations/reid-library/PROJECT_RECORD.md) |

The Matilda Bay and Sunken Garden workspaces remain research references. They are not active implementations and should not be presented as additional main-project submissions.

## Quick facts

| Item | Details |
|---|---|
| Event | Feathers of Ruin — The Ultimate Hackathon: Vibe to Survive |
| Date | 1 August 2026 |
| Time | 9:30 am–6:30 pm |
| Venue | EZONE 109, 110, and 111, UWA Crawley |
| Format | One-day build |
| Organisers | UWA AI Club, Coders for Causes, and UWA Data Science Club |
| Main objective | Choose one region and one problem thread, then build a useful system for its survivors |
| Required components | Web interface, readable data component, and meaningful AI feature |
| Optional work | 12 side quests worth 30 points in total |

## Source material

- [Event home](https://ultimate-hackathon.vercel.app/)
- [World, regions, and challenge threads](https://ultimate-hackathon.vercel.app/story)
- [Interactive campus map](https://ultimate-hackathon.vercel.app/map)
- [Side-quest board](https://ultimate-hackathon.vercel.app/side-quests)
- [Live Reid Sentinel dashboard](https://reid-sentinel.vercel.app/)
- [Interactive Reid Sentinel presentation](https://reid-sentinel.vercel.app/presentation) — guided concepts, live analysis controls, calculated results, and exact source links
- [Reid Sentinel project record](locations/reid-library/PROJECT_RECORD.md) — decisions, pivots, milestones, risks, takeaways, and action plan
- [Event datasets](https://drive.google.com/drive/folders/1PhiIBZ-ngRpJv91hGCu_9vg9zpwcYfbp?usp=sharing)

## Location workspaces

Each challenge location has its own workspace and README so its research, datasets, experiments, application code, and decisions can evolve independently.

| Location | Theme | Workspace |
|---|---|---|
| Sunken Garden & CS Building | Trust and misinformation | [Open location README](locations/sunken-garden-and-cs-building/README.md) |
| Matilda Bay | Resource allocation and inequity | [Open location README](locations/matilda-bay/README.md) |
| **Reid Library — active** | Infrastructure monitoring | [Open location README](locations/reid-library/README.md) |

The root README remains the event-wide reference. Put location-specific implementation notes and files inside the appropriate directory.

## The premise

Two years ago, the peacocks around UWA's Arts Building combined into a Giant Peacock. Its feathers tore through buildings, communications, transport routes, and essential infrastructure across Crawley campus. Three survivor factions established recovery hubs:

- Robots at the Sunken Garden and Computer Science Building
- Orcas at Matilda Bay
- Dragons inside Reid Library

The remaining peacock flock continues to spread misinformation, steal supplies, block routes, and interfere with damaged systems. Our job is to help **one** faction address **one** unresolved crisis.

The fiction is playful, but the three challenge themes are real:

1. Trust and misinformation
2. Resource allocation and inequity
3. Infrastructure monitoring

## Official build requirements

Every main-project submission needs all three of the following.

### 1. A usable web interface

Build something a survivor could actually open and use. A static report by itself is not the intended outcome. The interface should help a user inspect information, make a decision, or complete a workflow.

### 2. A readable data component

Include a chart, table, trend view, or similarly clear presentation of the region's data. The data display should answer a decision-relevant question rather than merely decorate the page.

### 3. A meaningful AI feature

Use a well-prompted LLM call that performs real work in the workflow. A generic chatbot bolted onto the side is unlikely to demonstrate the intent of this requirement. Stronger uses include structured classification, evidence synthesis, explanation, prioritisation, and translating technical findings into actionable guidance.

### Scope rule: pick one thread

The brief explicitly says to choose **one thread, not the whole region**. A focused, reliable product is a better fit than an unfinished platform that attempts every problem.

## A useful product pattern

Most strong concepts can follow this end-to-end loop:

1. **Observe:** ingest or select relevant records.
2. **Explain:** show the evidence through a chart, table, or timeline.
3. **Assess:** calculate risk, urgency, fairness, or anomaly signals.
4. **Recommend:** use AI to turn the evidence into a proposed action.
5. **Confirm:** keep a survivor in control of the final decision.
6. **Record:** save the decision and its reasoning for later review.

This is a suggested design pattern, not an official judging rubric.

---

# Concepts required by region

This section is a consolidated technical study guide. The event officially requires a web interface, a data component, and a meaningful LLM feature; it does **not** require every technique listed below. These are the concepts that may be needed to understand and implement the different problem threads effectively.

## Concepts shared by every region

### Product and problem-solving concepts

- User-centred problem definition
- Selecting one user, one decision, and one problem thread
- Converting a fictional crisis into a concrete workflow
- Designing a usable web interface
- Presenting evidence before recommendations
- Human-in-the-loop decision-making
- Manual approval and override controls
- Audit trails and decision history
- Handling uncertainty and incomplete data
- Honest communication of limitations
- Designing a short, outcome-focused demonstration

### Data concepts

- Loading and validating supplied datasets
- Understanding column types and units
- Missing-value detection and handling
- Duplicate-record detection
- Filtering and sorting
- Aggregation and grouping
- Summary statistics
- Data provenance
- Choosing decision-relevant visualisations
- Distinguishing correlation from causation
- Preventing generated text from overriding calculated facts

### AI and LLM concepts

- Prompt design
- Supplying relevant context
- Structured model outputs
- Schema validation
- Evidence-grounded generation
- Confidence and uncertainty communication
- Hallucination risk
- Human review of model recommendations
- Model-call error handling and fallbacks
- Separating deterministic calculations from generated explanations
- Treating dataset text as untrusted input
- Evaluating whether the AI feature changes or improves the workflow

### Web application concepts

- Responsive interface design
- Accessible labels, tables, and charts
- Clear loading, empty, and error states
- File or dataset ingestion
- State management
- Form validation
- API integration
- Secure handling of model credentials
- Reproducible demo data
- Graceful behaviour when the network or model is unavailable

## Region 1 concept inventory — Sunken Garden & CS Building

### Domain concepts

- Information credibility
- Misinformation and disinformation
- Sender identity and impersonation
- Source reliability and reputation
- Message freshness and stale information
- Evidence corroboration
- Conflicting reports
- Communication-network resilience
- Human-in-the-loop verification
- Risk and uncertainty
- Emergency-message prioritisation
- Trust recovery
- Silence and missing-signal detection
- The cost of false positives and false negatives

### Data concepts

- Broadcast-log analysis
- Sender-history analysis
- Reliability scores
- Timestamp comparison
- Time-window matching
- Location consistency
- Message-type classification
- Communication-frequency baselines
- Duplicate and similar-message detection
- Historical failure-rate analysis
- Contradiction detection
- Cross-source evidence retrieval
- Message provenance and stable message IDs
- Reliability as a time-varying value rather than a permanent label

### AI and NLP concepts

- Natural-language classification
- Claim extraction
- Entity and location extraction
- Message summarisation
- Semantic similarity
- Contradiction detection
- Evidence-grounded reasoning
- Structured LLM output
- Hypothesis generation
- AI-assisted moderation
- Retrieval-augmented generation
- Confidence and uncertainty explanation
- Prompt-injection awareness when analysing untrusted messages

### Product concepts

- Message-verification dashboard
- Investigation timeline
- Moderation and escalation queue
- Evidence-comparison interface
- Approve, quarantine, reject, or escalate actions
- Outpost-health monitoring
- Explainable risk indicators
- Manual overrides
- Reviewer notes
- Search and filtering by sender, location, time, and message type

### Thread-specific concepts

| Thread | Concepts to understand |
|---|---|
| The false all-clear | Fake-message detection, route-warning validation, corroboration, risk scoring, and consequences of acting on a false message |
| Marv Mail | Identity cloning, damaged transmitters, stale reports, competing hypotheses, and reliability changes over time |
| Marv | Network moderation, risk-based triage, degraded-system operation, and balancing dangerous messages against the cost of silence |
| The Mini-Marvs | Evidence matching, semantic claim normalisation, human review, and verification-workflow automation |
| The silent outposts | Missing-event detection, communication-cadence baselines, safe check-in protocols, and detecting hidden emergencies |

### Region 1 implementation warning

Do not build an unexplained “AI truth detector.” A model cannot establish truth merely from writing style. Use sender history, time, location, corroboration, and explicit evidence; show uncertainty and keep the survivor in control.

## Region 2 concept inventory — Matilda Bay

### Domain concepts

- Resource scarcity and resource distribution
- Supply, demand, consumption, and replenishment
- Fairness versus equality
- Equity and vulnerable populations
- Allocation under uncertainty
- Transport and capacity constraints
- Route disruption
- Mutual dependency between groups
- Hoarding caused by distrust
- Access barriers
- Unexpressed or hidden need
- Negotiation and council decision-making
- Short-term relief versus long-term sustainability

### Data concepts

- Inventory analysis
- Consumption-rate calculation
- Days-of-supply or resource-runway calculation
- Shortage forecasting
- Surplus identification
- Delivery-history analysis
- Request-versus-allocation comparison
- Population-adjusted need
- Distance and accessibility analysis
- Disruption rates
- Historical inequity detection
- Priority scoring
- Scenario modelling
- Time-series trends

### Algorithmic and optimisation concepts

- Constraint satisfaction
- Resource-allocation optimisation
- Multi-objective optimisation
- Priority queues
- Delivery scheduling
- Route planning
- Vehicle and cargo capacity
- Minimum safety thresholds
- Fairness constraints
- Trade-off analysis
- What-if simulation
- Sensitivity analysis
- Dynamic replanning when a route or vehicle becomes unavailable

### AI concepts

- Request classification
- Urgency extraction
- Council-record summarisation
- Scenario explanation
- Fairness explanation
- Proposal generation
- Negotiation assistance
- Translating optimisation results into plain language
- Structured recommendations
- Evidence-linked council decision briefs

### Product concepts

- Resource-status dashboard
- Allocation planner
- Courier dispatch board
- Scenario-comparison interface
- Equity monitor
- Shortage alerts
- Delivery-priority queue
- Council proposal generator
- Manual schedule adjustment
- Before-and-after resource projections
- Explanation of who benefits and who carries risk

### Thread-specific concepts

| Thread | Concepts to understand |
|---|---|
| Orca Pod 1 | Water purification, food-for-water exchange, sustainable safety buffers, coercive pricing, and mutual dependence |
| Orca Pod 2 | Medicine prioritisation, last-mile delivery, limited transport capacity, medical urgency, and delivery feasibility |
| Orca Pod 3 | Food surplus, distrust-driven hoarding, convoy risk, staged commitments, and trust-aware sharing |
| The courier network | Job scheduling, cargo prioritisation, vehicle capacity, route disruption, and dynamic replanning |
| Orca Pod 4 | Structural inequity, unmet need without active requests, request abandonment, geographic disadvantage, and fairness audits |

### Region 2 implementation warning

Do not optimise only for the largest quantity moved or the shortest route. A mathematically efficient plan can reinforce inequity. Include minimum survival levels, urgency, delivery feasibility, previous exclusion, and the consequences for every pod.

## Region 3 concept inventory — Reid Library

### Domain concepts

- Predictive maintenance
- Preventive maintenance
- Infrastructure reliability
- System health and failure modes
- Early-warning systems
- Automated versus manual operation
- Sensor trustworthiness
- Maintenance-knowledge preservation
- Human observations as evidence
- Safety-versus-availability trade-offs
- Critical-system dependencies
- Alert fatigue and false alarms

### Time-series and data concepts

- Hourly time-series analysis
- Datetime parsing and chronological ordering
- Missing-value detection
- Sensor baselines
- Threshold detection
- Rate-of-change analysis
- Rolling averages and rolling variability
- Trend and seasonality analysis
- Outlier and anomaly detection
- Multivariate relationships
- Correlation and lagged correlation
- Change-point detection
- Pre-failure pattern analysis
- Sensor drift
- Frozen or repeated readings
- Cross-sensor agreement
- Data-quality and confidence scoring

### Sensor concepts

- Power monitoring
- Airflow
- Water pressure and water flow
- Temperature
- Vibration
- Sound and acoustic monitoring
- Sampling intervals
- Calibration
- Sensor fusion
- Cross-sensor validation
- Smart-sensor onboarding
- Understanding how physical measurements should relate to one another

### AI concepts

- Maintenance-note extraction
- Converting notes into structured hypotheses
- Technical-log summarisation
- Natural-language observation normalisation
- Incident explanation
- Alert explanation
- Maintenance-recommendation generation
- Evidence-grounded decision briefs
- Structured LLM responses
- Separating calculated facts from generated interpretation

### Product concepts

- Infrastructure-health dashboard
- Sensor timeline
- Anomaly and alert panel
- Maintenance-note explorer
- Human-observation logging
- Failure-warning system
- Scenario-comparison tool
- Sensor-quality report
- Alert acknowledgement
- Recommended-action checklist
- Historical incident review

### Thread-specific concepts

| Thread | Concepts to understand |
|---|---|
| Cloudy's notes | Knowledge extraction, hypothesis testing, text-to-sensor alignment, lagged warning patterns, and validating expert observations |
| Two failures, no warning | Anomaly detection, multisensor warning signals, alert levels, warning lead time, and false-alarm management |
| The listeners | Acoustic monitoring, observation logging, sound-description normalisation, and correlating human reports with sound and vibration |
| The two leaders | Decision analysis, manual-versus-automated operation, safety and availability, scenario comparison, and partial shutdown strategies |
| The salvaged sensor | Sensor integration, calibration, missing-data rates, sampling consistency, cross-sensor validation, and confidence scoring |

### Region 3 implementation warning

Do not claim that correlation proves an impending failure. Distinguish observed anomalies, historically repeated patterns, and genuine predictions. Show which sensor readings produced an alert and state how much warning confidence the available data supports.

## Concept-based region selection

| Choose this region when the team is strongest in… | Region |
|---|---|
| NLP, LLMs, misinformation analysis, evidence retrieval, and trust-oriented UX | Sunken Garden & CS Building |
| Optimisation, logistics, fairness, resource planning, and decision-support systems | Matilda Bay |
| Time-series analysis, anomaly detection, predictive maintenance, and sensor visualisation | Reid Library |

---

# Main challenge 1: Sunken Garden & CS Building

## Theme: Trust and misinformation

The CS Building contains scavenged transmitters, damaged Wi-Fi equipment, and relay racks. The Sunken Garden is where the robots evaluate messages and decide how to act. Their network carries warnings, safe routes, supply locations, and emergency requests, but peacocks can interfere with signals and imitate legitimate broadcasters.

Every message may be genuine, outdated, corrupted, or deliberately false.

## Supplied data

### Broadcast message log

Individual broadcasts across the relay network, including:

- Sender
- Timestamp
- Location
- Message type
- Message content

### Sender history

A roll-up for each sender or relay identity, including:

- Broadcast history
- Reliability score
- Current status

## Thread 1.1 — The false all-clear

### Official brief

Peacocks have learned to imitate “all clear” broadcasts. These messages divert robot supply convoys away from safe routes and into peacock-controlled territory.

### Core decision

Should a convoy trust this all-clear message and change its route?

### Suggested product direction

Build a broadcast-verification console that gives every all-clear a transparent risk assessment. The user should be able to open a message, see why it is suspicious, compare it with recent nearby reports, and either approve, quarantine, or escalate it.

### Useful data signals

- Sender's historical reliability and current status
- Sudden changes in wording, confidence, or broadcast frequency
- Conflicts with other reports from the same time and location
- Improbable location or route transitions
- Lack of corroborating eyewitness or outpost messages
- Whether the sender has previously issued corrected or false reports

### Meaningful AI role

Ask an LLM to extract claims from the message, compare those claims with selected evidence, and return a structured assessment such as `risk`, `conflicts`, `supporting_evidence`, and `recommended_action`. The interface must display the evidence behind the answer; the model should not be treated as an unquestionable oracle.

### Good demo outcome

A survivor opens a suspicious all-clear and can understand within seconds why the system recommends holding the convoy.

## Thread 1.2 — Marv Mail

### Official brief

An outpost using the relay identity **Marv Mail** sends confident, detailed reports that later prove false. The transmitter may be damaged, copied, or simply reporting stale information.

### Core decision

What is wrong with Marv Mail, and how much should its future reports be trusted?

### Suggested product direction

Create an identity-investigation workspace. Build a chronological view of Marv Mail broadcasts, later corrections, locations, and contradictions. Classify likely failure modes without pretending the available evidence proves a single explanation.

### Useful data signals

- Delay between an event and the corresponding report
- Reliability over time instead of one aggregate score
- Reports sent from impossible or rapidly changing locations
- Reused language that could indicate copied transmissions
- Correlation between message type and failure rate
- Contradictory messages from independent senders

### Meaningful AI role

Use the LLM to summarise the evidence for several competing hypotheses: damaged transmitter, identity cloning, stale data, or unreliable reporting. Require citations to message IDs or rows so investigators can verify each conclusion.

### Good demo outcome

The user sees that Marv Mail is unreliable for a specific, explainable pattern and can apply an appropriate restriction rather than shutting down the entire network.

## Thread 1.3 — Marv

### Official brief

The relay's founder refuses to close the network because even a broken signal may be better than silence. He has no reliable way to separate genuine messages from peacock interference.

### Core decision

How can the network remain open while reducing the chance that dangerous messages are acted upon?

### Suggested product direction

Build a human-in-the-loop moderation queue. Sort incoming messages by urgency and risk, automatically pass low-risk routine messages, and route high-impact or suspicious messages to cross-checking.

### Useful data signals

- Consequence of acting on the message
- Time sensitivity
- Sender reliability
- Evidence of corroboration
- Similarity to known interference
- Ratio of confirmed to disputed messages

### Meaningful AI role

The LLM can classify message intent, extract urgency and recommended action, explain uncertainty, and draft a safe holding response while verification occurs. Rules and simple scores should still handle deterministic checks.

### Good demo outcome

Marv keeps the network running but gains a clear process for deciding which messages can be trusted immediately and which need review.

## Thread 1.4 — The Mini-Marvs

### Official brief

Junior scout robots manually cross-check messages by comparing locations, past reports, and eyewitness accounts.

### Core decision

How can repetitive verification be accelerated without removing the scouts' judgment?

### Suggested product direction

Create an evidence-matching assistant. Given a selected broadcast, retrieve nearby or related messages, show consistencies and conflicts, and prepare a compact verification packet.

### Useful data signals

- Geographic proximity
- Time-window overlap
- Shared incident or route references
- Sender history
- Agreement among independent sources
- Missing evidence where corroboration would normally exist

### Meaningful AI role

Use the LLM to normalise differently worded reports into comparable claims and create a concise evidence summary. Scouts should be able to accept, reject, or correct the generated comparison.

### Good demo outcome

A manual five-message cross-check becomes a single review screen while the scouts retain final approval.

## Thread 1.5 — The silent outposts

### Official brief

Some outposts stopped broadcasting because they fear their signals will be copied. Genuine emergencies now go unheard because the network distrusts everything.

### Core decision

How can an outpost safely signal an emergency and regain trust?

### Suggested product direction

Build an outpost health and silence-monitoring dashboard. Detect unusual communication gaps, distinguish expected silence from probable distress, and create a cautious outreach or verification workflow.

### Useful data signals

- Normal broadcast cadence for each outpost
- Time since last verified message
- Recent incidents near the outpost
- Prior emergency patterns
- Attempts to transmit under altered identities
- Changes in reliability or status before silence

### Meaningful AI role

Use the LLM to summarise the last known context and draft a minimal, verifiable check-in message. It can also explain why silence is anomalous without claiming certainty that an emergency exists.

### Good demo outcome

The network identifies one outpost whose silence is genuinely concerning and gives operators a safe way to investigate.

---

# Main challenge 2: Matilda Bay

## Theme: Resource allocation and inequity

Four orca pods collectively have enough food, water, and medicine, but those resources are badly distributed. Transport is damaged, routes are unreliable, and repeated peacock attacks have undermined trust.

The challenge is not just mathematical efficiency. A solution must recognise urgency, fairness, access, and the reasons pods may refuse to cooperate.

## Supplied data

### Pod inventory and needs

- Stock and consumption levels for water, food, and medicine
- Status flags
- Delivery records
- Data for all four pods

### Consumption trends

- Daily resource levels for each pod
- Day-to-day changes over the reporting period

### Council allocations

- Six bay-wide allocation meetings
- Pod requests and stated needs
- Final resource-distribution outcomes

## Thread 2.1 — Orca Pod 1

### Official brief

Pod 1 controls the last working water purifier and charges steep food tolls for access. It is not acting purely out of cruelty: its own food supply is nearly exhausted.

### Core decision

What exchange or allocation keeps clean water flowing without exploiting other pods or starving Pod 1?

### Suggested product direction

Build a fair-exchange planner showing Pod 1's projected food runway, the other pods' water needs, and several allocation scenarios. Make trade-offs visible instead of presenting one unexplained “optimal” answer.

### Useful data signals

- Days of food and water remaining per pod
- Purifier capacity
- Population and consumption rate
- Previous delivery reliability
- Minimum safety threshold for every pod
- Impact of proposed exchanges over time

### Meaningful AI role

Use the LLM to explain scenarios in plain language, highlight who benefits or carries risk, and draft a transparent council proposal grounded in calculated figures.

### Good demo outcome

Council members can select a sustainable plan that protects Pod 1 while preventing water access from becoming coercive.

## Thread 2.2 — Orca Pod 2

### Official brief

Pod 2 has a large medicine stockpile but almost no transport capacity. Its boats and carts are damaged, and remaining routes are slow and frequently disrupted.

### Core decision

Which medicine should move first, to which pod, and by what available delivery option?

### Suggested product direction

Create a medicine-dispatch queue that prioritises requests by medical urgency, stock scarcity, travel difficulty, and delivery feasibility.

### Useful data signals

- Medicine stock by type
- Pod need and status
- Distance from the hub
- Delivery records and disruption history
- Available courier capacity
- Expiry or time-critical need, if present in the data

### Meaningful AI role

Use the LLM to translate structured priority scores into dispatcher instructions and to explain why a lower-volume delivery may be more urgent than a larger request.

### Good demo outcome

The dispatcher sees the next best delivery, its evidence, and the consequences of delaying it.

## Thread 2.3 — Orca Pod 3

### Official brief

Pod 3 overproduces food using a surviving greenhouse but stopped sharing after a trade convoy was intercepted. Its hoarding comes from distrust rather than genuine need.

### Core decision

How can the council demonstrate that sharing is safe and beneficial enough for Pod 3 to participate again?

### Suggested product direction

Build a trust-aware food-sharing plan. Show Pod 3's surplus, forecast its safety buffer, compare delivery risks, and offer smaller or staged commitments rather than demanding a large transfer.

### Useful data signals

- Food production versus consumption
- Required reserve threshold
- Previous convoy outcomes
- Route disruption rate
- Other pods' shortage severity
- Results of prior council allocations

### Meaningful AI role

Use the LLM to draft an evidence-based proposal tailored to Pod 3's concerns. It should clearly state safeguards, checkpoints, and what happens if a route becomes unsafe.

### Good demo outcome

Pod 3 can see that a proposed transfer preserves its own survival margin and limits exposure to another failed convoy.

## Thread 2.4 — The courier network

### Official brief

The surviving fleet of boats and carts is loosely organised. Trips are not coordinated, so low-priority cargo may move while another pod urgently needs medicine.

### Core decision

How should limited courier capacity be assigned across competing deliveries?

### Suggested product direction

Build a dispatch board with ranked jobs, vehicle capacity, route difficulty, urgency, and resource impact. Allow a coordinator to modify assignments and immediately see the effect.

### Useful data signals

- Request urgency
- Resource type and quantity
- Pod status
- Distance and disruption
- Delivery history
- Expected shortage if a trip is delayed

### Meaningful AI role

Use deterministic logic or optimisation for scheduling. Use the LLM to resolve ambiguous request descriptions, explain the proposed schedule, and summarise changes when a route or vehicle becomes unavailable.

### Good demo outcome

A coordinator replaces an inefficient low-priority trip with a defensible, high-impact schedule in a few clicks.

## Thread 2.5 — Orca Pod 4

### Official brief

Pod 4 is the hardest to reach. Its elders stopped asking for help because earlier requests were repeatedly delayed or abandoned when peacocks blocked the route.

### Core decision

How can the system recognise unmet need when the affected group no longer submits requests?

### Suggested product direction

Create an equity monitor that flags pods whose actual need and received allocations diverge, including cases where low request volume masks high need.

### Useful data signals

- Need compared with allocation
- Requests compared with completed deliveries
- Consumption trajectory
- Distance and disruption
- Council decisions over time
- Frequency of abandoned or delayed deliveries

### Meaningful AI role

Use the LLM to summarise the history of exclusion, distinguish missing requests from missing need, and prepare a council intervention supported by specific records.

### Good demo outcome

The system surfaces Pod 4 as a priority based on evidence even though it has stopped appearing at the top of the request queue.

---

# Main challenge 3: Reid Library

## Theme: Infrastructure monitoring

Dragons depend on Reid Library's damaged automated power, ventilation, and water systems. The machinery still operates, but reliability is declining and almost nobody understands the complete system. The community has handwritten observations and partial sensor data that have not been connected.

## Supplied data

### Sensor readings

Hourly readings throughout July 2026 for:

- Power
- Airflow
- Water pressure
- Water flow
- Temperature
- Vibration
- Sound

### Cloudy's notes

A short collection of handwritten-style maintenance logs describing observed system behaviour.

## Thread 3.1 — Cloudy's notes

### Official brief

The library's last experienced engineer kept maintenance logs before dying. His notes describe recurring warning patterns, such as pressure falling before a bad valve day, but nobody has matched those observations to historical sensor data.

### Core decision

Which of Cloudy's observations are supported by the sensor history, and what warning rules can be recovered?

### Suggested product direction

Build a maintenance-notes explorer that turns each written observation into a testable hypothesis, links it to a sensor timeline, and shows supporting or contradictory periods.

### Useful data signals

- Sensor movement before known observations
- Time-lagged relationships
- Repeating combinations of pressure, flow, vibration, or sound
- Similar patterns on different dates
- Missing or incomplete readings

### Meaningful AI role

Use the LLM to extract structured hypotheses from the notes: system, signal, direction, time relationship, and expected failure. Validate those hypotheses using ordinary data analysis rather than asking the model to invent correlations.

### Good demo outcome

A dragon selects one note and sees whether the historical data supports it, along with a reusable warning condition.

## Thread 3.2 — Two failures, no warning

### Official brief

Essential systems have failed twice with almost no warning. One outage disabled power and ventilation on a cold night and nearly forced vulnerable dragons out of the shelter.

### Core decision

Can the community detect dangerous conditions early enough to act?

### Suggested product direction

Build an early-warning dashboard with current status, anomaly history, escalating alert levels, and a compact explanation of the signals behind each alert.

### Useful data signals

- Baselines by hour or day
- Rapid changes rather than only absolute thresholds
- Multiple sensors drifting together
- Increasing vibration or sound
- Pressure and flow inconsistencies
- Missing values or frozen sensors

### Meaningful AI role

Use statistical or rule-based analysis to detect anomalies. Use the LLM to create a concise incident explanation and an action checklist grounded only in the detected signals and available notes.

### Good demo outcome

The system identifies a pre-failure pattern and gives residents a clear warning with enough lead time to respond.

## Thread 3.3 — The listeners

### Official brief

Young dragons listen for rattles, hums, and pauses that precede failures. Some observations are accurate, but the method is inconsistent and adults do not fully trust it.

### Core decision

How can informal acoustic observations become consistent, reviewable evidence?

### Suggested product direction

Create a structured observation log linked to sound and vibration data. Let listeners record what they heard, where, and when; then show whether similar reports align with abnormal sensor behaviour.

### Useful data signals

- Sound and vibration level
- Repeated descriptions at similar sensor values
- Time between an observation and a later fault
- Agreement among independent listeners
- Location or machinery affected

### Meaningful AI role

Use the LLM to normalise free-text descriptions such as “rough hum” and “short metallic rattle” into consistent categories. It can then summarise which categories have historically been useful without treating anecdote as proof.

### Good demo outcome

Adults can evaluate the listeners' claims through a combined human-observation and sensor timeline.

## Thread 3.4 — The two leaders

### Official brief

One leader wants to disable automation and operate manually, sacrificing capacity for safety. The other argues the library is unlivable without automation and wants better warning rather than shutdown.

### Core decision

Which systems should remain automated, which should be restricted, and what evidence supports that choice?

### Suggested product direction

Build a scenario-comparison tool. Let leaders compare continued automation, partial shutdown, and manual operation across reliability, resource availability, warning confidence, and affected population.

### Useful data signals

- Failure frequency and severity
- Sensor stability
- Resource output under normal operation
- Warning lead time
- Systems that fail together
- Minimum viable power, water, and ventilation

### Meaningful AI role

Use the LLM to explain scenario trade-offs and produce a decision brief. Calculations and known facts should remain separate from generated narrative so users can distinguish evidence from interpretation.

### Good demo outcome

Both leaders can compare the same evidence, understand the cost of each policy, and select a defensible compromise.

## Thread 3.5 — The salvaged sensor

### Official brief

A smart sensor recovered from Barry J Marshall Library was never fully configured. Its partial readings sit beside Cloudy's historical data while peacocks continue to damage the building.

### Core decision

Is the new sensor trustworthy and useful enough to integrate into the warning system?

### Suggested product direction

Build a sensor-onboarding and quality-monitoring screen. Compare the salvaged sensor with related historical channels, flag gaps or implausible readings, and assign a provisional confidence level.

### Useful data signals

- Missing-value rate
- Sampling intervals
- Range and variance
- Agreement with related sensors
- Stuck or repeated values
- Time periods where the new sensor contradicts the broader system

### Meaningful AI role

Use the LLM to generate a readable onboarding report from computed quality checks and Cloudy's relevant notes. Do not use the LLM as the primary numeric validator.

### Good demo outcome

The maintenance team can see which readings are usable, which are suspect, and what configuration work remains.

---

# Optional side quests

The event board contains 12 optional missions. Progress is stored on the current device, so changing browser or clearing local site data may lose completion state.

## Scoring

| Difficulty | Points per quest |
|---|---:|
| Easy | 1 |
| Medium | 3 |
| Hard | 5 |

Each club provides two easy quests, one medium quest, and one hard quest: **10 points per club, 30 points overall**.

## UWA Data Science Club quests

### DS-1 — Count the gaps

**Difficulty:** Easy · **Value:** 1 point

Print the number of missing values in every column.

Required output:

| Column | Type | Meaning |
|---|---|---|
| `column_name` | string | Source column name |
| `missing_values` | integer | Count of missing values |

Check that null-like strings are treated according to how the dataset is parsed, and do not accidentally count a valid zero as missing.

### DS-2 — Describe the machinery

**Difficulty:** Easy · **Value:** 1 point

For every numeric column, calculate:

- Mean
- Median
- Standard deviation
- Minimum
- Maximum
- Interquartile range

Round every value to three decimal places. The required columns are `column_name`, `mean`, `median`, `st_dev`, `min`, `max`, and `iqr_range`.

Be consistent about the standard-deviation convention used by the chosen library, and calculate IQR as the 75th percentile minus the 25th percentile.

### DS-3 — Recover the missing route

**Difficulty:** Medium · **Value:** 3 points

Download the [dirty cafe-sales dataset](https://www.kaggle.com/datasets/ahmedmohamed2003/cafe-sales-dirty-data-for-cleaning-training). Forward-fill missing values in the `Location` column, then count the frequency of each categorical value.

Required output:

| Column | Type | Meaning |
|---|---|---|
| `location` | string | Location such as `Takeaway` or `In-store` |
| `frequency` | integer | Number of occurrences after filling |

Preserve row order before forward-filling because each missing location inherits the previous non-missing value.

### DS-4 — Chart the archive

**Difficulty:** Hard · **Value:** 5 points

Follow the UWA Data Science Club Instagram account (`@dscuwa`) and make a bar chart showing the number of posts published in each month from January 2025 through July 2026.

The chart should include months with zero posts, use an unambiguous chronological axis, and make the count readable.

## UWA AI Club quests

### AI-1 — Reverse prompt engineering

**Difficulty:** Easy · **Value:** 1 point

Choose one of three target images on the side-quest board and reproduce it as closely as possible with an AI image-generation model.

The submitted prompt must contain **12 words or fewer**. The targets depict:

1. A neon-lit futuristic city street in rain
2. A vintage Marvel Super Heroes comic poster
3. Formula racing cars beside yachts in Monaco

Prioritise composition, subject, lighting, setting, and style. Count hyphenated or compound terms conservatively if the marker's tokenisation rules are unknown.

### AI-2 — A Secret Between the Pixels

**Difficulty:** Medium · **Value:** 3 points

Recover a nine-character access code hidden inside a supplied peacock-feather PNG using image-processing techniques. No dataset, ML model, OCR service, or specialist steganography application is required. Other tools are allowed, but the team must explain its method.

Important rules:

- Prefer the supplied ZIP, then open the original PNG from disk.
- Do not screenshot, resave, convert, crop, resize, or send the image through chat applications or AI uploads.
- AI coding agents may inspect the original file from disk.
- Read the original and write experiments to new files.
- Use Python with OpenCV and NumPy.
- Verify the original file before analysis.

Expected SHA-256:

```text
f58d36b2179b4ea7cd185bc574ccae4e9a315b445568637debe5b0c7180ab014
```

Suggested first checks include colour-channel separation, individual bit planes, and whether least-significant bits form a visible or decodable structure. These are hints, not the official solution.

### AI-3 — Bypass Marv's review system

**Difficulty:** Easy · **Value:** 1 point

Write one sarcastic review of Marv's cooking that a human clearly reads as negative while the local sentiment analyser classifies it as **POSITIVE**.

Rules:

- Fewer than 18 words
- Must refer to Marv's cooking or food
- One coherent sentence
- Clearly negative to a human
- No profanity or slurs
- Must avoid all banned words listed on the quest board

The analyser downloads a roughly 65 MB model and runs locally in the browser; the entered review is not sent elsewhere.

### AI-4 — Marv and the Missing Weights: A Fowl Failure

**Difficulty:** Hard · **Value:** 5 points

Repair the missing navigation layer in a supplied PyTorch network using its historical sensor readings and movement labels. Then classify nine unseen, 24-value ultrasonic sensor readings and enter the resulting movements in order.

Important rules:

- Repair **only** the missing layer.
- Keep every surviving pretrained parameter unchanged.
- Do not train a replacement network from scratch.
- Inspect `damaged_model_state_dict.pt`; `model.py` alone does not reveal everything missing.
- Keep the starter-notebook files together.
- Preserve the final-cell summary for the quest marker.
- The route checker is all-or-nothing and gives no positional hints.

Possible movements are:

- `Move-Forward`
- `Slight-Right-Turn`
- `Sharp-Right-Turn`
- `Slight-Left-Turn`

The marker expects both the successful route message and the summary block printed by the notebook's final cell.

## Coders for Causes quests

### CFC-1 — Backend workshop

**Difficulty:** Easy · **Value:** 1 point

Find the **Introduction to Backend Development with Django** workshop in the 2026 Winter section of the Coders for Causes website. Explain:

- What an API is
- What REST stands for
- Where the workshop page states each answer

Use precise references to the page rather than relying only on general knowledge.

### CFC-2 — Find the bug

**Difficulty:** Easy · **Value:** 1 point

Inspect the supplied [`pod.py`](https://ultimate-hackathon.vercel.app/challenges/cfc/pod.py) and identify the bugs. Explain both the faulty behaviour and the necessary correction; a changed line without reasoning may not demonstrate that the bug is understood.

### CFC-3 — Remove Nth Node From End of List

**Difficulty:** Medium · **Value:** 3 points

Solve LeetCode's [Remove Nth Node From End of List](https://leetcode.com/problems/remove-nth-node-from-end-of-list/).

A common optimal approach uses a dummy head and two pointers separated by `n` nodes, then removes the target in one traversal. Validate edge cases including deletion of the head, a single-node list, and removal of the last node.

### CFC-4 — Orca pod webpage

**Difficulty:** Hard · **Value:** 5 points

Create a simple webpage listing every orca pod on **4 July 2026** from `matilda_bay_pod_supply.csv`.

Display these fields:

- `pod_name`
- `population`
- `distance_from_hub_km`
- `peacock_disruption`
- `overall_status`

Technical constraints:

- Use HTML and CSS for the page.
- Use JavaScript to process the CSV and render the records.
- Filter the source data to the specified date rather than manually typing the final rows.

## Side-quest strategy

If the side quests influence ranking, complete the low-risk easy quests first, then choose medium or hard quests that overlap with the main project's technology. Do not let optional work prevent the main demo from becoming usable.

---

# Choosing our main project

## Region comparison

| Region | Best fit | Main technical opportunity | Main risk |
|---|---|---|---|
| Robots | NLP, trust, product UX | Evidence-backed message assessment | Building an opaque “AI truth detector” |
| Orcas | Optimisation, civic tech, visualisation | Fair allocation and dispatch decisions | Ignoring fairness and human behaviour |
| Dragons | Time series, anomaly detection, data science | Predictive maintenance and warning | Overclaiming prediction from limited data |

## Recommended selection criteria

Score each candidate thread from 1–5 on:

- Can we explain the affected user in one sentence?
- Does the supplied data directly support the idea?
- Can we demonstrate a complete workflow today?
- Is the AI step necessary and verifiable?
- Can the result be communicated in a 60–90 second demo?
- Does the team already know enough of the stack to execute quickly?

Choose the thread with the strongest overall delivery confidence, not merely the most ambitious concept.

# Suggested implementation architecture

This is a practical default, not an event-mandated stack.

```text
Region data files
      │
      ▼
Validation and preprocessing
      │
      ├──► Metrics / rules / anomaly or priority score
      │
      └──► Relevant evidence selected for the LLM
                    │
                    ▼
             Structured AI output
                    │
                    ▼
       Web dashboard and decision workflow
                    │
                    ▼
          Survivor confirms an action
```

Prefer structured AI responses with an explicit schema. Keep model inputs small and evidence-based. Show which records were used, handle missing data, and provide a fallback if the model call fails.

# Suggested one-day schedule

| Time | Outcome |
|---|---|
| 9:30–10:00 | Read data, choose one thread, define user and decision |
| 10:00–10:30 | Sketch one end-to-end workflow and assign owners |
| 10:30–12:00 | Build data loader, validation, and core analysis |
| 12:00–1:30 | Build the main interface around real data |
| 1:30–2:30 | Add the AI step with structured output and evidence |
| 2:30–3:30 | Connect the full workflow and handle failure states |
| 3:30–4:30 | Improve the visualisation and survivor-facing language |
| 4:30–5:15 | Test the happy path and at least one edge case |
| 5:15–6:00 | Freeze features, prepare demo story and backup screenshots |
| 6:00–6:30 | Final verification and submission/presentation readiness |

Adjust these blocks when the organisers announce the actual submission deadline or presentation schedule.

# Demo checklist

- [x] Name the selected region and one selected thread: Reid Library · Two failures, no warning.
- [x] Explain the survivor's decision: whether evidence requires investigation, preparation, notification, or continued monitoring.
- [x] Show all 500 supplied sensor records and the recovered Cloudy notes being used.
- [x] Show incident signals, coherent signal-specific summaries, calculated timelines, threshold sensitivity, and the averaged failure signature.
- [x] Demonstrate the structured AI incident brief and its bounded evidence contract.
- [x] Expose exact signal citations, uncertainty, provider status, and ground-truth boundaries.
- [x] Let the coordinator choose, explain, resolve, and export the response decision.
- [x] Demonstrate the complete warning-to-human-action workflow.
- [x] Provide Ollama, Claude, optional Gateway, and deterministic fallback paths.
- [x] Keep wide incident and chart content contained on narrow screens with touch-sized mobile controls.
- [x] State historical-data, threshold-transfer, local-model, and device-local audit limitations honestly.

# Questions to confirm with organisers

The public event website does not currently state the following:

- Team-size limit
- Participant eligibility
- Registration or check-in process
- Main judging rubric and category weighting
- Prizes
- Submission platform and exact deadline
- Repository visibility requirements
- Presentation or demo duration
- Whether external APIs, paid models, and pre-existing code are allowed
- Whether side-quest points affect main-project ranking
- Intellectual-property or licensing terms
- Food, device, account, or software requirements

Record answers announced during the opening briefing here so the whole team works from the same rules.

# Team decision log

```text
Region: Reid Library
Selected thread: Two failures, no warning
Primary survivor/user: Reid Library maintenance coordinator
Decision our product improves: Whether current evidence requires investigation, preparation, notification, or continued monitoring
Data files/columns needed: reid_library_sensor_data.csv; cloudys_logs.md; timestamp, power, airflow, water pressure, water flow, temperature, vibration, sound, status, and sensor source
Core calculation or analytical method: Source normalisation, healthy airflow baseline, three-hour water change, airflow residual, cross-signal corroboration, episode discovery, backtesting, sensitivity analysis, and averaged pre-failure signature
AI task: Convert only validated incident evidence into a schema-constrained, cited, uncertainty-aware action brief
Main interface: Reid Sentinel early-warning evidence console plus a dedicated interactive presentation with concept labs, calculated result visualisations, and exact implementation links
Definition of done: A coordinator can see an approaching failure, understand the evidence and method, obtain a safe brief, and record a reversible response
Demo owner: To be assigned by Team 4Freshers before judging
```

The full rationale and delivery history is maintained in the [Reid Sentinel project record](locations/reid-library/PROJECT_RECORD.md).

# Final principle

Build **one useful system for one urgent decision**. Make the data legible, make the AI accountable, and make the survivor's next action obvious.
