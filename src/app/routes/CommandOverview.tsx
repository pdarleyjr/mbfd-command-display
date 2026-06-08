import { useNavigate } from 'react-router-dom';
import { CommandShell } from '@/components/command/CommandShell';
import { CommandStrip } from '@/components/command/CommandStrip';
import { StationReadinessGrid } from '@/components/command/StationReadinessGrid';
import { ActiveRunsPanel } from '@/components/command/ActiveRunsPanel';
import { LiveCameraNetwork } from '@/components/command/LiveCameraNetwork';
import { AiOperationalBrief } from '@/components/command/AiOperationalBrief';
import { ApparatusIssuesPanel } from '@/components/command/ApparatusIssuesPanel';
import { RequestsPanel } from '@/components/command/RequestsPanel';
import { RecentSubmissionsTicker } from '@/components/command/RecentSubmissionsTicker';
import { SourceHealthBar } from '@/components/command/SourceHealthBar';
import { OperationsMap } from '@/components/command/OperationsMap';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useDisplaySnapshot, useIncidents, useAiSnapshot } from '@/hooks/useDisplayData';
import { useReducedMotion, useResolvedQuality } from '@/hooks/useEnvironment';

/** Overall Command View — all stations, spatial map, PulsePoint runs, ~4 live feeds, AI brief. */
export function CommandOverview() {
  const navigate = useNavigate();
  const snap = useDisplaySnapshot();
  const inc = useIncidents();
  const ai = useAiSnapshot();
  const reducedMotion = useReducedMotion();
  const quality = useResolvedQuality();

  const snapshot = snap.data;
  const incidents = inc.data;
  const aiHttp = ai.query.data?.status;
  const aiStatus = aiHttp === 202 ? 'generating' : (ai.data?.status ?? (ai.data ? 'fresh' : undefined));

  const selectStation = (num: string) => navigate(`/station/${num}`);

  return (
    <CommandShell>
      <CommandStrip snapshot={snapshot} incidents={incidents} ai={ai.data} aiAgeSeconds={ai.ageSeconds} />

      <main className="cg-main">
        <div className="cg-overview">
          <ErrorBoundary label="Operations map">
            <OperationsMap
              className="cg-area-map"
              stations={snapshot?.stations ?? []}
              incidents={incidents?.active ?? []}
              selectedStationNumber={null}
              onSelectStation={selectStation}
              quality={quality}
              reducedMotion={reducedMotion}
            />
          </ErrorBoundary>

          <StationReadinessGrid className="cg-area-grid" stations={snapshot?.stations} onSelect={selectStation} />

          <ActiveRunsPanel className="cg-area-runs" data={incidents} servedFrom={inc.servedFrom} ageSeconds={inc.ageSeconds} />

          <AiOperationalBrief className="cg-area-ai" ai={ai.data} status={aiStatus} ageSeconds={ai.ageSeconds} />

          <LiveCameraNetwork className="cg-area-cams" />

          <ApparatusIssuesPanel
            className="cg-area-issues"
            items={snapshot?.defects?.items}
            totalOpen={snapshot?.defects?.total_open}
            criticalMissing={snapshot?.defects?.critical_missing}
          />

          <RequestsPanel className="cg-area-req" requests={snapshot?.requests} inventory={snapshot?.inventory_exceptions} />
        </div>
      </main>

      <RecentSubmissionsTicker snapshot={snapshot} reducedMotion={reducedMotion} />

      <SourceHealthBar
        snapshot={snapshot}
        servedFrom={snap.servedFrom}
        ageSeconds={snap.ageSeconds}
        aiAvailable={aiStatus !== 'unavailable' && aiStatus !== undefined}
      />
    </CommandShell>
  );
}
