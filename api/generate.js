/**
 * CommKit — /api/generate
 * Vercel serverless function
 * Keeps the Anthropic API key server-side, never exposed to the browser
 */

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Validate API key is configured
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    if (process.env.VERCEL_ENV !== 'production') {
      console.warn('[CommKit API] ANTHROPIC_API_KEY not set — returning local demo response')
      return res.status(200).json(buildDemoAnthropicResponse(req.body?.prompt || ''))
    }

    console.error('[CommKit API] ANTHROPIC_API_KEY not set')
    return res.status(500).json({ error: 'API not configured' })
  }

  // Validate request body
  const { prompt, attachments = [] } = req.body || {}
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt is required' })
  }

  // Sanity check prompt length
  if (prompt.length > 8000) {
    return res.status(400).json({ error: 'prompt too long' })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3200,
        messages: [
          { role: 'user', content: buildMessageContent(prompt, attachments) }
        ],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[CommKit API] Anthropic error:', data)
      return res.status(response.status).json({
        error: data.error?.message || `API error ${response.status}`
      })
    }

    // Forward the successful response
    return res.status(200).json(data)

  } catch (err) {
    console.error('[CommKit API] Fetch error:', err)
    return res.status(500).json({
      error: 'Could not reach AI service. Check your connection.'
    })
  }
}

function buildMessageContent(prompt, attachments) {
  const content = [{ type: 'text', text: prompt }]

  for (const attachment of attachments || []) {
    if (!attachment?.data || !attachment?.mediaType) continue

    if (attachment.mediaType.startsWith('image/')) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: attachment.mediaType,
          data: attachment.data,
        },
      })
      continue
    }

    if (attachment.mediaType === 'application/pdf') {
      content.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: attachment.mediaType,
          data: attachment.data,
        },
      })
    }
  }

  return content
}

function buildDemoAnthropicResponse(prompt) {
  const situation = getPromptField(prompt, 'Situation') || 'a hard workplace conversation'
  const role = getPromptField(prompt, 'Role') || 'Professional'
  const style = getPromptField(prompt, 'Communication style') || 'Balanced'

  const demo = {
    situationTitle: 'Performance Follow-Up',
    detectedSummary: `You need to address ${situation.toLowerCase()} without making the other person defensive.`,
    profileApplied: `I calibrated this for a ${role.toLowerCase()} with a ${style.toLowerCase()} communication style.`,
    responses: [
      {
        label: 'Direct version',
        why: 'Clear, fast, and specific',
        tone: 'Direct',
        text: 'I want to talk about what has been happening with this. I need us to be clear on the expectation, what is getting missed, and what changes starting today.',
        shortText: 'I want to talk about what is happening, what is getting missed, and what changes starting today.',
        emailText: 'Subject: Quick follow-up\n\nHi [Name],\n\nI want to talk about what has been happening with this. I need us to be clear on the expectation, what is getting missed, and what changes starting today.\n\nCan we find a few minutes to align on next steps?\n\nThanks,\n[Your name]',
      },
      {
        label: 'Balanced version',
        why: 'Firm without closing the door',
        tone: 'Balanced',
        text: 'I want to check in about this because it is starting to affect the work. I am not trying to make this bigger than it is, but I do want us to agree on what changes from here.',
        shortText: 'I want to check in about this and agree on what changes from here before it gets bigger.',
        emailText: 'Subject: Checking in\n\nHi [Name],\n\nI want to check in about this because it is starting to affect the work. I am not trying to make this bigger than it is, but I do want us to agree on what changes from here.\n\nCould we find a time to talk it through?\n\nThanks,\n[Your name]',
      },
      {
        label: 'Careful version',
        why: 'Protects the relationship first',
        tone: 'Careful',
        text: 'Can we talk for a minute about something I have noticed? I want to understand what is going on and make sure we are aligned before this turns into a bigger issue.',
        shortText: 'Can we talk for a minute about something I noticed? I want to understand what is going on and make sure we are aligned.',
        emailText: 'Subject: Can we talk this through?\n\nHi [Name],\n\nCan we talk for a minute about something I have noticed? I want to understand what is going on and make sure we are aligned before this turns into a bigger issue.\n\nLet me know when would be a good time.\n\nThanks,\n[Your name]',
      },
    ],
    framework: {
      name: 'SBI Model',
      source: 'Center for Creative Leadership',
      explanation: 'SBI works here because it keeps the conversation grounded in what happened, what behavior was observed, and why it matters. That lowers defensiveness and makes the next step easier to agree on.',
      stat1num: '40yr',
      stat1label: 'research validation',
      stat2num: '80%',
      stat2label: 'Fortune 500 use',
      usedBy: 'Used in leadership training across Google, the US Army, NHS programs, and Fortune 500 companies.',
    },
    coachingTip: 'Lead with the specific moment, not the person. The cleaner your first sentence is, the less room there is for the conversation to become personal.',
    qaItems: [
      {
        question: 'Are you saying I am doing a bad job?',
        answer: 'No. I am saying this specific pattern needs to change, and I want us to be clear about what good looks like from here.',
      },
      {
        question: 'Why are you bringing this up now?',
        answer: 'Because I would rather address it early while it is still fixable than let it become a bigger problem later.',
      },
      {
        question: 'What exactly do you want me to do?',
        answer: 'I want us to agree on the expectation, the next step, and how we will know it is back on track.',
      },
    ],
    signalObservation: `${style} communicators often do best when they stay specific before explaining impact.`,
    suggestedTag: '🎯 Clear under pressure',
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(demo),
      },
    ],
  }
}

function getPromptField(prompt, label) {
  const match = prompt.match(new RegExp(`- ${label}: (.+)`))
  return match?.[1]?.trim()
}
