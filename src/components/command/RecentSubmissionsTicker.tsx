import { clsx } from 'clsx';
import type { DisplayOverview } from '@/types/display';
import { ClipboardCheck, Wrench, Boxes } from '@/components/common/icons';
import type { ReactNode } from 'react';

interface Props {
  snapshot?: DisplayOverview;
  reducedMotion?: boolean;
  className?: string;
}

interface Item {
  icon: ReactNode;
  text: string;
  tone: string;
}

/**
 * Activity strip derived from real snapshot signals (checkouts, defects, supply). Not a
 * fabricated feed — every line maps to a number in the current snapshot.
 */
export function RecentSubmissionsTicker({ snapshot, reducedMotion, className }: Props) {
  const items = buildItems(snapshot);
  if (items.length === 0) return null;

  const Row = (
    <>
      {items.map((it, i) => (
        <span key={i} className="inline-flex items-center gap-2 text-[13px]">
          <span className={it.tone}>{it.icon}</span>
          <span className="text-mute">{it.text}</span>
          <span className="text-faint">•</span>
        </span>
      ))}
    </>
  );

  return (
    <div className={clsx('cg-panel cg-ticker px-4 py-1.5', className)}>
      {reducedMotion ? (
        <div className="flex flex-wrap gap-x-6 gap-y-1">{Row}</div>
      ) : (
        <div className="cg-ticker__track">
          {Row}
          {Row}
        </div>
      )}
    </div>
  );
}

function buildItems(snapshot?: DisplayOverview): Item[] {
  if (!snapshot) return [];
  const items: Item[] = [];
  const s = snapshot.submissions;
  if (s) {
    items.push({ icon: <ClipboardCheck size={14} />, text: `${s.inspections.today} apparatus checkouts today`, tone: 'text-ready' });
    if (s.inspections.pending_review)
      items.push({ icon: <ClipboardCheck size={14} />, text: `${s.inspections.pending_review} inspections pending review`, tone: 'text-attention' });
    if (s.inventory.stations_missing_today)
      items.push({ icon: <Boxes size={14} />, text: `${s.inventory.stations_missing_today} stations missing today's inventory`, tone: 'text-attention' });
  }
  for (const d of (snapshot.defects?.items ?? []).slice(0, 6)) {
    const unit = d.unit && d.unit !== 'Unknown' ? d.unit : null;
    const item = d.item ?? 'item';
    const state = (d.status ?? '').toLowerCase();
    items.push({
      icon: <Wrench size={14} />,
      text: `${unit ? `${unit} · ` : ''}${item}${state ? ` ${state}` : ''}${d.days_open ? ` (${d.days_open}d)` : ''}`,
      tone: state === 'missing' ? 'text-critical' : 'text-attention',
    });
  }
  for (const inv of (snapshot.inventory_exceptions?.items ?? []).slice(0, 5)) {
    if (!inv.name) continue;
    items.push({
      icon: <Boxes size={14} />,
      text: `${inv.name} — ${inv.stock}/${inv.reorder_min} (${inv.status === 'critical' ? 'out' : 'low'})`,
      tone: inv.status === 'critical' ? 'text-critical' : 'text-attention',
    });
  }
  return items;
}
