import { Check, Circle, Clock } from 'lucide-react';
import { formatDate } from '../../../utils/helpers';

export default function Timeline({ timeline, highlightedTaskId }) {
  if (!timeline || timeline.length === 0) return null;

  return (
    <div className="space-y-1">
      {timeline.map((item, index) => {
        const isHighlighted = highlightedTaskId && item._id === highlightedTaskId;

        return (
          <div
            key={item._id ?? index}
            className={[
              'flex gap-4 transition-all duration-500',
              isHighlighted ? 'scale-[1.01]' : '',
            ].join(' ')}
          >
            {/* Icon + connector line */}
            <div className="flex flex-col items-center">
              <div
                className={[
                  'w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-500',
                  item.completed
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400',
                  isHighlighted ? 'ring-2 ring-primary-400 ring-offset-2' : '',
                ].join(' ')}
              >
                {item.completed
                  ? <Check className="w-4 h-4" />
                  : <Circle className="w-4 h-4" />}
              </div>
              {index < timeline.length - 1 && (
                <div
                  className={[
                    'w-0.5 flex-1 my-1 transition-colors duration-500',
                    item.completed ? 'bg-green-200' : 'bg-gray-200',
                  ].join(' ')}
                />
              )}
            </div>

            {/* Task content */}
            <div className={`flex-1 pb-6 ${index === timeline.length - 1 ? 'pb-0' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  {/* task is the field name in the Event model */}
                  <p
                    className={[
                      'font-medium text-sm transition-colors duration-300',
                      item.completed ? 'text-gray-900' : 'text-gray-500',
                    ].join(' ')}
                  >
                    {item.task}
                  </p>
                  {item.description && (
                    <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                  )}
                  {item.completed && item.completedAt && (
                    <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                      <Clock className="w-3 h-3" />
                      Completed {formatDate(item.completedAt, 'PPp')}
                    </div>
                  )}
                </div>
                {item.completed && (
                  <span className="shrink-0 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                    Done
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
