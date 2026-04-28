/**
 * CommKit API
 * All AI calls go through /api/generate (Vercel serverless)
 * The Anthropic key never touches the browser
 */

/**
 * Build the structured prompt for Claude
 */
export function buildPrompt({ role, style, situation, sessionCount, inputMethod }) {
  const receiverContext = inferReceiverContext(situation)

  return `You are CommKit, a communication coach for professionals at every level. Generate responses for this exact situation.

USER PROFILE:
- Role: ${role || 'Professional'}
- Communication style: ${style || 'Balanced'}
- Situation: ${situation}
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
- If the likely receiver is the user's manager, make the questions sound like a manager: priorities, readiness, scope, timing, expectations, support.
- If the likely receiver is a direct report or teammate, make the questions sound like that person: fairness, clarity, impact, next steps.
- Answers should be words the user can say back immediately.`
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

export async function generateResourceBrief({ title, audience, documentText, context, attachments = [] }) {
  const prompt = buildResourcePrompt({ title, audience, documentText, context, attachments })
  return postPrompt(prompt, attachments.filter(attachment => attachment.data))
}

function buildResourcePrompt({ title, audience, documentText, context, attachments = [] }) {
  const attachmentList = attachments.length
    ? attachments.map(file => `- ${file.name} (${file.mediaType || file.kind})`).join('\n')
    : '- None'

  return `You are CommKit Resource Center. Turn technical workplace material into clear communication assets.

DOCUMENT CONTEXT:
- Title: ${title || 'Technical review'}
- Audience: ${audience || 'manager or stakeholder'}
- User context: ${context || 'The user needs to explain this clearly at work.'}
- Uploaded files:
${attachmentList}

DOCUMENT TEXT:
${(documentText || 'No pasted text. Use the uploaded files if available.').slice(0, 6200)}

Return ONLY valid raw JSON. No markdown fences. Keep it concise and practical:
{
  "title": "short title max 5 words",
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

async function postPrompt(prompt, attachments = []) {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, attachments }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || `API error ${response.status}`)
  }

  const data = await response.json()
  const text = data.content?.[0]?.text || ''

  return parseClaudeJson(text)
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
