# Using Collective Brain with Claude

## Goal

Collective Brain should feel like part of Claude, not like another application employees have to manage.

Once connected to a Brain, use Claude normally. The Claude Skill should decide when shared institutional knowledge could materially improve the answer and query Collective Brain automatically.

## Ask natural questions

Examples:
- “What seed-part guidance do we already have for weldments?”
- “Have we documented how we handle datum targets?”
- “Why did we decide to use this PMI approach?”
- “Find me a similar example.”
- “What did we learn the last time we had this problem?”
- “Who has worked on this topic?”
- “Is this still current?”
- “Has anything superseded this?”

## Ask for evidence

Useful prompts include:
- “What sources are you using?”
- “Show me the source document.”
- “Which revision is this based on?”
- “Is this a requirement or just an example?”
- “Show me related decisions.”
- “Are there conflicting documents?”

Claude should distinguish:
- released requirement/reference
- approved company practice
- approved precedent/example
- training/supporting context
- model inference

## Explicit Brain commands

No special syntax is required, but employees can be explicit when useful:

- “Search the Brain for …”
- “Search only current approved guidance.”
- “Show me related work in the Brain.”
- “Check whether this is superseded.”
- “Find the reasoning behind this decision.”
- “Add what we just learned to the Brain.”

## Contributing knowledge

Most contribution happens automatically through ordinary work:

1. create PowerPoint, Word, Excel, PDF, or other approved artifacts;
2. save them under the shared Brain folder;
3. continue normal company revision and review practices;
4. Collective Brain indexes the artifact and connects it to related knowledge.

Employees should not need to rewrite the same work into a separate wiki.

## Adding knowledge from a conversation

If a Claude conversation surfaces a reusable lesson or decision, say:

> Add what we just learned to the Brain.

Claude should create a `pending_review` proposal with:
- the proposed statement;
- supporting sources;
- provenance to the conversation/evidence;
- proposed knowledge type;
- reviewer requirement.

It must not silently become authoritative guidance.

## What Claude should do automatically

When institutional knowledge is relevant, Claude should:
1. search the authorized Brain;
2. use semantic retrieval and Graphify relationship context;
3. prefer current/applicable/higher-authority evidence;
4. check revision and supersession;
5. identify conflicts;
6. cite the source artifact and source location;
7. clearly label whether the answer is a requirement, approved practice, precedent/example, or inference.

## What Claude must not do

Claude must not:
- expose files you cannot access;
- reveal restricted titles, snippets, graph paths, or counts;
- treat a training deck or seed part as a formal requirement without evidence;
- hide conflicts between current sources;
- silently promote AI-generated knowledge;
- answer as if company guidance exists when no authorized evidence was found.

## If the Brain has no answer

Claude should say that no authorized institutional evidence was found and may then provide general knowledge separately, clearly labeled as non-company guidance.

## Everyday mental model

You do not “maintain the Brain.”

You work normally, save useful work into the shared folder, and ask Claude questions. Collective Brain turns those artifacts into connected organizational memory behind the scenes.
