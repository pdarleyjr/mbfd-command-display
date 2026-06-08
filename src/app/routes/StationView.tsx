import { useNavigate, useParams } from 'react-router-dom';
import { CommandShell } from '@/components/command/CommandShell';
import { CommandStrip } from '@/components/command/CommandStrip';
import { SourceHealthBar } from '@/components/command/SourceHealthBar';
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
import { territoryByNumber } from '@/data/stationTerritories';
import type { DisplayStationDetail } from '@/types/display';

/** Station Command View — independent per-station readiness, apparatus, personnel, cameras, runs, AI. */
export function StationView() {
  const { number = '' } = useParams<{ number: string }>();
  const navigate = useNavigate();
  const snap = useDisplaySnapshot();
  const inc = useIncidents();
  const ai = useAiSnapshot();

  const territory = territoryByNumber(number);
  const summary = snap.data?.stations?.find((s) => s.number === number);
  const stationId = summary?.id ?? null;
  const detailRes = useStationDetail(stationId);
  const detail = detailRes.data ?? (summary ? summaryToDetail(summary) : undefined);
  const stationNum = Number(number);

  const back = (
    <button
      type="button"
      onClick={() => navigate('/')}
      className="inline-flex items-center gap-1 rounded-md border border-[color:var(--c-hairline)] px-2.5 py-1.5 text-[12px] font-semibold text-mute transition-colors hover:text-ink"
      title="Back to overview"
    >
      <ChevronLeft size={16} /> Overview
    </button>
  );

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
            <StationApparatusPanel className="h-full" apparatus={detail?.apparatus} />
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
