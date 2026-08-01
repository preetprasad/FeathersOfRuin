# Reid Sentinel — Project Record

> Team 4Freshers · Reid Library · Updated 1 August 2026 AWST

This document is the durable record of the decisions, pivots, rationale, action plans, measured outcomes, risks, and lessons accumulated while building Reid Sentinel. It complements the [technical Reid Library README](./README.md), which remains the detailed implementation guide.

## 1. Project identity

| Item | Recorded decision |
|---|---|
| Team | **4Freshers** |
| Members | Preet Prasad; Juan enrique Somadinata; Dinh Khanh Duy Nguyen; jeongyun chae |
| Region | Reid Library |
| Selected thread | **Two failures, no warning** |
| Primary user | Reid Library maintenance coordinator |
| Decision improved | Whether current evidence requires investigation, preparation, notification, or continued monitoring |
| Product | **Reid Sentinel** — an evidence-grounded infrastructure early-warning and decision-support console |
| Definition of done | A coordinator can identify an approaching failure, inspect why it was flagged, obtain a bounded AI brief, and record a reversible human response |
| Public judge URL | [reid-sentinel.vercel.app](https://reid-sentinel.vercel.app/) |
| Sites URL | [reid-sentinel-uwa.preetprasad.chatgpt.site](https://reid-sentinel-uwa.preetprasad.chatgpt.site/) |

## 2. Product principles agreed during the build

1. **One urgent decision, not every Reid problem.** The project focuses on early warning for essential infrastructure rather than attempting all five Reid threads.
2. **Evidence before AI.** Deterministic cleaning, feature engineering, detection, and backtesting produce the evidence object. The LLM explains validated evidence afterward.
3. **No ground-truth leakage.** `system_status` is not an input to detection. It is used only after detection for historical evaluation and retrospective alignment.
4. **Corroboration before escalation.** Sound is useful but subjective. Water or ventilation warnings require agreement between independent signals.
5. **Transparent thresholds.** The interface exposes the active thresholds, their source, and their measured sensitivity trade-offs.
6. **AI remains advisory.** The model cannot operate infrastructure. A human chooses the response and records the rationale.
7. **Graceful degradation.** Loss of Ollama or a hosted provider must not block access to the evidence or safe actions.
8. **Honest claims.** Results describe the supplied 500-row historical dataset, not proven performance in a live building.
9. **Demo reliability matters.** The judge-facing Vercel URL, fallbacks, replay controls, and deterministic evidence remain usable when one external service fails.
10. **Security boundaries are product features.** Secrets stay server-side; evidence is treated as untrusted input; model output is schema checked and filtered.

## 3. Decisions and pivots

### Scope and workspace

| Decision or pivot | Rationale | Result |
|---|---|---|
| Create separate workspaces for all three locations | Each region needed an independent README, research area, and future implementation surface | `locations/reid-library`, `locations/matilda-bay`, and `locations/sunken-garden-and-cs-building` were created |
| Select Reid Library as the active region | The team wanted to pursue infrastructure monitoring and had a concrete sensor dataset plus maintenance notes | Reid became the implemented application; the other regions remain documented option spaces |
| Select “Two failures, no warning” | It offers one clear user, one urgent decision, measurable historical outcomes, and a strong data-plus-AI workflow | All subsequent product work stayed centred on early warning and response |
| Build a decision console rather than a static report | The event requires a survivor-usable web interface and decision-relevant data component | The product combines incident selection, signals, explanations, AI briefing, and operator action |

### Analysis and detector

| Decision or pivot | Rationale | Result |
|---|---|---|
| Preserve the raw CSV and check in processed JSON | Reproducibility and browser-friendly loading were both required | All 500 hourly rows remain traceable to the supplied data |
| Normalise `barry_j_` to the documented sensor identity | The CSV and guide disagree on the source label | Ingestion absorbs the discrepancy instead of scattering exceptions through the UI |
| Correct the Barry J airflow offset | Healthy readings show an approximately `+0.15 m³/s` source offset | Airflow residuals compare like with like |
| Establish the healthy airflow relationship `0.125 × power_kw − 1.5` | Ventilation failure is visible as delivery below expected output, not simply low airflow | The detector can distinguish ventilation inefficiency from ordinary power changes |
| Use three-hour water-rate changes | Pressure and flow deterioration are more useful early signals than a single absolute reading | Trend features identify degradation before the final threshold crossing |
| Use sound as a watch/corroborator, not proof | Listener observations match this dataset unusually well but would be noisier in reality | A hum or rattle can start a watch, while confirmed warnings require independent evidence |
| Treat missing data as uncertainty rather than safety | Six numeric values are absent in stable rows | Missing values create a watch and explain the six extra detector watches |
| Keep `system_status` out of the detector | Using the label would leak the answer and make the demonstration invalid | Automated tests prove detections are unchanged when all statuses are overwritten as stable |
| Discover episodes automatically | Hard-coded incident windows would make the application a scripted replay rather than analysis | The detector finds two water failures and two ventilation warnings from sensor-derived alerts |
| Add a calculated warning timeline | Judges need to see when signals appeared, not only that an incident occurred | Each water incident shows watch, confirmed warning, critical threshold, and recorded failure with exact lead times |
| Add threshold sensitivity analysis | A single threshold set without comparison looks arbitrary | Conservative, balanced, and sensitive profiles are rerun over all 500 rows |
| Keep the balanced profile active | Conservative delays confirmation; sensitive adds alert load without lead-time benefit | Balanced provides 21–23 hours confirmed lead, 96.21% confirmed unsafe-hour coverage, and zero false confirmed alert-hours |
| Add a presentation-ready method component | A side-quest hint said to explain the analysis method and visualise its result | The interface shows a five-stage pipeline and a calculated mean 24-hour signature across both failures |
| Integrate the salvaged-sensor thread as a trust gate, not a second main scope | The Barry J source already contributes evidence to the selected early-warning workflow; its quality should be justified before use | Seven calculated gates now produce a provisional admit-with-calibration or reject decision |
| Make the sensor trust gate fail closed at row-level edges | Safety evidence cannot tolerate a single missing interval, impossible value, duplicate timestamp, or frozen run being hidden by a high aggregate percentage | Coverage, cadence, completeness, and range must be exact; calibration requires at least 24 stable rows and corrected residual MAE no greater than `0.05 m³/s` |

### AI architecture

| Decision or pivot | Rationale | Result |
|---|---|---|
| Use prompting plus schema-constrained output instead of fine-tuning | The task needs a narrow structured brief; fine-tuning would add time, data requirements, and overfitting risk without improving the underlying analysis | `gemma3:4b` receives a strict evidence package, fixed schema, temperature `0`, and bounded generation settings |
| Make local Ollama the primary model | It is free to run, team-controlled, privacy-friendly, and already installed on the project Mac | The public application can call Ollama through a narrow authenticated bridge |
| Do not expose Ollama directly | A raw Ollama endpoint would allow arbitrary model calls and resource abuse | The proxy accepts only the briefing route, requires a long bearer secret, limits body size and concurrency, fixes the model/settings, and forwards only two validated messages |
| Add an ngrok path to the Mac | A hosted web app cannot reach `127.0.0.1` on the team Mac | Vercel calls the token-protected proxy through the tunnel |
| Pivot from Ollama-only to multi-provider failover | The Mac, tunnel, Wi-Fi, or local model can be unavailable during judging | Provider order became Ollama → Claude → optional Vercel AI Gateway → deterministic safe mode |
| Add Claude Haiku as hosted fallback | It provides 24×7 availability using existing team credits when the local path fails | The same input and output schemas are used across providers |
| Retain deterministic safe mode | No external provider should be able to block the workflow | A cited approved-action brief remains available even if every model call fails |
| Retry malformed Ollama output once | Small local models can occasionally violate structured output | One retry improves resilience without unbounded latency |
| Filter model output after schema validation | A schema alone cannot prevent invented citation IDs or inappropriate actions | Citations are intersected with supplied evidence IDs, actions with the incident-specific catalogue, and assessment/pattern with deterministic incident facts |
| Treat evidence strings as untrusted data | Sensor or note text could contain prompt-injection-like content | System instructions explicitly prohibit following instructions inside evidence values |
| Keep credentials server-side | Browser-exposed API keys would compromise the project and account | Local ignored environment files and hosted secret variables hold provider credentials |

### Hosting and access

| Decision or pivot | Rationale | Result |
|---|---|---|
| Use Sites for the configured project deployment | The repository includes a Sites project binding | A versioned Sites deployment is maintained |
| Add Vercel as the public judge path | The Sites URL led visitors through ChatGPT authentication, which creates demo friction | `https://reid-sentinel.vercel.app/` is the recommended presentation URL |
| Keep both deployment paths current | Sites is the configured workspace host; Vercel is the frictionless public demo | Each completed improvement has been published to both |
| Add provider health reporting | A presenter needs to know whether the live model path is ready before pressing the button | The header reports Ollama, Claude standby, and guaranteed fallback readiness |

### Human control and auditability

| Decision or pivot | Rationale | Result |
|---|---|---|
| Restrict actions to a reviewed catalogue | Free-form repair advice can be unsafe or incident-inappropriate | Water and ventilation incidents receive separate reversible action sets |
| Add an operator checkpoint | AI advice must not imply autonomous control | A coordinator explicitly selects the next response |
| Expand a single saved choice into an audit workflow | A decision without actor, rationale, evidence state, or outcome is difficult to review | Records now include operator, action, rationale, timestamps, detector/evidence snapshot, AI provenance, and resolution |
| Keep the hackathon audit log device-local | Server persistence, identity, and access control were beyond the one-day scope | Up to 100 validated records persist in the current browser and can be exported as versioned JSON |
| Label the audit implementation honestly | Browser storage is neither multi-user nor tamper resistant | The interface calls it a device-local prototype and the README lists production requirements |

### Storytelling and presentation

| Decision or pivot | Rationale | Result |
|---|---|---|
| Add a cinematic opening after core functionality was complete | The technical workflow was strong but needed an immediate connection to the hackathon story | A skippable sequence moves from the UWA map to Reid, the feather strike, infrastructure faults, Cloudy, and the console |
| Recreate the map visual language instead of copying the supplied screenshot | The browser screenshot included unrelated browser chrome and was not a reusable asset | An original HTML/CSS north-up field map locates the event regions and Reid Library |
| Use the official hosted Cloudy mascot | Event continuity is stronger with the recognised character | Cloudy appears during the handoff to Reid Sentinel; this remains an external-asset dependency |
| Show the intro once per session | Repeating a nine-second animation on every page refresh would hurt usability | Users can skip with a button or Escape and replay from the header |
| Respect reduced-motion preferences | Narrative polish cannot override accessibility | Reduced-motion users bypass the animation automatically |
| Add a concise analysis-method narrative | Team members found a side-quest hint about explaining the method and visualising results | The README contains presentation copy and the dashboard places method beside measured output |

## 4. Milestone chronology

All milestones below occurred on 1 August 2026 AWST.

| Time | Commit | Milestone and takeaway |
|---:|---|---|
| 10:52 | `1660230` | Converted the event material into a comprehensive hackathon guide. **Takeaway:** understand official requirements before ideating. |
| 11:06 | `eab1b09` | Added concept inventories for every region. **Takeaway:** separate domain knowledge from feature ideas. |
| 11:20 | `127f1fd` | Created independent location workspaces. **Takeaway:** preserve options without mixing implementations. |
| 11:34 | `946192c` | Built the first Reid Sentinel evidence dashboard. **Takeaway:** a working read-only evidence view should precede live AI. |
| 11:41 | `cd80ca1` | Recorded the local-model delegation policy. **Takeaway:** small local models may draft bounded work; architecture, security, and final verification stay with the primary workflow. |
| 11:49 | `51fedbb` | Added the Vercel deployment path. **Takeaway:** judge access must be tested early. |
| 11:50 | `67518a0` | Documented the public deployment. |
| 11:51 | `ecccf35` | Added the 4Freshers roster. |
| 12:15 | `d3cf583` | Completed the transparent warning detector and structured AI workflow. **Takeaway:** LLM value comes from evidence synthesis, not replacing calculations. |
| 12:19 | `e6fbb38` | Added the secure Ollama bridge. **Takeaway:** local AI can support a public app only through a narrow authenticated boundary. |
| 12:21 | `673b7b9` | Documented live Ollama operations. **Takeaway:** demos need explicit runbooks. |
| 12:45 | `4775b47` | Added Ollama-to-Claude resilience, provider health, and safety tests. **Pivot:** from a local-model demo to an availability-aware AI service. |
| 12:54 | `252b8ee` | Added calculated incident warning timelines. **Takeaway:** make lead time visible and traceable. |
| 13:02 | `02633c9` | Added threshold sensitivity. **Takeaway:** justify the deployed rule set with measured trade-offs. |
| 13:11 | `d340066` | Added operator decision auditing. **Takeaway:** record who decided what and why, not only the AI output. |
| 13:32 | `2880f39` | Added the cinematic Reid Library opening. **Takeaway:** narrative should introduce, not obstruct, the evidence workflow. |
| 13:45 | `cbf3de1` | Added the five-stage analysis method and averaged failure-signature visual. **Takeaway:** present both method and measurable result explicitly. |
| 14:05 | `b82da00` | Added the salvaged-sensor trust gate and rejection tests. **Takeaway:** calibration should be an explicit admission decision, not an invisible correction. |

## 5. Current architecture

```text
Checked-in Reid data
  → ingestion and source normalisation
  → healthy baseline and sensor correction
  → salvaged-sensor identity, coverage, cadence, completeness, range, freeze and calibration gate
  → transparent time-series features
  → corroborated detector
  → incident discovery, timeline, backtest, sensitivity, signature chart
  → bounded evidence object
  → Ollama / Claude / optional Gateway
  → schema, citation, action and incident-safety filters
  → human decision
  → device-local audit record and JSON export
```

The model is downstream of the detector. Model failure does not remove sensor evidence, detector explanations, historical results, or approved safe actions.

## 6. Measured outcomes on the supplied dataset

| Measure | Current result |
|---|---:|
| Dataset size | 500 hourly records |
| Time covered | 1–21 July 2026 |
| Automatically discovered incidents | 4 |
| Recorded failures found | 2 of 2 |
| Earliest listener watch | 24 hours before each failure |
| Balanced confirmed lead | 23 hours and 21 hours |
| Unsafe-hour recall with watch included | 100% |
| Balanced confirmed unsafe-hour coverage | 96.21% |
| Balanced false confirmed alert-hours | 0 |
| Extra watches | 6, explained by six missing numeric values |
| Conservative confirmed lead | 21 hours and 17 hours |
| Sensitive confirmed lead | 23 hours and 21 hours |
| Sensitive false confirmed alert-hours | 2 |
| Mean pressure-health change, T−24h to failure | −81 points |
| Mean flow-health change, T−24h to failure | −91 points |
| Mean vibration-risk change, T−24h to failure | +90 points |
| Salvaged-source coverage | 50 of 50 expected hourly rows |
| Salvaged-source cadence | 49 of 49 one-hour gaps |
| Salvaged-source numeric completeness | 300 of 300 values |
| Salvaged-source frozen channels | 0 |
| Barry J airflow residual | `+0.150 m³/s` raw → approximately `0.000 m³/s` corrected |
| Corrected Barry J residual MAE | Approximately `0.0003 m³/s` |
| Sensor gate decision | Admit with calibration · provisional |
| Automated tests | 31 passing |

These are retrospective results on the event dataset. They are not a production safety certification.

## 7. Options considered but not selected

| Option | Decision | Reason |
|---|---|---|
| Implement all three regions | Rejected for the main build | It would weaken focus and risk incomplete workflows |
| Implement all five Reid threads | Rejected | The event asks for one selected thread; early warning already provides a complete decision journey |
| Fine-tune a local model | Deferred/rejected for this task | Structured prompting is sufficient, training examples are limited, and fine-tuning risks overfitting format rather than improving evidence quality |
| Let the LLM detect failures directly from raw CSV | Rejected | It is less reproducible, harder to evaluate, and more likely to invent relationships |
| Use `system_status` as a feature | Rejected | It leaks the evaluation answer |
| Trust listener sound by itself | Rejected | Real human observations are subjective despite perfect alignment in this dataset |
| Use Ollama as the only provider | Rejected after reliability review | The public demo would depend on one Mac, tunnel, network, and process |
| Use an online provider as the only model | Rejected | It adds cost/vendor dependence and discards the team's useful local capability |
| Return unrestricted free-form model advice | Rejected | It is difficult to validate and unsafe for infrastructure decisions |
| Allow the model to operate systems | Rejected | The product is advisory and human controlled |
| Store the audit log on a server immediately | Deferred | Correct implementation requires identity, permissions, append-only storage, retention, and review controls |
| Use only the Sites URL for judges | Rejected as the sole demo path | ChatGPT sign-in created friction, so Vercel became the public presentation URL |
| Copy the supplied browser screenshot into the intro | Rejected | It contained browser UI and was not an adaptable product asset |

## 8. Security and operational record

- Provider secrets belong only in ignored local environment files and hosted secret stores.
- A credential previously pasted into chat or exposed in a screenshot must be treated as compromised and revoked; no exposed value should be reused.
- `ANTHROPIC_API_KEY`, Ollama bridge tokens, tunnel URLs, and similar values must never enter commits, documentation, client bundles, screenshots, or issue text.
- The Ollama bridge listens on localhost, requires a bearer secret of at least 32 characters, accepts only the fixed chat route, rejects oversized input, caps concurrency at two, fixes model settings, and applies timeouts.
- The public server limits briefing request size to 20,000 characters and validates the evidence schema before contacting any model.
- Model responses are schema parsed, citations are checked against supplied signal IDs, actions are filtered by incident type, and deterministic facts override conflicting model fields.
- Provider status is exposed without revealing secrets.
- The deterministic fallback is part of the safety design, not a substitute for verifying the live AI before judging.

## 9. Current limitations and open risks

| Risk or limitation | Current mitigation | Required future work |
|---|---|---|
| Only two historical failures | Claims are explicitly limited to the supplied data | Prospectively collect more events and evaluate across seasons and failure types |
| Thresholds may not transfer to a real building | Three profiles and exact trade-offs are visible | Calibrate per sensor/system and use controlled threshold review |
| Listener labels are unrealistically clean | Sound is only a watch/corroborator | Collect repeated blinded observations and measure inter-rater reliability |
| Ollama depends on the team Mac and tunnel | Claude and deterministic fallbacks are available | Move the primary model to a managed always-on runtime if required |
| Tunnel URL can change | Runbook documents the Vercel variable update | Use a stable secured endpoint or reserved tunnel domain |
| Hosted API key expiry/credits | Provider health is checked before demo | Rotate expiring credentials and configure spend alerts before judging |
| Audit history is browser-local | Explicit label and JSON export | Add authenticated, server-side append-only persistence and retention policy |
| Sites may require ChatGPT authentication | Public Vercel alias is documented | Use Vercel for judges and keep a local backup |
| Cloudy mascot is loaded from the event host | The main product still works without it | Vendor an authorised local asset or add a resilient fallback before long-term use |
| Intro delays access | Skip, Escape, once-per-session, replay, and reduced-motion bypass exist | Keep timing under observation during rehearsal |
| Exact presentation duration and judging rubric are unknown | Build satisfies all explicit requirements | Confirm organiser rules and shorten the script to the announced slot |

## 10. Action plan

### Before judging — highest priority

- [ ] Confirm the official presentation duration, submission deadline, and scoring rubric.
- [ ] Assign the demo owner and speaking roles across all four team members.
- [ ] Revoke any credential ever exposed in chat or screenshots and verify replacement secrets.
- [ ] Check the Claude key expiry and rotate it if judging occurs after its validity window.
- [ ] Start Ollama, the token-protected proxy, and ngrok; keep the Mac awake and connected to power.
- [ ] Confirm the current tunnel URL matches the production `OLLAMA_REMOTE_URL` value.
- [ ] Open `/api/briefing/health` and confirm Ollama is available and Claude is on standby.
- [ ] Run the complete automated suite and verify all 31 tests pass.
- [ ] Test the public Vercel URL in a private browser window with no existing session.
- [ ] Generate one live briefing for a water incident and one for ventilation.
- [ ] Show the Sensor Trust Gate, its measured `+0.150 m³/s` correction, provisional admission, and fail-closed edge tests for absent, incomplete, irregular, impossible, and frozen data.
- [ ] Demonstrate one operator decision, resolution note, and JSON export.
- [ ] Prepare backup screenshots or a short recording in case venue networking fails.
- [ ] Freeze features after rehearsal; accept only fixes that improve demo reliability or clarity.

### Recommended presentation sequence

1. **Story, 20 seconds:** Let the cinematic opening locate Reid and establish the failure stakes.
2. **Problem, 15 seconds:** Two essential-system failures occurred with almost no usable warning.
3. **Method, 45 seconds:** Show Clean → Baseline → Features → Corroborate → Backtest.
4. **Result, 30 seconds:** Point to the averaged failure signature and the 21–23 hour confirmed lead.
5. **Explainability, 30 seconds:** Open a water incident, its signals, Cloudy-note citations, and calculated timeline.
6. **AI, 30 seconds:** Generate the structured brief and point out verified citations, approved actions, uncertainty, and provider status.
7. **Human control, 20 seconds:** Record and resolve an operator response, then show the export.
8. **Close, 15 seconds:** “Failure had a shape. Now the dragons can see it coming.”

### After the hackathon

- [ ] Replace device-local audit storage with authenticated append-only persistence.
- [ ] Add operator roles, review permissions, retention policy, and tamper-evident history.
- [ ] Add live sensor ingestion with sampling, freshness, drift, and outage monitoring.
- [ ] Run prospective evaluation before treating any alert as operational safety advice.
- [ ] Establish a reviewed threshold-change process and per-sensor calibration.
- [ ] Replace the temporary tunnel with a stable managed inference endpoint if the local model remains primary.
- [ ] Add service telemetry, provider latency/error metrics, and alerting.
- [ ] Review accessibility with keyboard, screen reader, contrast, and reduced-motion testing.
- [ ] Confirm long-term rights and local hosting for story assets.

## 11. Key takeaways

- The strongest project pivot was from “add an AI model” to “build an evidence system that remains useful when AI fails.”
- The local model is valuable because it is cheap and controlled; the hosted model is valuable because it is available. The fallback chain uses both strengths.
- Fine-tuning was not the right first move. Schema, prompt boundaries, evidence design, and post-generation validation solved the actual task more directly.
- Backtesting alone was insufficient for explanation. Timelines, sensitivity analysis, and the averaged signature turned metrics into judge-readable evidence.
- A high recall number is not enough. Alert burden and confirmation timing determine whether operators can trust a warning.
- A salvaged sensor should not become trusted merely because it has data. Identity, coverage, cadence, completeness, plausible ranges, frozen values, and calibrated agreement need an explicit gate.
- A human-in-the-loop claim becomes credible only when the interface records the decision, rationale, evidence state, and outcome.
- Storytelling was added after the core workflow was stable. This kept the cinematic layer from becoming a substitute for functionality.
- The safest demo has multiple layers: public hosting, local AI, hosted AI, deterministic fallback, tests, a runbook, and offline visual backups.
- The remaining work is primarily presentation readiness and operational verification, not broader feature expansion.

## 12. Source-of-truth map

| Topic | Source |
|---|---|
| Overall hackathon and team guide | [`README.md`](../../README.md) |
| Reid requirements, concepts, methods, operations, and demo explanation | [`locations/reid-library/README.md`](./README.md) |
| This decision and delivery history | `locations/reid-library/PROJECT_RECORD.md` |
| Transparent analysis and detector | [`lib/reid-analysis.ts`](../../lib/reid-analysis.ts) |
| AI contract and safe actions | [`lib/reid-briefing.ts`](../../lib/reid-briefing.ts) |
| Operator audit schema | [`lib/reid-audit.ts`](../../lib/reid-audit.ts) |
| Provider route and failover | [`app/api/briefing/route.ts`](../../app/api/briefing/route.ts) |
| Ollama bridge | [`scripts/ollama-briefing-proxy.mjs`](../../scripts/ollama-briefing-proxy.mjs) |
| Automated evidence | [`tests/`](../../tests) |

When a new decision changes scope, architecture, safety, operations, or presentation, update this record in the same commit as the change.
