import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-light p-4">
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
            <h1 className="text-2xl font-bold text-danger mb-4">Something went wrong</h1>
            <p className="text-neutral-dark mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Reload Page
            </button>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-neutral-dark">Error Details</summary>
              <pre className="mt-2 text-xs bg-neutral-light p-2 rounded overflow-auto">
                {this.state.error?.stack}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;



