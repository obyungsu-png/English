import { Component, ReactNode } from "react";

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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "40px",
            fontFamily: "sans-serif",
            maxWidth: "700px",
            margin: "40px auto",
          }}
        >
          <h1 style={{ color: "#dc2626", fontSize: "24px", marginBottom: "16px" }}>
            Something went wrong
          </h1>
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "16px",
            }}
          >
            <p style={{ color: "#991b1b", fontWeight: 600, marginBottom: "8px" }}>
              {this.state.error?.message}
            </p>
            <pre
              style={{
                color: "#7f1d1d",
                fontSize: "12px",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                maxHeight: "300px",
                overflow: "auto",
              }}
            >
              {this.state.error?.stack}
            </pre>
          </div>
          <p style={{ color: "#6b7280", fontSize: "14px" }}>
            BASE_URL: {import.meta.env.BASE_URL || "(empty)"}
            <br />
            Location: {window.location.href}
            <br />
            Pathname: {window.location.pathname}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "16px",
              padding: "8px 16px",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
