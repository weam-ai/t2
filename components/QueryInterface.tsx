'use client';

import { useState } from 'react';
import { Search, Send, Loader2 } from 'lucide-react';

interface QueryInterfaceProps {
  onQuery: (query: string) => void;
  loading: boolean;
}

export function QueryInterface({ onQuery, loading }: QueryInterfaceProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onQuery(query.trim());
    }
  };

  const exampleQueries = [
    "Show me the top 10 drivers by revenue",
    "What are the total sales for each city?",
    "Find drivers in Mumbai with pending payments",
    "Which month had the highest revenue?",
    "Show me the average invoice amount by driver"
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold mb-4 flex items-center">
        <Search className="h-6 w-6 mr-2 text-blue-600" />
        Ask Your Question
      </h2>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Show me the top 10 drivers by revenue"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </form>

      <div>
        <h3 className="text-lg font-medium mb-3 text-gray-700">Example Queries:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {exampleQueries.map((example, index) => (
            <button
              key={index}
              onClick={() => setQuery(example)}
              className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
              disabled={loading}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
