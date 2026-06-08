import { GlassPanel } from '@/components/common/GlassPanel';
import { EmptyState } from '@/components/common/EmptyState';
import { Camera } from '@/components/common/icons';
import { CameraTile } from '@/components/command/CameraTile';
import { camerasForStation } from '@/data/stationCameraCatalog';

/** Station-specific live feeds (territory + adjacent context + marine telemetry). */
export function StationCameraPanel({ stationNumber, className }: { stationNumber: number; className?: string }) {
  const cameras = camerasForStation(stationNumber);
  const hasContextOnly = cameras.length > 0 && cameras.every((c) => c.contextOnly);

  return (
    <GlassPanel
      label="Station Cameras"
      icon={<Camera size={15} />}
      className={className}
      bodyClassName="min-h-0"
      right={<span className="text-[11px] uppercase tracking-wider text-faint"><span className="tnum">{cameras.length}</span> feeds</span>}
    >
      {cameras.length === 0 ? (
        <EmptyState
          icon={<Camera size={22} />}
          title="No verified feed in this territory"
          hint="No public camera covers this station's response area"
        />
      ) : (
        <div className="flex h-full min-h-0 flex-col gap-2">
          {hasContextOnly && (
            <p className="rounded-md bg-attention/10 px-2.5 py-1 text-[11px] text-attention">
              Nearest available feeds are just outside this territory (context).
            </p>
          )}
          <div className="cg-scroll-y grid min-h-0 flex-1 auto-rows-min grid-cols-2 content-start gap-2 xl:grid-cols-3">
            {cameras.slice(0, 6).map((cam) => (
              <CameraTile key={cam.id} camera={cam} allowRefresh className="min-h-0" />
            ))}
          </div>
        </div>
      )}
    </GlassPanel>
  );
}
