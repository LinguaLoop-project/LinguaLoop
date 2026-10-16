import { Component, type ErrorInfo, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import ErrorState from "./ErrorState";

interface BoundaryProps {
  children: ReactNode;
  /** Đổi giá trị này (vd đường dẫn) thì xoá lỗi và thử hiển thị lại. */
  resetKey: string;
}

class Boundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Lỗi hiển thị trang:", error, info.componentStack);
  }

  componentDidUpdate(prev: BoundaryProps) {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="py-10">
          <ErrorState kind="server" code="UI-RENDER" onRetry={() => this.setState({ failed: false })} />
        </div>
      );
    }
    return this.props.children;
  }
}

/** Ranh giới lỗi cấp route: lỗi khi dựng một trang không làm cả màn hình trắng; chuyển trang thì tự thử lại. */
export default function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return <Boundary resetKey={pathname}>{children}</Boundary>;
}
