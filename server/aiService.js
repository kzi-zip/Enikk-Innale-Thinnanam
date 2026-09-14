const { analyzeChildRequest } = require('./childLogicParser');

const GEMINI_MODEL = 'gemini-3.5-flash';

function makeFallback(userPrompt) {
  return analyzeChildRequest(userPrompt);
}

async function interpretWithAI(userPrompt) {
  const fallback = makeFallback(userPrompt);

  const apiKey = process.env.GEMINI_API_KEY;

  // If there is no Gemini key, use the local engine.
  if (!apiKey) {
    console.log('[REALITY AI] No Gemini API key. Using local semantic engine.');
    return fallback;
  }

  const prompt = `
You are the Reality AI inside "ENIKK INNALE THINNAM".

Your personality is innocent, funny, childlike and completely willing to
take ridiculous child logic seriously.

The user has said:

"${userPrompt}"

Interpret the request literally.

Return ONLY valid JSON with these fields:

{
  "id": "short-id",
  "label": "short funny label",
  "object": "main object",
  "action": "what happens",
  "location": "where it happens",
  "distance": "scale or distance",
  "physicalPossibility": "YES or NO",
  "impossibility": "short explanation",
  "physicsObjection": "funny scientific objection",
  "decision": "Okay.",
  "executionStep": "what reality does",
  "consequence": "what happens afterwards",
  "notes": "short funny note",
  "integrityImpact": "effect on reality",
  "visualType": "visual category",
  "itemEmoji": "one emoji",
  "itemName": "display name"
}

Important:
- Never reject the child's imagination.
- Treat impossible requests as engineering specifications.
- Keep the answer funny and innocent.
- If the request involves time, take the child's wording literally.
- Do not turn everything into a rainbow.
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.9,
            responseMimeType: 'application/json'
          }
        })
      }
    );

    if (!response.ok) {
      console.warn(
        '[REALITY AI] Gemini request failed:',
        response.status
      );
      return fallback;
    }

    const data = await response.json();

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.warn('[REALITY AI] Gemini returned no text.');
      return fallback;
    }

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch (parseError) {
      console.warn(
        '[REALITY AI] Gemini returned invalid JSON. Using fallback.'
      );
      return fallback;
    }

    const bureaucraticLog = [
      'REQUEST RECEIVED',
      'ANALYZING CHILD LOGIC...',
      `OBJECT: ${parsed.object || 'UNKNOWN'}`,
      `ACTION: ${parsed.action || 'UNKNOWN'}`,
      `SCALE: ${parsed.distance || 'NORMAL'}`,
      `PHYSICAL POSSIBILITY: ${parsed.physicalPossibility || 'QUESTIONABLE'}`
    ];

    if (parsed.temporalLogic) {
      bureaucraticLog.push(
        `TEMPORAL LOGIC: ${parsed.temporalLogic}`
      );
    }

    bureaucraticLog.push('DECISION: Okay.');
    bureaucraticLog.push(
      'INITIATING REALITY ALTERATION...'
    );

    return {
      ...fallback,
      ...parsed,

      bureaucraticLog,

      visualConfig: {
        type: parsed.visualType || fallback.visualConfig?.type || 'generic',
        emoji: parsed.itemEmoji || fallback.visualConfig?.emoji || '✨',
        name: parsed.itemName || fallback.visualConfig?.name || parsed.object
      },

      behaviors: fallback.behaviors || []
    };

  } catch (error) {
    console.warn(
      '[REALITY AI] Gemini API call failed. Falling back to local engine:',
      error
    );

    return fallback;
  }
}

module.exports = {
  interpretWithAI,
  makeFallback
};