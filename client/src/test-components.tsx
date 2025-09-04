import React from 'react';

// Test basic React functionality
function TestComponent() {
  const [count, setCount] = React.useState(0);
  const ref = React.useRef(null);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Click me</button>
      <div ref={ref}>Test ref</div>
    </div>
  );
}

export default TestComponent;