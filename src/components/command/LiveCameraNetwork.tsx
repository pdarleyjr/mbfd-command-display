import { clsx } from 'clsx';
import { GlassPanel } from '@/components/common/GlassPanel';
import { Camera } from '@/components/common/icons';
import { CameraTile } from './CameraTile';
import { overviewCameras, type StationCamera } from '@/data/stationCameraCatalog';
import { summarizeCameraHealth, useCameraHealthStore } from '@/store/cameraHealthStore';

interface Props {
  cameras?: StationCamera[];
  /** Tailwind grid columns class override. */
  columnsClassName?: string;
  allowRefresh?: boolean;
  className?: string;
  title?: string;
}

/** The overview's ~4-up territory camera wall. Each tile self-heals through its fallback ladder. */
export function LiveCameraNetwork({
  cameras,
  columnsClassName = 'grid-cols-2',
  allowRefresh,
  className,
  title = 'Live Cameras',
}: Props) {
  const list = cameras ?? overviewCameras(4);
  const camStates = useCameraHealthStore((s) => s.states);
  const health = summarizeCameraHealth(camStates);
  const confirmed = health.live + health.degraded + health.offline;
  return (
    <GlassPanel
      label={title}
      icon={<Camera size={15} />}
      className={className}
      bodyClassName="min-h-0"
      right={
        <span className="cg-live">
          <span className="cg-live__dot" />
          {confirmed > 0 ? `${health.live} live` : `${list.length} sources`}
        </span>
      }
    >
      {/* Fixed 2×2 (or single column on the narrowest screens): tiles fill their cell and
          can never overflow — there are exactly as many cells as tiles. */}
      <div className={clsx('grid h-full min-h-0 gap-2', columnsClassName ?? 'grid-cols-2 grid-rows-2')}>
        {list.map((cam) => (
          <CameraTile key={cam.id} camera={cam} allowRefresh={allowRefresh} className="!aspect-auto h-full min-h-0" />
        ))}
      </div>
    </GlassPanel>
  );
}
