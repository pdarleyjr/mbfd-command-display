import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import type { AiSnapshot, DisplayOverview, IncidentsResponse } from '@/types/display';
import { useClock } from '@/hooks/useEnvironment';
import { useUiStore } from '@/store/uiStore';
import { formatAge } from '@/lib/sourceFreshness';
import { STATION_TERRITORIES } from '@/data/stationTerritories';
import { Activity, Grid, Truck, Boxes, Cpu, Signal, Flame } from '@/components/common/icons';

interface Props {
  title?: string;
  subtitle?: string;
  leading?: ReactNode;
  breadcrumb?: ReactNode;
  selectedStationNumber?: string | null;
  snapshot?: DisplayOverview;
  incidents?: IncidentsResponse;
  ai?: AiSnapshot;
  aiAgeSeconds?: number | null;
  showControls?: boolean;
}

const fmtTime = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
const fmtDate = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

/** Persistent command header: identity, live clock, headline metrics, display controls. */
export function CommandStrip({
  title = 'MBFD Command Display',
  subtitle,
  leading,
  breadcrumb,
  selectedStationNumber,
  snapshot,
  incidents,
  ai,
  aiAgeSeconds,
  showControls = true,
}: Props) {
  const now = useClock();
  const o = snapshot?.overview;
  const stationsReady = (snapshot?.stations ?? []).filter((s) => s.readiness?.status === 'READY').length;
  const stationsTotal = snapshot?.stations?.length ?? o?.stations_total ?? 0;
  const activeRuns = incidents?.active?.length ?? 0;
  const openRequests =
    (snapshot?.requests?.fire_equipment?.pending ?? 0) +
    (snapshot?.requests?.big_ticket?.outstanding ?? 0) +
    (snapshot?.requests?.employee_equipment?.pending ?? 0);

  return (
    <header className="cg-panel px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex min-w-0 items-center gap-3">
          {leading}
          <Link to="/" aria-label="MBFD Command Display overview" className="grid h-9 w-9 shrink-0 place-content-center rounded-lg bg-gradient-to-b from-navy-700 to-abyss text-ember shadow-glass">
            <Flame size={20} />
          </Link>
          <div className="min-w-0 leading-tight">
            {breadcrumb ? <div className="mb-0.5">{breadcrumb}</div> : null}
            <div className="truncate text-[15px] font-extrabold tracking-tight text-ink">{title}</div>
            <div className="truncate text-[11px] uppercase tracking-[0.16em] text-faint">{subtitle ?? 'Miami Beach Fire Department'}</div>
          </div>
        </div>

        <div className="flex items-baseline gap-2 border-l border-[color:var(--c-hairline)] pl-6">
          <span className="tnum text-2xl font-bold text-ink">{fmtTime.format(now)}</span>
          <span className="text-xs text-mute">{fmtDate.format(now)}</span>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-1.5">
          <Stat icon={<Activity size={14} />} label="Active runs" value={activeRuns ?? 0} tone={activeRuns ? 'ember' : 'mute'} />
          <Stat icon={<Grid size={14} />} label="Inspections" value={`${stationsReady}/${stationsTotal || '—'}`} tone={stationsReady === stationsTotal && stationsTotal > 0 ? 'ready' : 'attention'} />
          <Stat icon={<Truck size={14} />} label="Apparatus OOS" value={o?.apparatus_status?.out_of_service ?? 0} tone={o?.apparatus_status?.out_of_service ? 'critical' : 'ready'} />
          <Stat icon={<Boxes size={14} />} label="Open requests" value={openRequests} tone={openRequests ? 'attention' : 'mute'} />
          <Stat icon={<Cpu size={14} />} label="AI brief" value={ai ? formatAge(aiAgeSeconds ?? null) : '—'} tone="info" />
          {showControls && <Controls />}
        </div>
      </div>

      <CommandNav selectedStationNumber={selectedStationNumber} />
    </header>
  );
}

function CommandNav({ selectedStationNumber }: { selectedStationNumber?: string | null }) {
  return (
    <nav aria-label="Command display navigation" className="mt-2 flex min-w-0 items-center gap-1 overflow-x-auto border-t border-[color:var(--c-hairline)] pt-2">
      <NavLink to="/" end className={({ isActive }) => navClass(isActive && !selectedStationNumber)}>
        Overview
      </NavLink>
      {STATION_TERRITORIES.map((station) => (
        <NavLink
          key={station.number}
          to={`/stations/${station.number}`}
          className={({ isActive }) => navClass(isActive || selectedStationNumber === station.number)}
        >
          <span className="hidden sm:inline">Station </span>{station.number}
        </NavLink>
      ))}
    </nav>
  );
}

function navClass(active: boolean): string {
  return clsx(
    'inline-flex min-h-9 shrink-0 items-center rounded-md border px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.12em] transition-colors',
    active
      ? 'border-[color:var(--c-interactive)] bg-info/15 text-ink'
      : 'border-transparent text-mute hover:border-[color:var(--c-hairline)] hover:text-ink',
  );
}

function Stat({ icon, label, value, tone }: { icon: ReactNode; label: string; value: ReactNode; tone: 'ember' | 'ready' | 'attention' | 'critical' | 'info' | 'mute' }) {
  const toneClass = {
    ember: 'text-ember',
    ready: 'text-ready',
    attention: 'text-attention',
    critical: 'text-critical',
    info: 'text-info',
    mute: 'text-ink',
  }[tone];
  return (
    <div className="flex items-center gap-1.5" title={label}>
      <span className="text-faint">{icon}</span>
      <span className={clsx('tnum text-lg font-bold leading-none', toneClass)}>{value}</span>
      <span className="hidden text-[10px] uppercase leading-none tracking-wider text-faint xl:inline">{label}</span>
    </div>
  );
}

function Controls() {
  const { displayMode, toggleDisplayMode, motionPref, setMotionPref } = useUiStore();
  return (
    <div className="flex items-center gap-1.5 border-l border-[color:var(--c-hairline)] pl-4">
      <CtrlButton active={displayMode} onClick={toggleDisplayMode} title="Toggle no-scroll display mode">
        <Signal size={14} /> Wall
      </CtrlButton>
      <CtrlButton
        active={motionPref === 'off'}
        onClick={() => setMotionPref(motionPref === 'off' ? 'auto' : 'off')}
        title="Reduce motion"
      >
        Motion {motionPref === 'off' ? 'Off' : 'On'}
      </CtrlButton>
    </div>
  );
}

function CtrlButton({ active, onClick, title, children }: { active?: boolean; onClick: () => void; title: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={clsx(
        'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors',
        active
          ? 'border-cyan/40 bg-cyan/10 text-cyan'
          : 'border-[color:var(--c-hairline)] text-mute hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
