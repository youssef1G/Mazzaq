/**
 * Wrapped-in root-level pages have no shell of their own yet; while the
 * localized layout streams in we show a quiet atelier-branded loading note
 * instead of a blank screen.
 */
export default function LocaleLoading() {
  return (
    <div className="route-loading" aria-hidden>
      <span className="route-loading-mark">✳</span>
    </div>
  );
}
