const { analyzeChildRequest } = require('./childLogicParser');

const GEMINI_MODEL = 'gemini-3.5-flash';

function cleanJsonText(text) {
    if (!text) return '';

    let cleaned = text.trim();

    // Remove markdown code fences if Gemini adds them
    cleaned = cleaned.replace(/^```json\s*/i, '');
    cleaned = cleaned.replace(/^```\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/i, '');

    return cleaned.trim();
}

function makeFallback(userPrompt) {
    return analyzeChildRequest(userPrompt);
}

async function interpretRequest(userPrompt) {
    const rawRequest = String(userPrompt || '').trim();

    if (!rawRequest) {
        return {
            success: false,
            error: 'Please tell reality something impossible.',
            rawRequest: ''
        };
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // If Render does not have the key, keep the project working
    // with the existing local child-logic engine.
    if (!apiKey) {
        console.warn('[REALITY AI] GEMINI_API_KEY is missing. Using local child logic.');
        return makeFallback(rawRequest);
    }

    const systemPrompt = `
You are the AI brain of a silly child-logic reality simulator called
"ENIKK INNALE THINNAM".

Your personality is innocent, literal, funny, imaginative and childlike.

The user will type something a child might say that is impossible,
absurd, physically impossible, temporally impossible, or just wonderfully silly.

DO NOT reject the request just because it is impossible.

Instead, interpret the child's request literally and describe how
the simulator should bend reality to make it happen.

Examples:
"I want to eat biryani yesterday"
"I want to eat the moon"
"I want my pillow to become a dinosaur"
"I want it to rain cookies"
"I want my school bag to fly"

Return ONLY valid JSON.
Do not use markdown.
Do not add explanations outside the JSON.

The JSON MUST contain exactly these fields:

{
  "id": "short-unique-id",
  "label": "short funny title",
  "object": "main object involved",
  "action": "what the object/person is doing",
  "location": "where it happens",
  "distance": "near/far/inside/above/etc",
  "physicalPossibility": "possible or impossible",
  "impossibility": "funny explanation of why reality objects",
  "physicsObjection": "one short scientific objection",
  "decision": "the simulator's funny decision",
  "executionStep": "what reality does to make it happen",
  "consequence": "what happens afterward",
  "notes": "short funny note",
  "integrityImpact": "low/medium/high",
  "visualType": "choose one: food, moon, cloud, rainbow, dinosaur, giant, drawing, generic",
  "itemEmoji": "one suitable emoji",
  "itemName": "short name of the main visual object"
}

IMPORTANT:
- Keep the language simple and playful.
- Do not make the answer sound like a serious AI assistant.
- Think like a child who believes the impossible request makes perfect sense.
- The result will be used by a browser animation engine.
- Keep every value reasonably short.
- Always return valid JSON.
`;

    const requestPrompt = `
Child's request:

"${rawRequest}"

Make this impossible request real.
`;

    try {
        const url =
            `https://generativelanguage.googleapis.com/v1beta/models/` +
            `${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [
                            {
                                text: systemPrompt + '\n\n' + requestPrompt
                            }
                        ]
                    }
                ],
                generationConfig: {
                    responseMimeType: 'application/json'
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();

            console.error(
                '[REALITY AI] Gemini HTTP error:',
                response.status,
                errorText
            );

            return makeFallback(rawRequest);
        }

        const data = await response.json();

        const generatedText =
            data?.candidates?.[0]?.content?.parts
                ?.map(part => part.text || '')
                .join('')
                .trim();

        if (!generatedText) {
            console.warn('[REALITY AI] Gemini returned no text.');
            return makeFallback(rawRequest);
        }

        const cleanedJson = cleanJsonText(generatedText);

        let aiResult;

        try {
            aiResult = JSON.parse(cleanedJson);
        } catch (parseError) {
            console.error(
                '[REALITY AI] Could not parse Gemini JSON:',
                generatedText
            );

            return makeFallback(rawRequest);
        }

        // Make sure the fields expected by the Reality Engine exist.
        const result = {
            success: true,
            input: rawRequest,
            rawRequest,

            id: aiResult.id || `reality-${Date.now()}`,
            label: aiResult.label || 'Reality has bugs',
            object: aiResult.object || 'something',
            action: aiResult.action || 'doing something impossible',
            location: aiResult.location || 'right here',
            distance: aiResult.distance || 'nearby',

            physicalPossibility:
                aiResult.physicalPossibility || 'impossible',

            impossibility:
                aiResult.impossibility ||
                'Reality said no, so we ignored reality.',

            physicsObjection:
                aiResult.physicsObjection ||
                'Physics has concerns.',

            decision:
                aiResult.decision ||
                'MAKE IT REAL.',

            executionStep:
                aiResult.executionStep ||
                'Reality bends slightly.',

            consequence:
                aiResult.consequence ||
                'Everything becomes slightly more ridiculous.',

            notes:
                aiResult.notes ||
                'Ps. I am sorry.',

            integrityImpact:
                aiResult.integrityImpact || 'medium',

            visualType:
                aiResult.visualType || 'generic',

            itemEmoji:
                aiResult.itemEmoji || '✨',

            itemName:
                aiResult.itemName ||
                aiResult.object ||
                'mystery object',

            // Keep these useful for the rest of your project.
            archetype: aiResult.visualType || 'generic',
            temporal: '',
            temporalLogic: '',
            bureaucraticLog: '',
            completionSummary:
                aiResult.consequence || 'Reality has been altered.',
            sideEffect: aiResult.notes || 'Reality has bugs.',
            behaviors: [],
            visualConfig: {
                type: aiResult.visualType || 'generic',
                emoji: aiResult.itemEmoji || '✨',
                name: aiResult.itemName || aiResult.object || 'mystery object'
            }
        };

        console.log('[REALITY AI] Gemini interpreted:', rawRequest);
        console.log('[REALITY AI] Result:', result);

        return result;

    } catch (error) {
        console.error('[REALITY AI] Unexpected error:', error);

        // The project should still work even if Gemini temporarily fails.
        return makeFallback(rawRequest);
    }
}

module.exports = {
    interpretRequest
};