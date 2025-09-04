/**
 * API Request Debugging Utility
 * Tracks and logs API request patterns to help identify excessive calls
 */

interface RequestLog {
  url: string;
  method: string;
  timestamp: number;
  stackTrace: string;
  component?: string;
}

class APIDebugger {
  private logs: RequestLog[] = [];
  private maxLogs = 1000;
  
  // Track request frequency
  private requestCounts = new Map<string, number>();
  private requestTimestamps = new Map<string, number[]>();
  
  public logRequest(url: string, method: string, component?: string) {
    const timestamp = Date.now();
    const stackTrace = this.getStackTrace();
    
    const log: RequestLog = {
      url,
      method,
      timestamp,
      stackTrace,
      component
    };
    
    this.logs.push(log);
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    // Track frequency
    const key = `${method} ${url}`;
    this.requestCounts.set(key, (this.requestCounts.get(key) || 0) + 1);
    
    // Track timestamps for this endpoint
    const timestamps = this.requestTimestamps.get(key) || [];
    timestamps.push(timestamp);
    
    // Keep only last 100 timestamps
    if (timestamps.length > 100) {
      timestamps.splice(0, timestamps.length - 100);
    }
    this.requestTimestamps.set(key, timestamps);
    
    // Check for excessive requests
    this.checkForExcessiveRequests(key, timestamps);
  }
  
  private getStackTrace(): string {
    try {
      throw new Error();
    } catch (e) {
      return (e as Error).stack?.split('\n').slice(2, 8).join('\n') || '';
    }
  }
  
  private checkForExcessiveRequests(key: string, timestamps: number[]) {
    const now = Date.now();
    const oneMinuteAgo = now - 60000; // 1 minute
    const oneSecondAgo = now - 1000; // 1 second
    
    // Count requests in the last minute
    const recentRequests = timestamps.filter(t => t > oneMinuteAgo);
    const veryRecentRequests = timestamps.filter(t => t > oneSecondAgo);
    
    // Alert for excessive requests
    if (veryRecentRequests.length > 5) {
      console.error(`🚨 EXCESSIVE REQUESTS DETECTED: ${key} - ${veryRecentRequests.length} requests in the last second!`);
      console.group('Recent requests details:');
      this.logs
        .filter(log => `${log.method} ${log.url}` === key && log.timestamp > oneSecondAgo)
        .forEach((log, index) => {
          console.log(`${index + 1}. ${new Date(log.timestamp).toISOString()}`);
          console.log(`   Component: ${log.component || 'Unknown'}`);
          console.log(`   Stack trace:\n${log.stackTrace}`);
        });
      console.groupEnd();
    } else if (recentRequests.length > 20) {
      console.warn(`⚠️ High request volume: ${key} - ${recentRequests.length} requests in the last minute`);
    }
  }
  
  public getRequestSummary() {
    const summary = Array.from(this.requestCounts.entries())
      .map(([key, count]) => ({
        endpoint: key,
        totalCount: count,
        recentCount: this.getRecentRequestCount(key, 60000) // Last minute
      }))
      .sort((a, b) => b.totalCount - a.totalCount);
    
    return summary;
  }
  
  private getRecentRequestCount(key: string, timeWindow: number): number {
    const timestamps = this.requestTimestamps.get(key) || [];
    const cutoff = Date.now() - timeWindow;
    return timestamps.filter(t => t > cutoff).length;
  }
  
  public exportLogs(): RequestLog[] {
    return [...this.logs];
  }
  
  public clearLogs() {
    this.logs = [];
    this.requestCounts.clear();
    this.requestTimestamps.clear();
  }
  
  public printSummary() {
    console.group('📊 API Request Summary');
    const summary = this.getRequestSummary();
    
    console.table(summary);
    
    if (summary.some(s => s.recentCount > 10)) {
      console.warn('⚠️ Some endpoints have high recent activity. Check for potential infinite loops.');
    }
    
    console.groupEnd();
  }
}

// Global instance
export const apiDebugger = new APIDebugger();

// Monkey patch fetch to auto-track requests
const originalFetch = window.fetch;
window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
  const url = typeof input === 'string' ? input : input.toString();
  const method = init?.method || 'GET';
  
  // Extract component name from stack trace
  const stack = new Error().stack || '';
  const componentMatch = stack.match(/at \w+ \((.*?)\/([^\/]+\.tsx?):/);
  const component = componentMatch ? componentMatch[2] : undefined;
  
  apiDebugger.logRequest(url, method, component);
  
  return originalFetch.call(this, input, init);
};

// Auto-print summary every 30 seconds in development
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const summary = apiDebugger.getRequestSummary();
    if (summary.length > 0 && summary.some(s => s.recentCount > 0)) {
      apiDebugger.printSummary();
    }
  }, 30000);
}

// Global access for debugging
(window as any).apiDebugger = apiDebugger;