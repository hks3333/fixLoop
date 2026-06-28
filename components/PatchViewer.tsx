'use client';

interface Props {
  oldCode: string;
  newCode: string;
}

export default function PatchViewer({ oldCode, newCode }: Props) {
  return (
    <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
      <div className="text-red-400">
        <span className="text-gray-500 select-none">- </span>
        {oldCode}
      </div>
      <div className="text-green-400 mt-1">
        <span className="text-gray-500 select-none">+ </span>
        {newCode}
      </div>
    </div>
  );
}
