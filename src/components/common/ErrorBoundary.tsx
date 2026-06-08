import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  fallback?: ReactNode;
  /** Label used in the default fallback (e.g. "Operations map"). */
  label?: string;
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

/** Local render guard so one failing panel (e.g. a WebGL context loss) never blanks the wall. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[${this.props.label ?? 'panel'}] render error`, error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="cg-panel flex h-full items-center justify-center p-6 text-center text-mute">
            <div>
              <div className="cg-label mb-1">{this.props.label ?? 'Panel'}</div>
              <div className="text-sm">Temporarily unavailable</div>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
