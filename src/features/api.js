/**
 * CommKit API
 * All AI calls go through /api/generate (Vercel serverless)
 * The Anthropic key never touches the browser
 */

/**
 * Build the structured prompt for Claude
 */
export function buildPrompt({ role, style, situation, relationship, sessionCount, inputMethod }) {
  const receiverContext = getReceiverContext({ situation, relationship })

  return `You are CommKit, a communication coach for professionals at every level. Generate responses for this exact situation.

USER PROFILE:
- Role: ${role || 'Professional'}
- Communication style: ${style || 'Balanced'}
- Situation: ${situation}
- Relationship / recipient type: ${getRelationshipLabel(relationship)}
- Likely receiver: ${receiverContext}
- Input method: ${inputMethod === 'voice' ? 'Spoken (voice transcription)' : 'Typed'}
- Session number: ${sessionCount}

Generate a valid JSON object. Return ONLY raw JSON — no markdown fences, no preamble, no explanation.
Keep every string concise so the JSON is complete and parseable. Exactly this structure:

{
  "situationTitle": "short title max 4 words",
  "detectedSummary": "one sentence describing what you detected",
  "profileApplied": "one sentence on how their role and style shaped responses",
  "responses": [
    {
      "label": "Direct version",
      "why": "why this fits their profile max 10 words",
      "tone": "Direct",
      "text": "2-3 sentences for saying in person. Conversational. No corporate speak. Use [Name] placeholder only if needed. Sound like a human wrote it.",
      "shortText": "1 sentence version for chat/text/Slack. Still clear.",
      "emailText": "Short email draft with subject line and body for when they do not want to say it in person."
    },
    {
      "label": "Balanced version",
      "why": "why this fits max 10 words",
      "tone": "Balanced",
      "text": "2-3 sentences for saying in person. Slightly softer but still direct.",
      "shortText": "1 sentence version for chat/text/Slack. Still clear.",
      "emailText": "Short email draft with subject line and body for when they do not want to say it in person."
    },
    {
      "label": "Careful version",
      "why": "why this fits max 10 words",
      "tone": "Careful",
      "text": "2-3 sentences for saying in person. Least confrontational. Preserves the relationship.",
      "shortText": "1 sentence version for chat/text/Slack. Still clear.",
      "emailText": "Short email draft with subject line and body for when they do not want to say it in person."
    }
  ],
  "framework": {
    "name": "Framework name e.g. SBI Model",
    "source": "Institution or author and year",
    "explanation": "2 sentences why this framework applies to their situation",
    "methodSteps": ["3-4 short steps showing how this response was built"],
    "stat1num": "e.g. 73%",
    "stat1label": "what that stat means max 8 words",
    "stat2num": "another stat",
    "stat2label": "what that stat means max 8 words",
    "usedBy": "one sentence naming organizations that use this framework"
  },
  "coachingTip": "1-2 sentences of practical coaching specific to their situation and style. Be honest and direct. Not corporate.",
  "qaItems": [
    { "question": "a realistic question or objection the likely receiver might say back", "answer": "what the user should say in response, 1-2 sentences conversational" },
    { "question": "another receiver-perspective question or objection", "answer": "what the user should say back" },
    { "question": "another receiver-perspective question or objection", "answer": "what the user should say back" }
  ],
  "signalObservation": "one insightful sentence about their communication pattern. Start with their style choice. Make it feel personal and accurate.",
  "suggestedTag": "emoji + short tag label e.g. '📊 Data-driven' or '😬 Conflict-averse'"
}

Q&A RULES:
- "Questions They Might Ask" means what the other person might ask the user after hearing/reading the response.
- Do NOT write the user's private doubts, worries, or self-talk as questions.
- If the receiver is professional, manager, peer, direct report, or client, keep the wording workplace-appropriate.
- If the receiver is personal, family, or friend, remove corporate language and preserve the relationship.
- If the likely receiver is the user's manager, make the questions sound like a manager: priorities, readiness, scope, timing, expectations, support.
- If the likely receiver is a direct report or teammate, make the questions sound like that person: fairness, clarity, impact, next steps.
- Answers should be words the user can say back immediately.`
}

function getReceiverContext({ situation = '', relationship = '' }) {
  const explicit = {
    manager: 'the user\'s manager or someone senior to them',
    peer: 'a coworker or peer',
    'direct-report': 'someone the user manages or is responsible for coaching',
    client: 'an external client, customer, vendor, or partner',
    professional: 'a professional stakeholder',
    personal: 'a personal relationship outside work',
    family: 'a family member',
    friend: 'a friend',
  }[relationship]

  return explicit || inferReceiverContext(situation)
}

function getRelationshipLabel(relationship = '') {
  return {
    manager: 'Manager / senior stakeholder',
    peer: 'Coworker / peer',
    'direct-report': 'Direct report / employee',
    client: 'Client / customer / partner',
    professional: 'Professional',
    personal: 'Personal',
    family: 'Family',
    friend: 'Friend',
  }[relationship] || 'Not specified'
}

function inferReceiverContext(situation = '') {
  const text = situation.toLowerCase()

  if (/\b(manager|boss|supervisor|lead|director)\b/.test(text)) {
    return 'the user\'s manager or someone senior to them'
  }

  if (/\b(employee|team member|direct report|staff|worker)\b/.test(text)) {
    return 'someone the user manages or is responsible for coaching'
  }

  if (/\b(coworker|colleague|peer|teammate)\b/.test(text)) {
    return 'a coworker or peer'
  }

  if (/\b(client|customer|vendor|partner)\b/.test(text)) {
    return 'an external client, customer, or partner'
  }

  return 'the other person in the workplace conversation'
}

/**
 * Call the generate API
 * Returns parsed response object or throws
 */
export async function generateResponses(profileData) {
  const prompt = buildPrompt(profileData)
  return postPrompt(prompt)
}

export async function refineResponses({ profileData, currentResult, instruction, refinements = [] }) {
  const prompt = buildResponseRefinementPrompt({ profileData, currentResult, instruction, refinements })
  return postPrompt(prompt)
}

export async function generateResourceBrief({ title, audience, relationship, documentText, context, attachments = [] }) {
  const prompt = buildResourcePrompt({ title, audience, relationship, documentText, context, attachments })
  return postPrompt(prompt, attachments.filter(attachment => attachment.data))
}

export async function refineResourceBrief({ originalInput, currentBrief, instruction, refinements = [] }) {
  const prompt = buildResourceRefinementPrompt({ originalInput, currentBrief, instruction, refinements })
  return postPrompt(prompt)
}

function buildResourcePrompt({ title, audience, relationship, documentText, context, attachments = [] }) {
  const attachmentList = attachments.length
    ? attachments.map(file => `- ${file.name} (${file.mediaType || file.kind})`).join('\n')
    : '- None'

  return `You are CommKit Resource Center. Turn technical workplace material into clear communication assets.

DOCUMENT CONTEXT:
- Title: ${title || 'Technical review'}
- Audience: ${audience || 'manager or stakeholder'}
- Relationship / recipient type: ${getRelationshipLabel(relationship)}
- User context: ${context || 'The user needs to explain this clearly at work.'}
- Uploaded files:
${attachmentList}

DOCUMENT TEXT:
${(documentText || 'No pasted text. Use the uploaded files if available.').slice(0, 6200)}

Return ONLY valid raw JSON. No markdown fences. Keep it concise and practical:
{
  "title": "short title max 5 words",
  "methodFramework": {
    "name": "model/framework used e.g. Pyramid Principle + Audience-Centered Briefing",
    "source": "credible source or communication model",
    "explanation": "1-2 sentences explaining why this framework fits the document and audience",
    "steps": ["3-4 short steps showing how the brief was built"]
  },
  "summary": ["3-5 bullets summarizing what matters"],
  "presentationOutline": [
    { "slide": "short slide title", "points": ["2-3 bullets"] }
  ],
  "talkingPoints": ["5-7 talking points the user can say in person"],
  "emailDraft": "short email with subject line and body",
  "questionsToExpect": [
    { "question": "question stakeholder may ask", "answer": "concise answer" }
  ]
}`
}

function buildResponseRefinementPrompt({ profileData = {}, currentResult, instruction, refinements = [] }) {
  return `You are CommKit, refining an existing set of communication responses through a follow-up conversation.

USER PROFILE:
- Role: ${profileData.role || 'Professional'}
- Communication style: ${profileData.style || 'Balanced'}
- Original situation: ${profileData.situation || 'Workplace conversation'}
- Relationship / recipient type: ${getRelationshipLabel(profileData.relationship)}
- Input method: ${profileData.inputMethod === 'voice' ? 'Spoken' : 'Typed'}

CURRENT RESPONSE JSON:
${safeJsonForPrompt(currentResult, 4600)}

RECENT REFINEMENT THREAD:
${formatRefinementThread(refinements)}

USER FOLLOW-UP REQUEST:
${instruction}

Return ONLY valid raw JSON, no markdown. Keep the same structure as the current response JSON, but revise the responses, Q&A, coaching tip, and framework explanation as needed.
Also include:
- "refinementNote": one concise sentence explaining what changed
- "framework.methodSteps": 3-4 short steps showing how the response was built

Do not lose shortText or emailText. Keep each response useful for the likely receiver.`
}

function buildResourceRefinementPrompt({ originalInput = {}, currentBrief, instruction, refinements = [] }) {
  return `You are CommKit Resource Center, refining an existing document brief through a follow-up conversation.

ORIGINAL CONTEXT:
- Title: ${originalInput.title || 'Resource brief'}
- Audience: ${originalInput.audience || 'stakeholder'}
- Relationship / recipient type: ${getRelationshipLabel(originalInput.relationship)}
- User need: ${originalInput.context || 'Explain the material clearly'}

CURRENT BRIEF JSON:
${safeJsonForPrompt(currentBrief, 4600)}

RECENT REFINEMENT THREAD:
${formatRefinementThread(refinements)}

USER FOLLOW-UP REQUEST:
${instruction}

Return ONLY valid raw JSON, no markdown. Keep the same resource brief structure and revise the summary, presentation outline, talking points, email draft, and questions as needed.
Include "methodFramework" with:
- "name": model/framework used
- "source": credible source or communication model
- "explanation": 1-2 sentences why it fits
- "steps": 3-4 short steps showing how the brief was built
Also include "refinementNote": one concise sentence explaining what changed.`
}

async function postPrompt(prompt, attachments = []) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 34000)

  let response

  try {
    response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, attachments }),
      signal: controller.signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Generation is taking too long. Try a shorter situation first.')
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || `API error ${response.status}`)
  }

  const data = await response.json()
  const text = data.content?.[0]?.text || ''

  return parseClaudeJson(text)
}

function safeJsonForPrompt(value, maxLength) {
  const json = JSON.stringify(value || {}, null, 2)
  return json.length > maxLength ? `${json.slice(0, maxLength)}\n...[truncated]` : json
}

function formatRefinementThread(refinements = []) {
  if (!Array.isArray(refinements) || refinements.length === 0) return '- None yet'

  return refinements.slice(-4).map((item, index) => {
    const request = item.request || item.instruction || ''
    const note = item.note || item.refinementNote || ''
    return `${index + 1}. User asked: ${request}${note ? `\n   CommKit changed: ${note}` : ''}`
  }).join('\n')
}

export function parseClaudeJson(text) {
  const clean = String(text || '')
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()

  try {
    return JSON.parse(clean)
  } catch {
    const jsonStart = clean.indexOf('{')
    const jsonEnd = clean.lastIndexOf('}')

    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      try {
        return JSON.parse(clean.slice(jsonStart, jsonEnd + 1))
      } catch {
        // Fall through to the user-facing error below.
      }
    }

    throw new Error('Could not parse response. Please try again.')
  }
}
