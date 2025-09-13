'use client';

import { useState } from 'react';
import { Search, Database, BarChart3, Table, Loader2, Settings } from 'lucide-react';
import { QueryInterface } from '@/components/QueryInterface';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import { SchemaInfo } from '@/components/SchemaInfo';
import { DatabaseConnection } from '@/components/DatabaseConnection';
import { SchemaEditor } from '@/components/SchemaEditor';

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [schemaMetadata, setSchemaMetadata] = useState(null);
  const [connectionString, setConnectionString] = useState('');
  const [databaseName, setDatabaseName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('connection');

  const handleConnectionSuccess = (connString: string, dbName: string) => {
    setConnectionString(connString);
    setDatabaseName(dbName);
    setIsConnected(true);
    setActiveTab('query');
  };

  const handleSchemaLoad = (schema: any) => {
    setSchemaMetadata(schema);
  };

  const handleSchemaUpdate = (schema: any) => {
    setSchemaMetadata(schema);
  };

  const handleSchemaSave = (schema: any) => {
    setSchemaMetadata(schema);
    // Here you could save to localStorage or send to server
    localStorage.setItem('schemaMetadata', JSON.stringify(schema));
  };

  const handleQuery = async (userQuery: string) => {
    if (!isConnected || !schemaMetadata) {
      alert('Please connect to a database first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userQuery,
          schemaMetadata: schemaMetadata,
          connectionString: connectionString
        }),
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Query error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSchema = async () => {
    try {
      const response = await fetch('/api/schema');
      const data = await response.json();
      setSchemaMetadata(data);
    } catch (error) {
      console.error('Schema load error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Database className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">
              Talk-to-Mongo Assistant
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Convert your natural language questions into MongoDB aggregation pipelines
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-md">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('connection')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === 'connection'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Database Connection
                </button>
                <button
                  onClick={() => setActiveTab('schema')}
                  disabled={!isConnected}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === 'schema'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Schema Editor
                </button>
                <button
                  onClick={() => setActiveTab('query')}
                  disabled={!isConnected}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === 'query'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Query Interface
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'connection' && (
                <DatabaseConnection
                  onConnectionSuccess={handleConnectionSuccess}
                  onSchemaLoad={handleSchemaLoad}
                />
              )}

              {activeTab === 'schema' && isConnected && (
                <SchemaEditor
                  schemaMetadata={schemaMetadata}
                  onSchemaUpdate={handleSchemaUpdate}
                  onSchemaSave={handleSchemaSave}
                />
              )}

              {activeTab === 'query' && isConnected && (
                <div className="space-y-6">
                  {/* Schema Info */}
                  <SchemaInfo 
                    schemaMetadata={schemaMetadata} 
                    onLoadSchema={loadSchema}
                  />

                  {/* Query Interface */}
                  <QueryInterface 
                    onQuery={handleQuery}
                    loading={loading}
                  />

                  {/* Results */}
                  {results && (
                    <ResultsDisplay results={results} />
                  )}
                </div>
              )}

              {!isConnected && activeTab !== 'connection' && (
                <div className="text-center py-12">
                  <Database className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Connect to Database First</h3>
                  <p className="text-gray-600 mb-4">Please establish a database connection to access this feature.</p>
                  <button
                    onClick={() => setActiveTab('connection')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Go to Connection
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <Search className="h-8 w-8 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Natural Language</h3>
            <p className="text-gray-600">
              Ask questions in plain English and get MongoDB queries automatically generated.
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <BarChart3 className="h-8 w-8 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Smart Analytics</h3>
            <p className="text-gray-600">
              Get intelligent chart suggestions and data visualizations for your results.
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <Table className="h-8 w-8 text-purple-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Safe Queries</h3>
            <p className="text-gray-600">
              All queries are read-only and safe, with built-in privacy protection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
