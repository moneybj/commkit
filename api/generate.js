/**
 * CommKit — /api/generate
 * Vercel serverless function
 * Keeps the Anthropic API key server-side, never exposed to the browser
 */

export default async function handler(req, res) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 26000)

  // Only allow POST
  if (req.method !== 'POST') {
    clearTimeout(timeout)
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Validate API key is configured
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    if (process.env.VERCEL_ENV !== 'production') {
      console.warn('[CommKit API] ANTHROPIC_API_KEY not set — returning local demo response')
      clearTimeout(timeout)
      return res.status(200).json(buildDemoAnthropicResponse(req.body?.prompt || ''))
    }

    console.error('[CommKit API] ANTHROPIC_API_KEY not set')
    clearTimeout(timeout)
    return res.status(500).json({ error: 'API not configured' })
  }

  // Validate request body
  const { prompt, attachments = [] } = req.body || {}
  if (!prompt || typeof prompt !== 'string') {
    clearTimeout(timeout)
    return res.status(400).json({ error: 'prompt is required' })
  }

  // Sanity check prompt length
  if (prompt.length > 9000) {
    clearTimeout(timeout)
    return res.status(400).json({ error: 'prompt too long' })
  }

  try {
    const isResourceRequest = prompt.includes('CommKit Resource Center')
    const isRefinementRequest = prompt.includes('USER FOLLOW-UP REQUEST')
    const hasFiles = attachments.some(attachment => attachment?.data)
    const model = process.env.ANTHROPIC_MODEL
      || (hasFiles ? 'claude-sonnet-4-20250514' : 'claude-haiku-4-5-20251001')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        max_tokens: isResourceRequest || isRefinementRequest ? 2600 : 2200,
        messages: [
          { role: 'user', content: buildMessageContent(prompt, attachments) }
        ],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[CommKit API] Anthropic error:', data)
      clearTimeout(timeout)
      return res.status(response.status).json({
        error: data.error?.message || `API error ${response.status}`
      })
    }

    // Forward the successful response
    clearTimeout(timeout)
    return res.status(200).json(data)

  } catch (err) {
    console.error('[CommKit API] Fetch error:', err)
    clearTimeout(timeout)
    if (err.name === 'AbortError') {
      return res.status(504).json({
        error: 'AI response timed out. Try a shorter situation or refine after generation.'
      })
    }
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
  if (prompt.includes('CommKit Resource Center')) {
    return buildDemoResourceResponse(prompt)
  }

  const situation = getPromptField(prompt, 'Situation') || 'a hard workplace conversation'
  const role = getPromptField(prompt, 'Role') || 'Professional'
  const style = getPromptField(prompt, 'Communication style') || 'Balanced'
  const isRefinement = prompt.includes('USER FOLLOW-UP REQUEST')

  const demo = {
    situationTitle: isRefinement ? 'Refined Follow-Up' : 'Performance Follow-Up',
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
      methodSteps: ['Name the specific situation', 'Describe the behavior without blame', 'Explain the impact', 'Ask for a clear next step'],
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
    refinementNote: isRefinement ? 'I tightened the language based on your follow-up request.' : '',
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

function buildDemoResourceResponse(prompt) {
  const isRefinement = prompt.includes('USER FOLLOW-UP REQUEST')
  const title = getPromptField(prompt, 'Title') || 'QC Review Brief'
  const audience = getPromptField(prompt, 'Audience') || 'manager or stakeholder'

  const demo = {
    title: isRefinement ? 'Refined QC Brief' : title,
    methodFramework: {
      name: 'Pyramid Principle + Audience-Centered Briefing',
      source: 'Barbara Minto; stakeholder communication practice',
      explanation: `This structure leads with the answer first, then supports it with the evidence ${audience} needs for a decision. It keeps technical detail organized without burying the action needed.`,
      steps: ['Lead with the main takeaway', 'Group evidence by decision impact', 'Translate findings into actions', 'Prepare likely stakeholder questions'],
    },
    summary: [
      'The key finding should be stated first so the audience knows what decision or action is needed.',
      'Technical details should be grouped by impact, risk, and next step rather than document order.',
      'Any uncertainty should be named clearly with what is being done to close the gap.',
    ],
    presentationOutline: [
      {
        slide: 'Main Takeaway',
        points: ['State the finding in plain language', 'Name the recommended decision or next step'],
      },
      {
        slide: 'Evidence and Impact',
        points: ['Summarize the strongest supporting data', 'Explain operational or quality impact'],
      },
      {
        slide: 'Next Steps',
        points: ['Assign owners and timing', 'Clarify what needs approval'],
      },
    ],
    talkingPoints: [
      'The main point is what changed, why it matters, and what we recommend next.',
      'The evidence supports action, but I will separate confirmed facts from open items.',
      'The immediate risk is manageable if we follow the proposed next steps.',
      'I can walk through the data, but I want to start with the decision needed.',
    ],
    emailDraft: 'Subject: QC review summary and next steps\n\nHi [Name],\n\nI summarized the key findings, impact, and recommended next steps from the review. The main takeaway is that we should align on the decision needed first, then confirm ownership and timing for the follow-up actions.\n\nThanks,\n[Your name]',
    questionsToExpect: [
      {
        question: 'What decision do you need from me?',
        answer: 'I need alignment on the recommended next step and confirmation of who should own the follow-up.',
      },
      {
        question: 'What is the biggest risk?',
        answer: 'The biggest risk is delay or unclear ownership, so I am proposing specific next steps and timing.',
      },
    ],
    refinementNote: isRefinement ? 'I adjusted the brief around your follow-up request.' : '',
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
