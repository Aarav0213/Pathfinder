import React from "react";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {}

  render() {
    if (this.state.hasError) {
      return (
        <div className="page-shell flex min-h-screen items-center justify-center px-4">
          <div className="card max-w-md p-8 text-center">
            <h1 className="text-2xl font-bold text-slate-900">Something went wrong</h1>
            <p className="mt-3 text-slate-600">The page crashed while rendering. Please try again.</p>
            <button
              className="button-primary mt-6 w-full"
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
