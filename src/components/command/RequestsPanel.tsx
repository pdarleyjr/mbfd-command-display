import { GlassPanel } from '@/components/common/GlassPanel';
import { Metric } from '@/components/common/Metric';
import { Boxes } from '@/components/common/icons';
import type { DisplayOverview } from '@/types/display';

interface Props {
  requests: DisplayOverview['requests'] | undefined;
  inventory: DisplayOverview['inventory_exceptions'] | undefined;
  className?: string;
}

/** Open equipment / big-ticket / employee requests + inventory exceptions, at a glance. */
export function RequestsPanel({ requests, inventory, className }: Props) {
  const fire = requests?.fire_equipment;
  const outOfStock = inventory?.out_of_stock ?? 0;
  return (
    <GlassPanel label="Requests & Supply" icon={<Boxes size={15} />} className={className} bodyClassName="min-h-0">
      <div className="grid grid-cols-2 content-start gap-x-5 gap-y-3 pt-1">
        <Metric
          label="Equip pending"
          value={fire?.pending ?? 0}
          tone={fire?.critical_pending ? 'critical' : fire?.pending ? 'attention' : 'ready'}
          compact
        />
        <Metric label="Critical req" value={fire?.critical_pending ?? 0} tone={fire?.critical_pending ? 'critical' : 'ink'} compact />
        <Metric label="Big-ticket" value={requests?.big_ticket?.outstanding ?? 0} tone="ink" compact />
        <Metric label="Employee req" value={requests?.employee_equipment?.pending ?? 0} tone="ink" compact />
        <Metric label="Low stock" value={inventory?.low_stock ?? 0} tone={inventory?.low_stock ? 'attention' : 'ready'} compact />
        <Metric label="Out of stock" value={outOfStock} tone={outOfStock ? 'critical' : 'ready'} compact />
      </div>
    </GlassPanel>
  );
}
