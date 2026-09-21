import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null; info: string };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: "" };

  static getDerivedStateFromError(error: Error): State {
    return { error, info: "" };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Render crash:", error, info.componentStack);
    this.setState({ error, info: info.componentStack ?? "" });
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0B0E12",
          color: "#E8E6E1",
          padding: 24,
          fontFamily: "monospace",
        }}
      >
        <h2 style={{ color: "#F87171", marginBottom: 12 }}>App crashed while rendering</h2>
        <pre style={{ whiteSpace: "pre-wrap", color: "#FBBF24" }}>
          {this.state.error.message}
        </pre>
        <pre style={{ whiteSpace: "pre-wrap", color: "#9BA0A8", marginTop: 16, fontSize: 12 }}>
          {this.state.error.stack}
        </pre>
        <pre style={{ whiteSpace: "pre-wrap", color: "#6B727C", marginTop: 16, fontSize: 12 }}>
          {this.state.info}
        </pre>
      </div>
    );
  }
}