// Page footer — used on every dashboard route for connective tissue.
// Shows entity + page identifier in mono, separated by a hairline.

type Props = {
  pageId?: string; // e.g. "/money", "/pipeline"
};

export function AppFooter({ pageId }: Props) {
  return (
    <footer className="mt-20 pt-7 border-t border-rule flex items-center justify-between text-[11px] font-mono text-ink-faint">
      <span className="tracking-wider">
        Airvues LLC <span className="text-ink-faint/50 mx-2">·</span> EIN 39-3045812{" "}
        <span className="text-ink-faint/50 mx-2">·</span> Sacramento, CA
      </span>
      <span className="tracking-wider">
        ops.airvues.com{pageId ? <span className="text-ink-faint/70">{pageId}</span> : null}
      </span>
    </footer>
  );
}
