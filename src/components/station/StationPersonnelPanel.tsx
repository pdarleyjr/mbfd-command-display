import { GlassPanel } from '@/components/common/GlassPanel';
import { EmptyState } from '@/components/common/EmptyState';
import { Users } from '@/components/common/icons';
import { useStationPersonnel } from '@/hooks/useDisplayData';
import type { PersonnelMember } from '@/types/display';

/**
 * Assigned personnel / operators. Names are shown because the display is staff-only behind
 * Cloudflare Access (per owner decision). The hub gates this endpoint accordingly.
 */
export function StationPersonnelPanel({ stationId, className }: { stationId: number | null; className?: string }) {
  const { data } = useStationPersonnel(stationId);
  const roster: PersonnelMember[] = Array.isArray(data) ? data : (data?.personnel ?? []);

  return (
    <GlassPanel
      label="Personnel"
      icon={<Users size={15} />}
      className={className}
      bodyClassName="min-h-0 overflow-hidden"
      right={<span className="text-[11px] uppercase tracking-wider text-faint"><span className="tnum">{roster.length}</span> on roster</span>}
    >
      {roster.length === 0 ? (
        <EmptyState icon={<Users size={22} />} title="No roster available" hint="Personnel list not published" />
      ) : (
        <ul className="cg-scroll-y h-full min-h-0 space-y-1 pr-1">
          {roster.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg bg-graphite/40 px-3 py-1.5">
              <span className="truncate text-sm text-ink">{p.name}</span>
              {p.rank && <span className="shrink-0 rounded bg-info/12 px-2 py-0.5 text-[11px] font-semibold text-info">{p.rank}</span>}
            </li>
          ))}
        </ul>
      )}
    </GlassPanel>
  );
}
