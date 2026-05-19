export function AuroraBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="aurora-blob aurora-blob-emerald" />
      <div className="aurora-blob aurora-blob-navy" />
      <div className="aurora-blob aurora-blob-deep" />
      <div className="aurora-grain" />
      <div className="aurora-vignette" />
    </div>
  );
}
