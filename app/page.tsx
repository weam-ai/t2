'use client';

import { useState } from 'react';
import { Search, Database, BarChart3, Table, Loader2, Settings, History } from 'lucide-react';
import { QueryInterface } from '@/components/QueryInterface';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import { SchemaInfo } from '@/components/SchemaInfo';
import { DatabaseConnection } from '@/components/DatabaseConnection';
import { SchemaEditor } from '@/components/SchemaEditor';
import { QueryHistory } from '@/components/QueryHistory';

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
      
      // Add to query history
      if (data.query_result?.success) {
        const resultCount = data.query_result.data?.length || 0;
        const chartType = data.chart_suggestions?.[0]?.type;
        addToQueryHistory(userQuery, resultCount, chartType);
      }
    } catch (error) {
      console.error('Query error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToQueryHistory = (query: string, resultCount?: number, chartType?: string) => {
    const historyItem = {
      id: Date.now().toString(),
      query,
      timestamp: new Date().toISOString(),
      isFavorite: false,
      resultCount,
      chartType
    };

    const existingHistory = JSON.parse(localStorage.getItem('queryHistory') || '[]');
    const updatedHistory = [historyItem, ...existingHistory].slice(0, 50);
    localStorage.setItem('queryHistory', JSON.stringify(updatedHistory));
  };

  const handleQuerySelect = (query: string) => {
    setQuery(query);
    // You could also trigger the query automatically if desired
  };

  const handleClearHistory = () => {
    localStorage.removeItem('queryHistory');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-100/50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-success-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-warning-200/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="floating-card p-8 mb-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-600 rounded-3xl blur-2xl opacity-30"></div>
                <div className="relative bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
                  <Database className="h-16 w-16 text-primary-600" />
                </div>
              </div>
            </div>
            <div>
              <h1 className="text-6xl font-bold gradient-text mb-4">
                Talk-to-Mongo Assistant
              </h1>
              <div className="h-2 w-32 bg-gradient-to-r from-primary-500 to-primary-600 mx-auto rounded-full mb-6"></div>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
                Transform your natural language questions into powerful MongoDB aggregation pipelines with AI-powered intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8 animate-slide-up">
          <div className="card">
            <div className="border-b border-gray-200 bg-gray-50/50">
              <nav className="flex space-x-1 px-6">
                <button
                  onClick={() => setActiveTab('connection')}
                  className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center transition-all duration-200 ${
                    activeTab === 'connection'
                      ? 'border-primary-500 text-primary-600 bg-white rounded-t-lg'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-100/50'
                  }`}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Database Connection
                </button>
                <button
                  onClick={() => setActiveTab('schema')}
                  disabled={!isConnected}
                  className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center transition-all duration-200 ${
                    activeTab === 'schema'
                      ? 'border-primary-500 text-primary-600 bg-white rounded-t-lg'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-100/50'
                  } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Schema Editor
                </button>
                <button
                  onClick={() => setActiveTab('query')}
                  disabled={!isConnected}
                  className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center transition-all duration-200 ${
                    activeTab === 'query'
                      ? 'border-primary-500 text-primary-600 bg-white rounded-t-lg'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-100/50'
                  } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Query Interface
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  disabled={!isConnected}
                  className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center transition-all duration-200 ${
                    activeTab === 'history'
                      ? 'border-primary-500 text-primary-600 bg-white rounded-t-lg'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-100/50'
                  } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <History className="h-4 w-4 mr-2" />
                  Query History
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

              {activeTab === 'history' && isConnected && (
                <div className="space-y-6">
                  {/* Query History */}
                  <QueryHistory 
                    onQuerySelect={handleQuerySelect}
                    onClearHistory={handleClearHistory}
                  />
                </div>
              )}

              {!isConnected && activeTab !== 'connection' && (
                <div className="text-center py-16 animate-fade-in">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gray-200 rounded-3xl blur-2xl opacity-30"></div>
                    <Database className="relative h-20 w-20 text-gray-400 mx-auto" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">Connect to Database First</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                    Please establish a database connection to access this feature and start querying your data.
                  </p>
                  <button
                    onClick={() => setActiveTab('connection')}
                    className="btn-primary px-8 py-3 text-base"
                  >
                    <Database className="h-5 w-5 mr-2" />
                    Go to Connection
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <div className="floating-card p-8 text-center group animate-fade-in hover:scale-105 transition-all duration-500">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
              <div className="relative bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/20 group-hover:border-primary-200/50 transition-all duration-300">
                <Search className="h-12 w-12 text-primary-600 mx-auto" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-4 gradient-text">Natural Language</h3>
            <p className="text-gray-600 leading-relaxed">
              Ask questions in plain English and get MongoDB queries automatically generated with AI intelligence.
            </p>
          </div>
          
          <div className="floating-card p-8 text-center group animate-fade-in hover:scale-105 transition-all duration-500" style={{ animationDelay: '0.1s' }}>
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-success-400 to-success-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
              <div className="relative bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/20 group-hover:border-success-200/50 transition-all duration-300">
                <BarChart3 className="h-12 w-12 text-success-600 mx-auto" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-4 gradient-text">Smart Analytics</h3>
            <p className="text-gray-600 leading-relaxed">
              Get intelligent chart suggestions and data visualizations for your results with advanced analytics.
            </p>
          </div>
          
          <div className="floating-card p-8 text-center group animate-fade-in hover:scale-105 transition-all duration-500" style={{ animationDelay: '0.2s' }}>
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-warning-400 to-warning-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
              <div className="relative bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/20 group-hover:border-warning-200/50 transition-all duration-300">
                <Table className="h-12 w-12 text-warning-600 mx-auto" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-4 gradient-text">Safe Queries</h3>
            <p className="text-gray-600 leading-relaxed">
              All queries are read-only and safe, with built-in privacy protection and security measures.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
