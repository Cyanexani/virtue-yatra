import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Toaster } from "@/components/ui/toaster"

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("GLOBAL CRASH:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', background: '#fee', color: '#900', fontFamily: 'monospace' }}>
          <h2>React App Crashed!</h2>
          <p>{this.state.error && this.state.error.toString()}</p>
          <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
      <Toaster />
    </GlobalErrorBoundary>
  </React.StrictMode>,
);
