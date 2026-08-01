# Reid Sentinel — five-minute presentation and two-minute Q&A

**Presenter:** Preet Prasad  
**Team:** 4Freshers  
**Total judged time:** 5 minutes presenting and demonstrating, followed by 2 minutes of questions

## Committee scenario being answered

The recovered Reid Library material includes archived maintenance records, partial sensor logs, unfinished repair notes, Cloudy's notes, current sensors, and observations from young dragons. These sources may disagree, and new information may continue to arrive. The solution must support fair, effective decisions without hiding conflict or treating every source as equally trustworthy.

## Before the timer starts

- Open the protected presentation at its opening slide and verify the 4Freshers session.
- Open the public evidence console in a second tab.
- In the console, skip the landing story, select **Water failure 02**, and scroll to **Why this incident is flagged**.
- Check that the provider-health indicator reports either a live provider or safe fallback readiness.
- Use the presentation rail to move directly between the sections named below; do not step through every slide.
- Rehearse to about 4:45 so there is a 15-second safety margin.

## 0:00–0:12 — animated introduction

**Action:** Let the animation play. Do not speak until the opening slide appears.

## 0:12–0:35 — opening

**Screen:** Opening

> Good afternoon. I'm Preet Prasad, presenting Reid Sentinel for 4Freshers.
>
> The committee's scenario gives us newly recovered maintenance records, partial sensor logs, Cloudy's notes, and young-dragon observations—and warns us that these sources may disagree.
>
> Our answer is not to blindly trust one source. Reid Sentinel builds a transparent evidence chain that validates each source, detects deterioration, explains uncertainty, and keeps the final decision with a human.

## 0:35–1:00 — the problem

**Action:** Select **Problem**.

> Reid Library had data, but it did not have warning.
>
> We recovered 500 hourly records across six sensor channels, Cloudy's notes, and listener observations. Two essential-system failures were visible only in hindsight.
>
> The challenge was therefore not just detecting an unusual value. It was deciding which information was trustworthy, whether independent signals agreed, and whether the evidence was strong enough to justify action.

## 1:00–1:28 — our interpretation

**Action:** Select **Interpretation**.

> We interpreted the task as decision support, not another dashboard.
>
> Every new record retains its time, source, and missing values. It then passes through a Sensor Trust Gate. Accepted data enters a transparent detector. AI can explain the validated result, but cannot create the warning. Finally, an operator chooses and records the response.
>
> This means disagreement is visible and managed—it is never silently averaged away.

## 1:28–2:00 — analysis method

**Action:** Select **Method**.

> Our analysis has five reproducible steps.
>
> First, clean and preserve source identity. Second, establish healthy physical relationships—for example, expected airflow at a given power demand. Third, calculate features such as three-hour pressure decline, flow decline, airflow residual, vibration, and missingness. Fourth, require corroboration across independent signals. Finally, backtest the detector using the supplied status only after predictions have been produced.
>
> That separation is important: the detector never reads the answer while making its prediction.

## 2:00–2:30 — visualised analysis result

**Action:** Select **Failure signature**.

> This chart is the implemented analysis result, not a decorative mock-up.
>
> We aligned the two recorded water failures at their onset and visualised the preceding 24 hours. In both cases, pressure and flow health fall while vibration risk rises.
>
> The same failure shape appeared twice, producing 21 to 23 hours of confirmed warning before the recorded failures.

## 2:30–3:13 — Sensor Trust Gate demonstration

**Action:** Select **Sensor trust**.

> Now I'll demonstrate how the system handles newly recovered information.

**Action:** Point to **Recovered data**.

> The recovered Barry J sensor clears all seven gates, but it contains a stable measurable offset. Reid Sentinel therefore admits it with calibration instead of pretending it is perfect.

**Action:** Select **Missing value**.

> One missing value causes the source to be rejected.

**Action:** Select **Unstable drift**.

> And unstable drift is also rejected because a constant correction can no longer make the source dependable.
>
> The same fail-closed logic catches duplicate timestamps, impossible values, and frozen channels. New information can contribute—but only after earning trust.

## 3:13–3:35 — implementation and AI boundary

**Action:** Select **Implementation**, then select **Sensor trust gate** if another code example is active.

> Every concept in the presentation links to the actual implementation.
>
> The detector is deterministic and inspectable. AI sits downstream and receives only validated signal IDs. Its response must match a schema, cite real evidence, and choose from approved actions.
>
> AI explains the decision; it does not control the shelter or invent the alert.

## 3:35–3:53 — outcome

**Action:** Select **Outcome**.

> Across the 500 historical records, the balanced detector recovered both recorded failures, achieved 96 percent unsafe-hour recall, and produced zero confirmed false-alert hours.
>
> This is evidence from a limited historical dataset—not a claim of universal accuracy—but it proves the method on the supplied scenario.

## 3:53–4:48 — live application demonstration

**Action:** Switch to the prepared public-console tab.

> Here is Reid Sentinel operating on Water failure 02.
>
> On the left is the transparent detector evidence. Each warning shows its measured value, explanation, source context, and connection to Cloudy's notes.
>
> On the right, Cloudy's incident brief receives only these validated signals.

**Action:** Select **Generate live AI briefing**.

> While that generates, notice the boundary: detector, validated signals, structured brief, then human decision.
>
> The application can use local Ollama, a hosted fallback, or deterministic safe mode. Regardless of provider, invented citations are removed and unapproved actions cannot pass.

**Action:** When the brief appears, point to the response-validation strip.

> Here we can verify the schema, citations, and approved actions. Below this, the operator chooses the response, records the rationale, and preserves the evidence and AI provenance present at that moment.

## 4:48–5:00 — close

> Reid Sentinel does not solve disagreement by guessing which voice is loudest.
>
> It validates the source, requires corroborating evidence, communicates uncertainty, and gives the dragons 21 to 23 hours to act.
>
> Thank you.

## Two-minute Q&A bank

Use the shortest relevant answer. Two questions will usually consume the complete two minutes.

### What happens when two sources disagree?

> We do not use a simple majority vote. Each source keeps its identity and passes quality checks first. A single listener report can create a watch, but cannot confirm a failure alone. Confirmation requires independent physical evidence such as pressure and flow deterioration. If a source is incomplete, impossible, frozen, or unstable, the trust gate rejects it.

### How does this handle continuously arriving information?

> Each new record would repeat the same pipeline: validate the source, recalculate the time-series features, update corroboration, and refresh the evidence state. The hackathon version demonstrates that process through historical playback. A production version would connect the same analysis functions to a streaming sensor service.

### How did you validate the detector without leaking the answer?

> We withheld `system_status` from detection. The detector used only sensor values and observations. After predictions were complete, we compared them with the supplied status for evaluation. The balanced profile found two out of two failures, produced 21- and 23-hour confirmed lead times, reached 96 percent unsafe-hour recall, and had zero confirmed false-alert hours on these 500 records.

### Why use rules instead of a machine-learning model?

> The supplied dataset contains only 500 records and two failure events, which is too small for a defensible failure-prediction model. Transparent physical relationships and corroboration are easier to validate, explain, and operate safely. A future model could assist after more labelled events exist, but it should be benchmarked against this transparent baseline.

### What role does AI actually play?

> AI does not detect the failure. The deterministic detector creates the warning and evidence package. AI converts that validated package into a readable incident brief. Its output is schema-checked, its citations must match real signal IDs, and its actions must come from an approved catalogue.

### Is this production-ready?

> It is a working decision-support prototype with implemented analysis, trust testing, failover, citation validation, and operator auditing. Production deployment would add authenticated user identities, a server-side audit database, live sensor ingestion, alert delivery, and validation across more buildings and failure events.

### How accessible is the application?

> We support keyboard navigation, semantic controls, labelled charts, announced state changes, skip controls, and automatic reduced-motion bypass. Important status is communicated through text and values, not colour alone, and mobile controls use a 44-pixel target. I would not claim complete WCAG compliance yet; formal screen-reader, contrast, and focus-order testing is the next validation step.

### Which feature best answers the committee's scenario?

> The Sensor Trust Gate. It evaluates every recovered source for completeness, timestamp continuity, physical plausibility, frozen channels, and calibration stability. A stable bias can be admitted with calibration, while missing, impossible, frozen, or drifting evidence is rejected. That directly addresses continuously arriving information that may disagree.

### What happens if the internet or AI provider fails?

> Detection continues because AI does not produce the warning. Ollama is the primary briefing provider, followed by hosted fallbacks. If every model is unavailable, Reid Sentinel produces a cited deterministic safe brief. Operators still receive the evidence and approved actions.

### What is the biggest limitation?

> The evidence contains only 500 historical readings and two recorded failures. It proves the implemented method on the supplied scenario, but it is not enough to claim universal accuracy. More buildings, seasons, sensor types, and failure events are required before operational deployment.

### What would you build next?

> First, live sensor ingestion. Second, authenticated operator identities and an append-only server audit log. Third, notifications and escalation policies. Finally, broader validation across buildings and seasons, with thresholds configured for each physical system.

### What makes this different from an AI dashboard?

> The warning is produced by transparent physical analysis, not an LLM. Reid Sentinel adds source admission, cross-signal corroboration, visualised evidence, provider-independent explanation, verified citations, approved actions, and a recorded human decision. AI is one controlled layer inside a larger evidence chain.

### Can it work in other buildings?

> The pipeline is reusable, but physical baselines and thresholds must be calibrated for each system. Source validation, provenance, corroboration, briefing validation, and human approval generalise; the exact pressure, flow, and airflow boundaries should not be copied blindly.

### How do you avoid too many alerts?

> We tested conservative, balanced, and sensitive profiles across all 500 records. The balanced profile retained 21- to 23-hour confirmed warning, recovered both failures, achieved 96 percent unsafe-hour recall, and produced zero confirmed false-alert hours. Missing data creates a watch rather than a confirmed emergency.

### Could a peacock manipulate the AI through a malicious note?

> Evidence text is treated as untrusted data, not an instruction. The model receives a bounded evidence package, must follow a strict output schema, must cite valid detector signal IDs, and can only return approved actions. Invented citations and inappropriate actions are filtered out.

### What data is sent to the AI?

> Only the bounded, validated incident evidence required for the brief—not the complete raw archive or private administrative data. Credentials stay server-side, and local Ollama can keep the primary briefing path under team control.

### Is the operator audit secure?

> In this hackathon prototype it is honestly labelled device-local. It records the operator, rationale, evidence snapshot, and AI provenance, but it is not tamper-resistant or multi-user. Production would require authenticated identities and server-side append-only storage.

### Why are the admin and presentation protected?

> The evidence console is public, while team contributions, strategy, and presentation materials are protected by a signed, expiring, HttpOnly session. This separates public decision support from private team operations.

### Does the system ignore the young dragons?

> No. Their observations are preserved as identifiable evidence and can create an early watch. However, a subjective observation cannot confirm a failure alone; escalation requires independent physical corroboration. This respects their knowledge without asking one source to carry the entire decision.

### Who makes the final decision?

> A human operator. Reid Sentinel recommends only reviewed, reversible actions and displays uncertainty. The operator selects the response, explains the rationale, and records the evidence and AI provenance available at that moment.

### If a question exposes an unimplemented area

Use this structure instead of improvising or overclaiming:

> That is an important limitation. In the current prototype, we handle it through the safeguard you can see here. Before production, we would validate or add the missing capability. We deliberately do not claim that part is production-ready yet.

## Claims to keep precise

- Say **the deterministic detector creates the warning; AI explains it**.
- Say **historical playback prototype**, not real-time production deployment.
- Say **2/2 recorded failure events and 96% unsafe-hour recall on the supplied 500 records**, not 100% universal accuracy.
- Say **admit with calibration** for the recovered Barry J source, not fully trusted.
- If the live model is slow, continue speaking: the provider-independent deterministic safe mode is part of the resilience design.
