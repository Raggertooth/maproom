# Development diagram patterns

Maproom represents a diagram as a hierarchy of topics plus optional cross-links. Ask the agent to keep each topic concise, put supporting context in notes, and use cross-links for relationships that do not fit the parent/child structure.

## Software architecture

Organize the top level around the system boundary or product area. Branch into clients, services, data stores, external dependencies, and operational concerns. Use notes for responsibilities, protocols, ownership, and open assumptions. Add cross-links for calls, events, shared data, or runtime dependencies.

Prompt:

> Create an architecture map for [system]. Group topics by client, service, data store, and external dependency. Use notes for each component’s responsibility and add labelled cross-links for important calls and data flows. Keep uncertain details marked as assumptions.

## Feature and implementation planning

Start from the user outcome. Add branches for user journey, UI, APIs, data model, permissions, error states, tests, rollout, and unresolved decisions. Use statuses to distinguish planned work from completed work. Do not present estimates or inferred requirements as confirmed facts.

Prompt:

> Turn this feature request into a development mind map. Separate user value, user flow, frontend changes, backend changes, data changes, edge cases, tests, and rollout. Add a note for each assumption and mark unknown decisions as planned.

## Domain model

Use the root for the bounded business domain. Make major concepts first-level topics, then add attributes, rules, and lifecycle states beneath them. Use cross-links for references and shared concepts. For a formal entity relationship diagram, use a dedicated diagram format; Maproom currently visualizes topic relationships rather than typed database connectors.

## Dependency and risk map

Group dependencies by internal systems, external services, data, and operational prerequisites. For each risk, capture a short cause, impact, mitigation, and owner in notes or child topics. Link risks to the components or milestones they affect.

## Release readiness

Use branches for validation, security/privacy, observability, rollout, support, and rollback. Give checklist items clear verbs. Use the topic status as a lightweight progress marker; Maproom does not yet provide due dates, owners, or a task scheduler.

## Incident and recovery map

Structure the root around the incident or service. Branch into symptoms, detection, likely causes, immediate containment, investigation, recovery, and follow-up. Distinguish verified evidence from hypotheses in notes and status.

## Practical guidance for agents

- Read an existing map before changing it; preserve useful user-authored branches.
- Create meaningful topic IDs only when later edits need to target them; otherwise let the server assign IDs.
- Keep topic labels short enough to scan on the canvas.
- Put rationale, evidence, links, and uncertainty in notes rather than very long labels.
- Use a labelled cross-link when two branches have a meaningful relationship.
- Return a short summary of changes and open questions after editing a map.
- Export to SVG when the goal is to share a static visual; use OPML when the recipient needs an editable outline in another compatible tool.
