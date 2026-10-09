const LoadingScreen = () => (
  <div
    className="flex min-h-screen items-center justify-center"
    role="status"
    aria-label="Đang tải"
  >
    <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
  </div>
);

export default LoadingScreen;
