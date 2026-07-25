import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`ErrorBoundary caught an error in ${this.props.moduleName}:`, error, errorInfo);
  }

  handleReset() {
    this.setState({ hasError: false });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="border border-red-900/80 bg-red-950/30 p-4 rounded text-center">
          <p className="text-xs text-red-400 font-mono mb-2">MODULE_RENDER_EXCEPT: {this.props.moduleName}</p>
          <button onClick={this.handleReset} className="px-3 py-1 bg-red-900/60 hover:bg-red-800 text-red-200 text-xs font-mono rounded border border-red-700">
            REBOOT MODULE
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
