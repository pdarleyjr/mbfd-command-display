import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CommandShell } from '@/components/command/CommandShell';
import { CommandStrip } from '@/components/command/CommandStrip';
import { SourceHealthBar } from '@/components/command/SourceHealthBar';
import { OperationsMap } from '@/components/command/OperationsMap';
import { StationHero } from '@/components/station/StationHero';
import { StationApparatusPanel } from '@/components/station/StationApparatusPanel';
import { StationPersonnelPanel } from '@/components/station/StationPersonnelPanel';
import { StationSubmissionsPanel } from '@/components/station/StationSubmissionsPanel';
import { StationRunsPanel } from '@/components/station/StationRunsPanel';
import { StationCameraPanel } from '@/components/station/StationCameraPanel';
import { StationAiSummary } from '@/components/station/StationAiSummary';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ChevronLeft } from '@/components/common/icons';
import { useDisplaySnapshot, useStationDetail, useIncidents, useAiSnapshot } from '@/hooks/useDisplayData';
import { stationIdForNumber, territoryByNumber } from '@/data/stationTerritories';
import { useReducedMotion } from '@/hooks/useEnvironment';
import { computeFrontlineInspectionReadiness } from '@/lib/frontlineInspections';
import type { DisplayStationDetail, DisplayStationSummary } from '@/types/display';

/** Station Command View — independent per-station readiness, apparatus, personnel, cameras, runs, AI. */
export function StationView() {
  const { number = '' } = useParams<{ number: string }>();
  const navigate = useNavigate();
  const snap = useDisplaySnapshot();
  const inc = useIncidents();
  const ai = useAiSnapshot();
  const reducedMotion = useReducedMotion();

  const territory = territoryByNumber(number);
  const summary = snap.data?.stations?.find((s) => s.number === number);
  const stationId = summary?.id ?? stationIdForNumber(number);
  const detailRes = useStationDetail(stationId);
  const detail = useMemo(() => {
    const base = detailRes.data ?? (summary ? summaryToDetail(summary) : undefined);
    if (!base) return undefined;
    const readiness = computeFrontlineInspectionReadiness(number, base.apparatus);
    return {
      ...base,
      readiness,
      counts: {
        ...base.counts,
        inspections_today: readiness.completed ?? base.counts.inspections_today,
      },
    };
  }, [detailRes.data, number, summary]);
  const stationNum = Number(number);

  const mapStations = useMemo(
    () => buildStationMapSummaries(snap.data?.stations, summary, detail, number),
    [detail, number, snap.data?.stations, summary],
  );

  const back = (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
        className="inline-flex items-center gap-1 rounded-md border border-[color:var(--c-hairline)] px-2.5 py-1.5 text-[12px] font-semibold text-mute transition-colors hover:text-ink"
        title="Return to the previous screen"
        aria-label="Back to Previous Screen"
      >
        <ChevronLeft size={16} /> Previous
      </button>
      <button
        type="button"
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-1 rounded-md border border-[color:var(--c-hairline)] px-2.5 py-1.5 text-[12px] font-semibold text-mute transition-colors hover:text-ink"
        title="Back to overview"
        aria-label="Back to Overview"
      >
        Overview
      </button>
    </div>
  );

  const breadcrumb = territory ? (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
      <Link to="/" className="text-mute hover:text-ink">Overview</Link>
      <span aria-hidden="true">/</span>
      <span className="text-ink">Station {territory.number}</span>
    </nav>
  ) : undefined;

  if (!territory) {
    return (
      <CommandShell>
        <CommandStrip leading={back} title="Unknown Station" showControls={false} />
        <main className="cg-main grid place-content-center text-center text-mute">
          <div>
            <div className="mb-2 text-2xl font-bold text-ink">Station {number} not found</div>
            <button type="button" onClick={() => navigate('/')} className="text-cyan underline">
              Return to overview
            </button>
          </div>
        </main>
      </CommandShell>
    );
  }

  return (
    <CommandShell>
      <CommandStrip
        leading={back}
        breadcrumb={breadcrumb}
        selectedStationNumber={number}
        title={territory.name}
        subtitle={territory.territoryLabel}
        snapshot={snap.data}
        incidents={inc.data}
        ai={ai.data}
        aiAgeSeconds={ai.ageSeconds}
      />

      <main className="cg-main">
        <div className="cg-station">
          <StationHero className="cg-sarea-hero" detail={detail} stationNumber={number} />
          <ErrorBoundary label="Apparatus" className="cg-sarea-appr">
            <StationApparatusPanel className="h-full" apparatus={detail?.apparatus} stationNumber={number} />
          </ErrorBoundary>
          <ErrorBoundary label="Personnel" className="cg-sarea-ppl">
            <StationPersonnelPanel className="h-full" stationId={stationId} />
          </ErrorBoundary>
          <ErrorBoundary label="Submissions" className="cg-sarea-subs">
            <StationSubmissionsPanel className="h-full" stationId={stationId} />
          </ErrorBoundary>
          <ErrorBoundary label="Runs" className="cg-sarea-runs">
            <StationRunsPanel
              className="h-full"
              incidents={inc.data}
              servedFrom={inc.servedFrom}
              ageSeconds={inc.ageSeconds}
              stationNumber={number}
            />
          </ErrorBoundary>
          <ErrorBoundary label="Station map" className="cg-sarea-map">
            <OperationsMap
              className="h-full"
              stations={mapStations}
              incidents={inc.data?.active ?? []}
              selectedStationNumber={number}
              onSelectStation={(stationNumber) => navigate(`/stations/${stationNumber}`)}
              reducedMotion={reducedMotion}
            />
          </ErrorBoundary>
          <ErrorBoundary label="Cameras" className="cg-sarea-cams">
            <StationCameraPanel className="h-full" stationNumber={stationNum} />
          </ErrorBoundary>
          <ErrorBoundary label="AI summary" className="cg-sarea-ai">
            <StationAiSummary className="h-full" ai={ai.data} stationNumber={number} stationName={territory.name} ageSeconds={ai.ageSeconds} />
          </ErrorBoundary>
        </div>
      </main>

      <SourceHealthBar snapshot={snap.data} servedFrom={detailRes.servedFrom} ageSeconds={detailRes.ageSeconds} />
    </CommandShell>
  );
}

/** Build a minimal detail object from the overview summary so the hero paints before /detail loads. */
function summaryToDetail(s: NonNullable<ReturnType<typeof useDisplaySnapshot>['data']>['stations'][number]): DisplayStationDetail {
  return {
    metadata: { generated_at: new Date().toISOString(), cache_ttl_seconds: 300, environment: 'client' },
    station: { id: s.id, number: s.number, name: s.name, address: null, latitude: s.latitude, longitude: s.longitude },
    readiness: s.readiness,
    apparatus: [],
    counts: {
      inspections_today: 0,
      station_inspections_30d: 0,
      equipment_requests: 0,
      big_ticket: 0,
      open_defects: s.open_defects,
      supply_requests: 0,
    },
    defects: [],
  };
}

function buildStationMapSummaries(
  stations: DisplayStationSummary[] | undefined,
  summary: DisplayStationSummary | undefined,
  detail: DisplayStationDetail | undefined,
  stationNumber: string,
): DisplayStationSummary[] {
  const readiness = detail?.readiness ?? summary?.readiness ?? computeFrontlineInspectionReadiness(stationNumber, detail?.apparatus ?? []);
  const baseStation: DisplayStationSummary = summary ?? {
    id: detail?.station.id ?? stationIdForNumber(stationNumber) ?? Number(stationNumber),
    number: stationNumber,
    name: detail?.station.name ?? territoryByNumber(stationNumber)?.name ?? `Station ${stationNumber}`,
    latitude: detail?.station.latitude ?? null,
    longitude: detail?.station.longitude ?? null,
    apparatus_count: detail?.apparatus.length ?? 0,
    in_service: 0,
    out_of_service: 0,
    maintenance: 0,
    open_defects: detail?.counts.open_defects ?? 0,
    readiness,
  };

  if (!stations || stations.length === 0) return [{ ...baseStation, readiness }];

  const found = stations.some((station) => station.number === stationNumber);
  const updated = stations.map((station) => (station.number === stationNumber ? { ...station, readiness } : station));
  return found ? updated : [...updated, { ...baseStation, readiness }];
}
