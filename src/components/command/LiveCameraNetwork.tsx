import { clsx } from 'clsx';
import { GlassPanel } from '@/components/common/GlassPanel';
import { Camera } from '@/components/common/icons';
import { CameraTile } from './CameraTile';
import { overviewCameras, type StationCamera } from '@/data/stationCameraCatalog';

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
  return (
    <GlassPanel
      label={title}
      icon={<Camera size={15} />}
      className={className}
      bodyClassName="min-h-0"
      right={<span className="text-[11px] uppercase tracking-wider text-faint">{list.length} feeds</span>}
    >
      <div className={clsx('grid h-full min-h-0 gap-2', columnsClassName)}>
        {list.map((cam) => (
          <CameraTile key={cam.id} camera={cam} allowRefresh={allowRefresh} className="min-h-0" />
        ))}
      </div>
    </GlassPanel>
  );
}
