import { CheckCircle2, Clock, MapPin, PackageCheck, Truck } from 'lucide-react';
import {
  DeliveryTrackingEvent,
  ORDER_STATUS_FLOW,
  OrderStatus,
} from '../types/commerce';

interface CourierCheckpointLogProps {
  currentStatus: OrderStatus;
  trackingEvents: DeliveryTrackingEvent[];
  compact?: boolean;
}

function formatCheckpointTimestamp(ts?: { toDate?: () => Date }): string {
  if (!ts || typeof ts.toDate !== 'function') return 'Just now';
  return ts.toDate().toLocaleString('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function getOrderStageIcon(status: OrderStatus) {
  switch (status) {
    case 'Delivered':
      return CheckCircle2;
    case 'In Transit':
    case 'Out for Delivery':
      return Truck;
    case 'Packed & Ready':
      return PackageCheck;
    default:
      return Clock;
  }
}

export function CourierCheckpointLog({
  currentStatus,
  trackingEvents,
  compact = false,
}: CourierCheckpointLogProps) {
  const currentStageIndex = ORDER_STATUS_FLOW.indexOf(currentStatus);

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <h3
        className={
          compact
            ? 'text-xs font-semibold uppercase tracking-wide text-stone-600'
            : 'font-display text-2xl font-semibold text-zinc-900'
        }
      >
        Courier Checkpoint Log
      </h3>

      <ol className={compact ? 'space-y-2.5' : 'space-y-4'}>
        {ORDER_STATUS_FLOW.map((stage, index) => {
          const completed = index <= currentStageIndex;
          const isCurrent = index === currentStageIndex;
          const event = [...trackingEvents]
            .reverse()
            .find((ev) => ev.status === stage);
          const StageIcon = getOrderStageIcon(stage);

          return (
            <li key={stage} className={compact ? 'flex gap-3' : 'flex gap-4'}>
              <div className="flex flex-col items-center">
                <div
                  className={`${
                    compact ? 'w-7 h-7' : 'w-8 h-8'
                  } rounded-lg border flex items-center justify-center shrink-0 ${
                    completed
                      ? 'bg-zinc-900 border-zinc-900 text-white'
                      : 'bg-[#FAF8F5] border-stone-300 text-stone-400'
                  }`}
                >
                  <StageIcon className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                </div>
                {index < ORDER_STATUS_FLOW.length - 1 && (
                  <div
                    className={`w-px flex-1 ${
                      compact ? 'min-h-[16px]' : 'min-h-[24px]'
                    } mt-1 ${
                      index < currentStageIndex ? 'bg-zinc-900' : 'bg-stone-200'
                    }`}
                  />
                )}
              </div>

              <div className={`${compact ? 'pb-2.5' : 'pb-4'} flex-1 min-w-0`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p
                    className={`${compact ? 'text-xs' : 'text-sm'} font-semibold ${
                      completed ? 'text-zinc-900' : 'text-stone-400'
                    }`}
                  >
                    {stage}
                    {isCurrent ? ' (Current)' : ''}
                  </p>
                  <span
                    className={`${
                      compact ? 'text-[11px]' : 'text-xs'
                    } font-mono text-stone-500`}
                  >
                    {event
                      ? formatCheckpointTimestamp(event.createdAt)
                      : completed
                      ? 'Completed'
                      : 'Pending'}
                  </span>
                </div>

                {event ? (
                  <div className="mt-1 space-y-0.5">
                    <p className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-700">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      {event.location}
                    </p>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      {event.notes}
                    </p>
                    <p className="text-[11px] text-stone-400">
                      Logged by {event.updatedBy}
                    </p>
                  </div>
                ) : completed ? (
                  <p className="text-xs text-stone-500 mt-1">
                    {stage} stage recorded.
                  </p>
                ) : (
                  <p className="text-xs text-stone-400 mt-1">
                    Awaiting atelier dispatch update.
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
