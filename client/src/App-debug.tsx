// Ultra-minimal React app for debugging
import * as React from 'react';

function App() {
  console.log('React object:', React);
  console.log('React.useRef:', React.useRef);
  console.log('React.useState:', React.useState);
  
  // Test if React hooks work with explicit imports
  const [count, setCount] = React.useState(0);
  
  // Try different ref approaches
  let testRef;
  try {
    testRef = React.useRef(null);
  } catch (error) {
    console.error('useRef error:', error);
    testRef = null;
  }
  
  return (
    <div>
      <h1>Debug Test - Working!</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Test Button</button>
      <div ref={testRef}>Test Ref Element</div>
    </div>
  );
}

export default App;