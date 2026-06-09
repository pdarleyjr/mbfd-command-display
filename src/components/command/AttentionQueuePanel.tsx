import { GlassPanel } from '@/components/common/GlassPanel';
import { EmptyState } from '@/components/common/EmptyState';
import { AlertTriangle, Boxes, Truck, Wrench } from '@/components/common/icons';
import type { DefectItem, DisplayOverview, InventoryExceptionItem } from '@/types/display';
import type { ReactNode } from 'react';

interface Props {
  defects?: DefectItem[];
  totalOpen?: number;
  criticalMissing?: number;
  requests?: DisplayOverview['requests'];
  inventory?: DisplayOverview['inventory_exceptions'];
  className?: string;
}

interface AttentionItem {
  key: string;
  tone: 'critical' | 'attention' | 'info';
  label: string;
  meta: string;
  icon: ReactNode;
}

export function AttentionQueuePanel({ defects, totalOpen, criticalMissing, requests, inventory, className }: Props) {
  const requestCount =
    (requests?.fire_equipment?.pending ?? 0) +
    (requests?.big_ticket?.outstanding ?? 0) +
    (requests?.employee_equipment?.pending ?? 0);
  const items = buildItems(defects ?? [], inventory?.items ?? [], requestCount);
  const total = (totalOpen ?? defects?.length ?? 0) + requestCount + (inventory?.out_of_stock ?? 0) + (inventory?.low_stock ?? 0);

  return (
    <GlassPanel
      label="Attention Queue"
      icon={<AlertTriangle size={15} />}
      className={className}
      tone={(criticalMissing ?? 0) > 0 ? 'attention' : 'flat'}
      bodyClassName="min-h-0 overflow-hidden"
      right={
        <span className="text-[11px] uppercase tracking-wider text-faint">
          <span className={(criticalMissing ?? 0) > 0 ? 'tnum text-critical' : 'tnum text-attention'}>{total}</span> open
        </span>
      }
    >
      {items.length === 0 ? (
        <EmptyState icon={<AlertTriangle size={22} />} title="No open attention items" hint="Requests, defects, and inventory exceptions are clear" />
      ) : (
        <ul className="cg-scroll-y h-full min-h-0 space-y-1.5 pr-1">
          {items.slice(0, 10).map((item) => (
            <li key={item.key} className="flex min-w-0 items-center gap-3 rounded-lg bg-[color:var(--c-surface-2)] px-3 py-2">
              <span className={`grid h-8 w-8 shrink-0 place-content-center rounded-md ${toneBg(item.tone)} ${toneText(item.tone)}`}>{item.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-ink">{item.label}</div>
                <div className="truncate text-[12px] text-mute">{item.meta}</div>
              </div>
              <span className={`cg-status ${statusClass(item.tone)}`}>{item.tone}</span>
            </li>
          ))}
        </ul>
      )}
    </GlassPanel>
  );
}

function buildItems(defects: DefectItem[], inventory: InventoryExceptionItem[], requestCount: number): AttentionItem[] {
  const defectItems = defects.map((defect, index) => ({
    key: `defect-${index}-${defect.unit ?? 'unit'}-${defect.item ?? 'item'}`,
    tone: /missing|critical/i.test(`${defect.status} ${defect.item}`) ? 'critical' : 'attention',
    label: defect.item ?? 'Apparatus defect',
    meta: `${defect.unit ?? 'Unit'} · ${defect.status ?? 'Open'}${defect.days_open ? ` · ${defect.days_open}d open` : ''}`,
    icon: <Wrench size={15} />,
  })) satisfies AttentionItem[];

  const inventoryItems = inventory.map((item, index) => ({
    key: `inventory-${index}-${item.name}`,
    tone: item.status === 'critical' ? 'critical' : 'attention',
    label: item.name,
    meta: `${item.category ?? 'Inventory'} · ${item.stock} on hand · min ${item.reorder_min}`,
    icon: <Boxes size={15} />,
  })) satisfies AttentionItem[];

  const requestItem: AttentionItem[] = requestCount > 0
    ? [{ key: 'requests-open', tone: 'attention', label: `${requestCount} open request${requestCount === 1 ? '' : 's'}`, meta: 'Fire equipment, big-ticket, and employee equipment queues', icon: <Truck size={15} /> }]
    : [];

  return [...defectItems, ...inventoryItems, ...requestItem].sort((a, b) => severity(b.tone) - severity(a.tone));
}

function severity(tone: AttentionItem['tone']): number {
  return tone === 'critical' ? 3 : tone === 'attention' ? 2 : 1;
}

function toneBg(tone: AttentionItem['tone']): string {
  return tone === 'critical' ? 'bg-critical/15' : tone === 'attention' ? 'bg-attention/15' : 'bg-info/15';
}

function toneText(tone: AttentionItem['tone']): string {
  return tone === 'critical' ? 'text-critical' : tone === 'attention' ? 'text-attention' : 'text-info';
}

function statusClass(tone: AttentionItem['tone']): string {
  return tone === 'critical' ? 'cg-status--critical' : tone === 'attention' ? 'cg-status--attention' : 'cg-status--info';
}
