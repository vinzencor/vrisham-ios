import React, { useState } from 'react';
import { Search, CheckCircle, XCircle, AlertCircle, Loader2, Play } from 'lucide-react';
import { testAlgoliaConnection, getSearchSuggestions, SearchSuggestion } from '../services/algoliaService';
import { SearchIntegrationTester, TestResult } from '../utils/searchIntegrationTest';

interface QuickTestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  data?: any;
}

export function AlgoliaTestPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [quickTestResults, setQuickTestResults] = useState<QuickTestResult[]>([]);
  const [integrationTestResults, setIntegrationTestResults] = useState<TestResult[]>([]);
  const [isRunningQuick, setIsRunningQuick] = useState(false);
  const [isRunningIntegration, setIsRunningIntegration] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchSuggestion[]>([]);

  const runQuickTests = async () => {
    setIsRunningQuick(true);
    setQuickTestResults([]);

    const tests: QuickTestResult[] = [
      { test: 'Algolia Connection', status: 'pending', message: 'Testing connection...' },
      { test: 'Search Functionality', status: 'pending', message: 'Testing search...' },
      { test: 'Fallback Mechanism', status: 'pending', message: 'Testing fallback...' }
    ];

    setQuickTestResults([...tests]);

    // Test 1: Connection
    try {
      const connectionResult = await testAlgoliaConnection();
      tests[0] = {
        test: 'Algolia Connection',
        status: connectionResult ? 'success' : 'error',
        message: connectionResult ? 'Connection successful' : 'Connection failed'
      };
      setQuickTestResults([...tests]);
    } catch (error) {
      tests[0] = {
        test: 'Algolia Connection',
        status: 'error',
        message: `Connection error: ${error.message}`
      };
      setQuickTestResults([...tests]);
    }

    // Test 2: Search functionality
    try {
      const searchResults = await getSearchSuggestions('organic');
      tests[1] = {
        test: 'Search Functionality',
        status: 'success',
        message: `Found ${searchResults.length} results for "organic"`,
        data: searchResults.slice(0, 3) // Show first 3 results
      };
      setQuickTestResults([...tests]);
    } catch (error) {
      tests[1] = {
        test: 'Search Functionality',
        status: 'error',
        message: `Search error: ${error.message}`
      };
      setQuickTestResults([...tests]);
    }

    // Test 3: Fallback mechanism (simulate Algolia failure)
    try {
      // This will test the fallback by trying a search that might fail
      const fallbackResults = await getSearchSuggestions('test_fallback_query_12345');
      tests[2] = {
        test: 'Fallback Mechanism',
        status: 'success',
        message: `Fallback working - found ${fallbackResults.length} results`
      };
      setQuickTestResults([...tests]);
    } catch (error) {
      tests[2] = {
        test: 'Fallback Mechanism',
        status: 'error',
        message: `Fallback error: ${error.message}`
      };
      setQuickTestResults([...tests]);
    }

    setIsRunningQuick(false);
  };

  const runIntegrationTests = async () => {
    setIsRunningIntegration(true);
    setIntegrationTestResults([]);

    try {
      const tester = new SearchIntegrationTester();
      const results = await tester.runAllTests();
      setIntegrationTestResults(results);
    } catch (error) {
      console.error('Integration tests failed:', error);
    } finally {
      setIsRunningIntegration(false);
    }
  };

  const testSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const results = await getSearchSuggestions(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search test error:', error);
      setSearchResults([]);
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-primary text-white p-3 rounded-full shadow-lg hover:bg-primary/90 transition-colors z-50"
        title="Test Algolia Search"
      >
        <Search className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Algolia Search Test Panel</h2>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Test Runners */}
          <div className="mb-6 flex gap-3">
            <button
              onClick={runQuickTests}
              disabled={isRunningQuick}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
            >
              {isRunningQuick ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {isRunningQuick ? 'Running...' : 'Quick Tests'}
            </button>
            <button
              onClick={runIntegrationTests}
              disabled={isRunningIntegration}
              className="bg-secondary text-white px-4 py-2 rounded-lg hover:bg-secondary/90 disabled:opacity-50 flex items-center gap-2"
            >
              {isRunningIntegration ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {isRunningIntegration ? 'Running...' : 'Full Integration Tests'}
            </button>
          </div>

          {/* Quick Test Results */}
          {quickTestResults.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Quick Test Results:</h3>
              <div className="space-y-3">
                {quickTestResults.map((result, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    {result.status === 'pending' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin mt-0.5" />}
                    {result.status === 'success' && <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />}
                    {result.status === 'error' && <XCircle className="w-5 h-5 text-red-500 mt-0.5" />}
                    <div className="flex-1">
                      <div className="font-medium">{result.test}</div>
                      <div className="text-sm text-gray-600">{result.message}</div>
                      {result.data && (
                        <div className="mt-2 text-xs bg-gray-50 p-2 rounded">
                          <pre>{JSON.stringify(result.data, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Integration Test Results */}
          {integrationTestResults.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Integration Test Results:</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {integrationTestResults.map((result, index) => (
                  <div key={index} className="flex items-start gap-3 p-2 border rounded text-sm">
                    {result.status === 'pass' && <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />}
                    {result.status === 'fail' && <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />}
                    {result.status === 'warning' && <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />}
                    <div className="flex-1">
                      <div className="font-medium">{result.testName}</div>
                      <div className="text-gray-600">{result.message}</div>
                      {result.duration && (
                        <div className="text-xs text-gray-400">{result.duration}ms</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manual Search Test */}
          <div>
            <h3 className="font-semibold mb-3">Manual Search Test:</h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter search query..."
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                onKeyDown={(e) => e.key === 'Enter' && testSearch()}
              />
              <button
                onClick={testSearch}
                className="bg-secondary text-white px-4 py-2 rounded-lg hover:bg-secondary/90"
              >
                Search
              </button>
            </div>
            
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 border rounded">
                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                      {result.image ? (
                        <img src={result.image} alt={result.name} className="w-full h-full object-cover rounded" />
                      ) : (
                        <Search className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{result.name}</div>
                      <div className="text-xs text-gray-500">{result.category}</div>
                    </div>
                    <div className="text-sm font-semibold text-primary">₹{result.price}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
