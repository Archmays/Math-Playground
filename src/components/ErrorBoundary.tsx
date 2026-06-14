import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false
  };

  static getDerivedStateFromError(_error: unknown): ErrorBoundaryState {
    return {
      hasError: true
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Math Playground render error", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <ErrorBoundaryFallback
            title="页面显示遇到问题"
            message="请刷新页面，或清空本地保存后重试。"
          />
        )
      );
    }

    return this.props.children;
  }
}

export function ErrorBoundaryFallback({
  title,
  message
}: {
  title: string;
  message: string;
}) {
  return (
    <section className="error-boundary-fallback" role="alert">
      <h2>{title}</h2>
      <p>{message}</p>
    </section>
  );
}
