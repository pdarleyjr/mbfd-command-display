import { clsx } from 'clsx';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  fallback?: ReactNode;
  /** Label used in the default fallback (e.g. "Operations map"). */
  label?: string;
  /**
   * When set, the boundary renders a wrapper element with this class so it can BE a grid
   * item (carrying a grid-area). Both the children and the error fallback fill it.
   */
  className?: string;
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
    const inner: ReactNode = this.state.hasError
      ? (this.props.fallback ?? (
          <div className="cg-panel flex h-full items-center justify-center p-6 text-center text-mute">
            <div>
              <div className="cg-label mb-1">{this.props.label ?? 'Panel'}</div>
              <div className="text-sm">Temporarily unavailable</div>
            </div>
          </div>
        ))
      : this.props.children;

    // If a class is provided, wrap so this boundary is the placed grid item.
    if (this.props.className) {
      return <div className={clsx('min-h-0 min-w-0', this.props.className)}>{inner}</div>;
    }
    return inner;
  }
}
