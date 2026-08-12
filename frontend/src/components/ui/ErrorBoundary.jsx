import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card glass" style={{ borderColor: 'var(--red)', marginTop: '24px' }}>
          <h2 style={{ color: 'var(--red)' }}>Something went wrong.</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button 
            className="btn btn-primary" 
            style={{ marginTop: '16px' }}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
