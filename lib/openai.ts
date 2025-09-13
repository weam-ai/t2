import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
    throw new Error('Please add your OpenAI API key to .env.local');
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

console.log({ OPENAI_API_KEY: process.env.OPENAI_API_KEY });

export interface AssistantResponse {
    final_answer: string;
    assumptions: string[];
    base_collection: string;
    pipeline: any[];
    columns: string[];
    chart_suggestions: Array<{
        type: string;
        title: string;
        x?: string;
        y?: string;
    }>;
}

export interface SchemaMetadata {
    database: string;
    schema_json: any;
    collection_descriptions: any;
    field_descriptions: any;
    domain_notes?: string;
    timezone: string;
    now_iso: string;
}

export async function generateMongoQuery(
    userQuery: string,
    schemaMetadata: SchemaMetadata,
    retryContext?: { error?: string; originalPipeline?: any[] }
): Promise<AssistantResponse> {
    const systemPrompt = `
You are a data analyst for a web app. Convert user questions into SAFE, read-only MongoDB aggregation pipelines using the provided schema metadata.

DATABASE: ${schemaMetadata.database}
SCHEMA_JSON: ${JSON.stringify(schemaMetadata.schema_json, null, 2)}
COLLECTION_DESCRIPTIONS: ${JSON.stringify(schemaMetadata.collection_descriptions, null, 2)}
FIELD_DESCRIPTIONS: ${JSON.stringify(schemaMetadata.field_descriptions, null, 2)}
DOMAIN_NOTES: ${schemaMetadata.domain_notes || 'None'}
TIMEZONE: ${schemaMetadata.timezone}
NOW: ${schemaMetadata.now_iso}

${retryContext?.error ? `
RETRY CONTEXT - FIX THE FOLLOWING ERROR:
ERROR: ${retryContext.error}
ORIGINAL PIPELINE: ${JSON.stringify(retryContext.originalPipeline, null, 2)}

Please fix the pipeline to resolve this error. Common fixes:
- $slice requires an array as first argument, not an integer
- Use proper array operations like $map, $reduce for complex calculations
- Ensure field references are correct and exist in the schema
- Use $addFields instead of $project for computed fields when needed
` : ''}

GENERAL RULES:
- SAFETY: Read-only only. Never generate stages that write or modify data.
- PRIVACY: Prefer aggregates over raw PII lists.
- SCHEMA FIRST: Use SCHEMA_JSON + descriptions to pick collections/fields.
- PIPELINE QUALITY: Put $match early, use $lookup/$unwind for relations only when needed.
- NUMBERS: Include units/currency if known from field descriptions.
- LIMITS: Default result limit 100 rows; for summaries/top-N, produce exactly N with explicit $limit.

OUTPUT CONTRACT:
Always return a VALID JSON object with EXACTLY this structure:
{
  "final_answer": "One or two sentences summarizing the result with headline numbers.",
  "assumptions": ["list of assumptions or defaults used"],
  "base_collection": "string",
  "pipeline": [ ... ],
  "columns": ["ordered", "column", "names"],
  "chart_suggestions": [
    { "type": "table", "title": "Tabular results" },
    { "type": "bar", "x": "field1", "y": "field2", "title": "Chart title" }
  ]
}

CRITICAL JSON REQUIREMENTS:
- Use double quotes for all strings
- Escape quotes inside strings with backslash
- Use proper JSON syntax for dates: {"$gte": new Date("2020-01-01T00:00:00.000Z")}
- No trailing commas
- No comments
- Valid JSON syntax only

User Query: ${userQuery}

Respond with ONLY the valid JSON object, no markdown, no explanations, no additional text.`;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: userQuery
                }
            ],
            temperature: 0.1,
            max_tokens: 2000
        });

        const response = completion.choices[0]?.message?.content;
        if (!response) {
            throw new Error('No response from OpenAI');
        }

        console.log('OpenAI raw response:', response);

        // Clean the response - remove any markdown formatting or extra text
        let cleanedResponse = response.trim();

        // Remove markdown code blocks if present
        if (cleanedResponse.startsWith('```json')) {
            cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedResponse.startsWith('```')) {
            cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        // Try to extract JSON from the response if it's wrapped in text
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleanedResponse = jsonMatch[0];
        }

        console.log('Cleaned response for parsing:', cleanedResponse);

        // Parse the JSON response
        const parsedResponse = JSON.parse(cleanedResponse);

        // Validate required fields
        if (!parsedResponse.base_collection || !parsedResponse.pipeline) {
            throw new Error('Invalid response structure: missing required fields');
        }

        return parsedResponse as AssistantResponse;
    } catch (error) {
        console.error('OpenAI API error:', error);

        // If it's a JSON parsing error, provide more details
        if (error instanceof SyntaxError) {
            console.error('JSON parsing failed.');
            throw new Error(`Failed to parse OpenAI response as JSON: ${error.message}`);
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(`Failed to generate MongoDB query: ${errorMessage}`);
    }
}
