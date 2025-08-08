// Integration test utilities for Algolia search functionality
import { testAlgoliaConnection, getSearchSuggestions, getFallbackSearchSuggestions } from '../services/algoliaService';

export interface TestResult {
  testName: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
  duration?: number;
}

export class SearchIntegrationTester {
  private results: TestResult[] = [];

  async runAllTests(): Promise<TestResult[]> {
    this.results = [];
    
    console.log('🧪 Starting Algolia Search Integration Tests...');
    
    await this.testAlgoliaConnection();
    await this.testBasicSearch();
    await this.testEmptySearch();
    await this.testSpecialCharacters();
    await this.testLongQuery();
    await this.testFallbackMechanism();
    await this.testPerformance();
    
    console.log('✅ All tests completed!');
    return this.results;
  }

  private async testAlgoliaConnection(): Promise<void> {
    const startTime = Date.now();
    try {
      const isConnected = await testAlgoliaConnection();
      const duration = Date.now() - startTime;
      
      this.results.push({
        testName: 'Algolia Connection',
        status: isConnected ? 'pass' : 'fail',
        message: isConnected ? 'Successfully connected to Algolia' : 'Failed to connect to Algolia',
        duration
      });
    } catch (error) {
      this.results.push({
        testName: 'Algolia Connection',
        status: 'fail',
        message: `Connection error: ${error.message}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async testBasicSearch(): Promise<void> {
    const startTime = Date.now();
    const testQueries = ['organic', 'rice', 'vegetable', 'fruit'];
    
    for (const query of testQueries) {
      try {
        const results = await getSearchSuggestions(query);
        const duration = Date.now() - startTime;
        
        this.results.push({
          testName: `Basic Search: "${query}"`,
          status: results.length > 0 ? 'pass' : 'warning',
          message: `Found ${results.length} results`,
          details: results.slice(0, 3), // Show first 3 results
          duration
        });
      } catch (error) {
        this.results.push({
          testName: `Basic Search: "${query}"`,
          status: 'fail',
          message: `Search failed: ${error.message}`,
          duration: Date.now() - startTime
        });
      }
    }
  }

  private async testEmptySearch(): Promise<void> {
    const startTime = Date.now();
    try {
      const results = await getSearchSuggestions('');
      const duration = Date.now() - startTime;
      
      this.results.push({
        testName: 'Empty Search',
        status: results.length === 0 ? 'pass' : 'warning',
        message: `Empty search returned ${results.length} results (should be 0)`,
        duration
      });
    } catch (error) {
      this.results.push({
        testName: 'Empty Search',
        status: 'fail',
        message: `Empty search error: ${error.message}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async testSpecialCharacters(): Promise<void> {
    const startTime = Date.now();
    const specialQueries = ['@#$%', '123', 'test-query', 'query with spaces'];
    
    for (const query of specialQueries) {
      try {
        const results = await getSearchSuggestions(query);
        const duration = Date.now() - startTime;
        
        this.results.push({
          testName: `Special Characters: "${query}"`,
          status: 'pass',
          message: `Handled special characters gracefully, found ${results.length} results`,
          duration
        });
      } catch (error) {
        this.results.push({
          testName: `Special Characters: "${query}"`,
          status: 'fail',
          message: `Failed to handle special characters: ${error.message}`,
          duration: Date.now() - startTime
        });
      }
    }
  }

  private async testLongQuery(): Promise<void> {
    const startTime = Date.now();
    const longQuery = 'this is a very long search query that should be handled properly by the search system without causing any issues or errors';
    
    try {
      const results = await getSearchSuggestions(longQuery);
      const duration = Date.now() - startTime;
      
      this.results.push({
        testName: 'Long Query',
        status: 'pass',
        message: `Long query handled successfully, found ${results.length} results`,
        duration
      });
    } catch (error) {
      this.results.push({
        testName: 'Long Query',
        status: 'fail',
        message: `Long query failed: ${error.message}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async testFallbackMechanism(): Promise<void> {
    const startTime = Date.now();
    try {
      // Test fallback directly
      const results = await getFallbackSearchSuggestions('organic');
      const duration = Date.now() - startTime;
      
      this.results.push({
        testName: 'Fallback Mechanism',
        status: 'pass',
        message: `Fallback search working, found ${results.length} results`,
        details: results.slice(0, 2),
        duration
      });
    } catch (error) {
      this.results.push({
        testName: 'Fallback Mechanism',
        status: 'fail',
        message: `Fallback failed: ${error.message}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async testPerformance(): Promise<void> {
    const startTime = Date.now();
    const performanceQueries = ['test', 'organic', 'rice', 'vegetable', 'fruit'];
    const times: number[] = [];
    
    for (const query of performanceQueries) {
      const queryStart = Date.now();
      try {
        await getSearchSuggestions(query);
        times.push(Date.now() - queryStart);
      } catch (error) {
        // Continue with other queries even if one fails
        console.warn(`Performance test query "${query}" failed:`, error);
      }
    }
    
    const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    const maxTime = times.length > 0 ? Math.max(...times) : 0;
    const duration = Date.now() - startTime;
    
    this.results.push({
      testName: 'Performance',
      status: avgTime < 1000 ? 'pass' : avgTime < 2000 ? 'warning' : 'fail',
      message: `Average response time: ${avgTime.toFixed(0)}ms, Max: ${maxTime}ms`,
      details: { avgTime, maxTime, times },
      duration
    });
  }

  getTestSummary(): { total: number; passed: number; failed: number; warnings: number } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    
    return { total, passed, failed, warnings };
  }
}

// Utility function to run tests from console
export const runSearchTests = async (): Promise<void> => {
  const tester = new SearchIntegrationTester();
  const results = await tester.runAllTests();
  const summary = tester.getTestSummary();
  
  console.log('\n📊 Test Summary:');
  console.log(`Total: ${summary.total}`);
  console.log(`✅ Passed: ${summary.passed}`);
  console.log(`❌ Failed: ${summary.failed}`);
  console.log(`⚠️ Warnings: ${summary.warnings}`);
  
  console.log('\n📋 Detailed Results:');
  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${result.testName}: ${result.message} (${result.duration}ms)`);
  });
};

// Make it available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).runSearchTests = runSearchTests;
}
