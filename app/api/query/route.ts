import { NextRequest, NextResponse } from 'next/server';
import { generateMongoQuery } from '@/lib/openai';
import { runMongoAggregation, runMongoFind } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
    try {
        const { query, schemaMetadata, connectionString } = await request.json();

        if (!query || !schemaMetadata) {
            return NextResponse.json(
                { error: 'Query and schema metadata are required' },
                { status: 400 }
            );
        }

        // Generate MongoDB query using OpenAI
        const assistantResponse = await generateMongoQuery(query, schemaMetadata);

        // Execute the MongoDB query
        let queryResult;
        if (assistantResponse.pipeline && assistantResponse.pipeline.length > 0) {
            queryResult = await runMongoAggregation({
                database: schemaMetadata.database,
                collection: assistantResponse.base_collection,
                pipeline: assistantResponse.pipeline,
                sample_limit: 200,
                connectionString: connectionString
            });
        } else {
            // Fallback to simple find if no pipeline
            queryResult = await runMongoFind({
                database: schemaMetadata.database,
                collection: assistantResponse.base_collection,
                filter: {},
                limit: 100,
                connectionString: connectionString
            });
        }

        return NextResponse.json({
            ...assistantResponse,
            query_result: queryResult
        });

    } catch (error) {
        console.error('Query API error:', error);
        return NextResponse.json(
            { error: 'Failed to process query' },
            { status: 500 }
        );
    }
}
