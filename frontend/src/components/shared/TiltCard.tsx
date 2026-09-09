import type { ReactNode } from "react";

/**
 * A plain wrapper, kept for the pages that still import it.
 *
 * It used to tilt: 17.5 degrees of rotation tracked to the pointer, with the
 * content pushed 75px toward the viewer on its own transform layer. Every
 * panel on the site did it — pricing, features, research, the mudra detail
 * photograph — so the whole page wobbled under the cursor and nothing sat
 * still long enough to be read. It also put a `preserve-3d` context around
 * arbitrary content, which quietly breaks `position: fixed` and `overflow`
 * inside it.
 *
 * Left as a passthrough rather than deleted so the pages that use it keep
 * working; the layout they express through it is still correct.
 */
export default function TiltCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
