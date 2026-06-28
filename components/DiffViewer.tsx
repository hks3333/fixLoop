'use client';

interface Props {
  baseline: string;
  bugged: string;
  fixed?: string;
}

export default function DiffViewer({ baseline, bugged, fixed }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-semibold text-gray-500 mb-2">BASELINE</div>
          <img 
            src={`data:image/png;base64,${baseline}`} 
            alt="Baseline" 
            className="w-full rounded-lg border border-gray-200"
            style={{ objectFit: 'contain' }}
          />
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-500 mb-2">BUGGED</div>
          <img 
            src={`data:image/png;base64,${bugged}`} 
            alt="Bugged" 
            className="w-full rounded-lg border border-red-200"
            style={{ objectFit: 'contain' }}
          />
        </div>
      </div>
      {fixed && (
        <div>
          <div className="text-xs font-semibold text-gray-500 mb-2">FIXED</div>
          <img 
            src={`data:image/png;base64,${fixed}`} 
            alt="Fixed" 
            className="w-full rounded-lg border border-green-200"
            style={{ objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  );
}
