import type { DisplayStationDetail } from '@/types/display';
import { assetForStation } from '@/data/stationAssets';
import { territoryByNumber } from '@/data/stationTerritories';
import { StationImage } from '@/components/common/StationImage';
import { ReadinessChip } from '@/components/common/StatusChip';
import { Anchor, MapPin } from '@/components/common/icons';

interface Props {
  detail: DisplayStationDetail | undefined;
  stationNumber: string;
  className?: string;
}

/** Station detail hero: image backdrop, identity, readiness score + reasons. */
export function StationHero({ detail, stationNumber, className }: Props) {
  const territory = territoryByNumber(stationNumber);
  const asset = assetForStation(stationNumber);
  const r = detail?.readiness;
  const name = detail?.station?.name ?? territory?.name ?? `Station ${stationNumber}`;

  return (
    <section className={className}>
      <StationImage
        asset={asset}
        variant="hero"
        alt={name}
        className="h-full min-h-[200px] w-full rounded-glass-lg"
        imgClassName=""
      >
        <div className="relative z-10 flex h-full flex-col justify-end gap-3 p-6">
          <div className="flex items-center gap-2 text-marine">
            {territory?.isMarine ? <Anchor size={18} /> : <MapPin size={18} className="text-cyan" />}
            <span className="text-[12px] uppercase tracking-[0.18em] text-mute">{territory?.territoryLabel}</span>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-ink drop-shadow">{name}</h1>
              {detail?.station?.address && <p className="text-sm text-mute">{detail.station.address}</p>}
            </div>
            <div className="flex items-center gap-4">
              <ReadinessChip status={r?.status ?? 'UNKNOWN'} />
              <div className="text-right">
                <div className="tnum text-5xl font-extrabold leading-none" style={{ color: scoreColor(r?.status) }}>
                  {Number.isFinite(r?.percent) ? r?.percent : '—'}
                  <span className="text-2xl text-mute">%</span>
                </div>
                <div className="cg-label">Readiness</div>
              </div>
            </div>
          </div>

          {r?.reasons && r.reasons.length > 0 && (
            <ul className="flex flex-wrap gap-x-4 gap-y-1 border-t border-white/10 pt-3 text-[13px] text-mute">
              {r.reasons.slice(0, 5).map((reason, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <span className="cg-status__dot" style={{ background: 'var(--c-cyan)' }} />
                  {reason}
                </li>
              ))}
            </ul>
          )}

          {detail?.counts && (
            <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-3 text-sm sm:grid-cols-4">
              <HeroCount label="Apparatus checks" value={detail.counts.inspections_today} />
              <HeroCount label="Station insp. 30d" value={detail.counts.station_inspections_30d} />
              <HeroCount label="Open defects" value={detail.counts.open_defects} tone={detail.counts.open_defects > 0 ? 'attention' : 'ready'} />
              <HeroCount label="Equip. requests" value={detail.counts.equipment_requests + detail.counts.supply_requests + detail.counts.big_ticket} tone={detail.counts.equipment_requests + detail.counts.supply_requests + detail.counts.big_ticket > 0 ? 'attention' : 'ready'} />
            </div>
          )}
        </div>
      </StationImage>
    </section>
  );
}

function HeroCount({ label, value, tone = 'mute' }: { label: string; value: number; tone?: 'ready' | 'attention' | 'mute' }) {
  const toneClass = tone === 'ready' ? 'text-ready' : tone === 'attention' ? 'text-attention' : 'text-ink';
  return (
    <div className="rounded-lg bg-black/35 px-3 py-2">
      <div className={`tnum font-display text-xl font-extrabold leading-none ${toneClass}`}>{value}</div>
      <div className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-mute">{label}</div>
    </div>
  );
}

function scoreColor(status: DisplayStationDetail['readiness']['status'] | undefined): string {
  switch (status) {
    case 'READY':
      return 'var(--c-ready)';
    case 'ATTENTION':
    case 'INCOMPLETE':
      return 'var(--c-attention)';
    case 'CRITICAL':
      return 'var(--c-critical)';
    default:
      return 'var(--c-unknown)';
  }
}
