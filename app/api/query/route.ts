import { NextRequest, NextResponse } from 'next/server';
import { generateMongoQuery } from '@/lib/openai';
import { runMongoAggregation, runMongoFind } from '@/lib/mongodb';

interface ChartSuggestion {
    type: string;
    title: string;
    x?: string;
    y?: string;
}

function generateFallbackChartSuggestions(data: any[]): ChartSuggestion[] {
    if (!data || data.length === 0) {
        return [{ type: 'table', title: 'No data available' }];
    }

    const suggestions: ChartSuggestion[] = [{ type: 'table', title: 'Tabular Results' }];
    const sampleDoc = data[0];
    const keys = Object.keys(sampleDoc);

    // Look for numeric fields for charts
    const numericFields = keys.filter(key => {
        const value = sampleDoc[key];
        return typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)));
    });

    const stringFields = keys.filter(key => {
        const value = sampleDoc[key];
        return typeof value === 'string' && isNaN(Number(value));
    });

    // Generate chart suggestions based on available fields
    if (numericFields.length > 0 && stringFields.length > 0) {
        suggestions.push({
            type: 'bar',
            title: `${stringFields[0]} vs ${numericFields[0]}`,
            x: stringFields[0],
            y: numericFields[0]
        });
    }

    if (numericFields.length >= 2) {
        suggestions.push({
            type: 'line',
            title: `${numericFields[0]} over ${numericFields[1]}`,
            x: numericFields[1],
            y: numericFields[0]
        });
    }

    if (stringFields.length > 0) {
        suggestions.push({
            type: 'pie',
            title: `Distribution by ${stringFields[0]}`,
            x: stringFields[0],
            y: 'count'
        });
    }

    return suggestions;
}

function analyzeMongoError(error: any): string | null {
    if (!error || typeof error !== 'object') return null;

    const errorMessage = error.message || error.errmsg || '';

    // Common MongoDB aggregation errors and their fixes
    if (errorMessage.includes('$slice must be an array')) {
        return 'First argument to $slice must be an array, but is of type: int. Use proper array operations like $map or $reduce instead.';
    }

    if (errorMessage.includes('$lookup')) {
        return 'Invalid $lookup stage configuration. Check localField, foreignField, and from parameters.';
    }

    if (errorMessage.includes('field path must not start with')) {
        return 'Invalid field path reference. Field paths cannot start with $ or contain invalid characters.';
    }

    if (errorMessage.includes('$project')) {
        return 'Invalid $project stage configuration. Check field references and expressions.';
    }

    if (errorMessage.includes('$group')) {
        return 'Invalid $group stage configuration. Check _id field and accumulator expressions.';
    }

    if (errorMessage.includes('$match')) {
        return 'Invalid $match stage configuration. Check field references and query operators.';
    }

    if (errorMessage.includes('$unwind')) {
        return 'Invalid $unwind stage configuration. The field being unwound must be an array.';
    }

    if (errorMessage.includes('$sort')) {
        return 'Invalid $sort stage configuration. Check field references and sort order values.';
    }

    if (errorMessage.includes('unknown operator')) {
        return 'Unknown MongoDB operator used. Check operator syntax and spelling.';
    }

    if (errorMessage.includes('field name cannot be empty')) {
        return 'Field name cannot be empty. Ensure all field references are valid.';
    }

    return null;
}

async function executeQueryWithRetry(
    query: string,
    schemaMetadata: any,
    connectionString: string,
    maxRetries: number = 2
): Promise<any> {
    let assistantResponse;
    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            // Generate MongoDB query using OpenAI
            const retryContext = attempt > 0 ? {
                error: analyzeMongoError(lastError) || undefined,
                originalPipeline: assistantResponse?.pipeline
            } : undefined;

            assistantResponse = await generateMongoQuery(query, schemaMetadata, retryContext);

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

            // If query execution was successful, return the result
            if (queryResult.success) {
                return {
                    assistantResponse,
                    queryResult
                };
            } else {
                // Store the error for potential retry
                lastError = queryResult.error;
                console.log(`Query execution failed on attempt ${attempt + 1}:`, queryResult.error);

                if (attempt === maxRetries) {
                    // Final attempt failed, return the error
                    return {
                        assistantResponse,
                        queryResult
                    };
                }
            }
        } catch (error) {
            lastError = error;
            console.log(`Query generation/execution failed on attempt ${attempt + 1}:`, error);

            if (attempt === maxRetries) {
                throw error;
            }
        }
    }

    throw new Error('Max retries exceeded');
}

export async function POST(request: NextRequest) {
    try {
        const { query, schemaMetadata, connectionString } = await request.json();

        if (!query || !schemaMetadata) {
            return NextResponse.json(
                { error: 'Query and schema metadata are required' },
                { status: 400 }
            );
        }

        // Execute query with retry mechanism
        const { assistantResponse, queryResult } = await executeQueryWithRetry(
            query,
            schemaMetadata,
            connectionString
        );

        // Add fallback chart suggestions if none provided
        const chartSuggestions = assistantResponse.chart_suggestions && assistantResponse.chart_suggestions.length > 0
            ? assistantResponse.chart_suggestions
            : generateFallbackChartSuggestions(queryResult.data);

        return NextResponse.json({
            ...assistantResponse,
            chart_suggestions: chartSuggestions,
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
