'use client';

import { useState } from 'react';
import { BarChart3, Table, Code, AlertCircle, CheckCircle } from 'lucide-react';
import { DataTable } from './DataTable';
import { PipelineViewer } from './PipelineViewer';

interface ResultsDisplayProps {
  results: any;
}

export function ResultsDisplay({ results }: ResultsDisplayProps) {
  const [activeTab, setActiveTab] = useState('answer');

  const tabs = [
    { id: 'answer', label: 'Answer', icon: CheckCircle },
    { id: 'data', label: 'Data', icon: Table },
    { id: 'pipeline', label: 'Pipeline', icon: Code },
    { id: 'charts', label: 'Charts', icon: BarChart3 },
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">Query Results</h2>
          <div className="flex items-center text-sm text-gray-500">
            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
            Query executed successfully
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'answer' && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">Answer</h3>
              <p className="text-green-700">{results.final_answer}</p>
            </div>
            
            {results.assumptions && results.assumptions.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">Assumptions</h3>
                <ul className="list-disc list-inside text-yellow-700">
                  {results.assumptions.map((assumption: string, index: number) => (
                    <li key={index}>{assumption}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'data' && (
          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Data Results</h3>
            {results.query_result?.success ? (
              <DataTable 
                data={results.query_result.data} 
                columns={results.columns}
              />
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-700">
                    Error executing query: {results.query_result?.error || 'Unknown error'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'pipeline' && (
          <div>
            <h3 className="font-semibold text-gray-800 mb-4">MongoDB Aggregation Pipeline</h3>
            <PipelineViewer 
              pipeline={results.pipeline}
              baseCollection={results.base_collection}
            />
          </div>
        )}

        {activeTab === 'charts' && (
          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Chart Suggestions</h3>
            {results.chart_suggestions && results.chart_suggestions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.chart_suggestions.map((chart: any, index: number) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">{chart.title}</h4>
                    <p className="text-sm text-gray-600">
                      Type: {chart.type}
                      {chart.x && ` | X-axis: ${chart.x}`}
                      {chart.y && ` | Y-axis: ${chart.y}`}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No chart suggestions available</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
