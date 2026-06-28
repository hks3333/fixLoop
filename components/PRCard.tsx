'use client';

interface Props {
  title: string;
  file: string;
  oldCode: string;
  newCode: string;
  explanation: string;
  durationSeconds: number;
}

export default function PRCard({ title, file, oldCode, newCode, explanation, durationSeconds }: Props) {
  return (
    <div className="border-2 border-green-400 rounded-xl p-6 bg-green-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
          RESOLVED IN {durationSeconds.toFixed(1)}s
        </span>
      </div>
      
      <div className="text-sm text-gray-600 mb-4">
        <div className="font-semibold text-gray-700">File: {file}</div>
        <div className="mt-1">{explanation}</div>
      </div>

      <div className="bg-white rounded-lg p-4 font-mono text-sm border border-gray-200 mb-4">
        <div className="text-red-600 bg-red-50 px-2 py-1 rounded">
          <span className="text-gray-400 select-none">- </span>
          {oldCode}
        </div>
        <div className="text-green-600 bg-green-50 px-2 py-1 rounded mt-1">
          <span className="text-gray-400 select-none">+ </span>
          {newCode}
        </div>
      </div>

      <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors">
        Merge PR
      </button>
    </div>
  );
}
