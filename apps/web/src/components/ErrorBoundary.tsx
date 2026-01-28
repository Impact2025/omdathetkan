import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  handleRefresh = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">💔</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Er is iets misgegaan
            </h1>
            <p className="text-gray-600 mb-6">
              Sorry, er is een onverwachte fout opgetreden. Probeer de pagina te vernieuwen.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 rounded-lg text-left">
                <p className="text-sm font-mono text-red-700 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRefresh}
                className="px-6 py-3 bg-primary-500 text-white rounded-full font-medium hover:bg-primary-600 transition-colors"
              >
                Pagina vernieuwen
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors"
              >
                Naar home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
