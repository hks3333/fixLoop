'use client';
import { useState, useEffect, useRef } from 'react';
import AgentCard from '@/components/AgentCard';
import DiffViewer from '@/components/DiffViewer';
import PatchViewer from '@/components/PatchViewer';
import PRCard from '@/components/PRCard';
import type { AgentState, SSEEvent, AgentAOutput, AgentBOutput, AgentCOutput, AgentDOutput } from '@/lib/types';

export default function Home() {
  const [agents, setAgents] = useState<Record<'A' | 'B' | 'C' | 'D', AgentState>>({
    A: { status: 'idle' },
    B: { status: 'idle' },
    C: { status: 'idle' },
    D: { status: 'idle' },
  });
  const [screenshots, setScreenshots] = useState<{
    baseline?: { desktop: string; mobile: string };
    bugged?: { desktop: string; mobile: string };
    fixed?: { desktop: string; mobile: string };
  }>({});
  const [patch, setPatch] = useState<{
    file: string;
    line: number;
    oldCode: string;
    newCode: string;
    explanation: string;
  } | null>(null);
  const [result, setResult] = useState<{
    result: 'pass' | 'fixed' | 'escalated';
    pr?: any;
    message?: string;
  } | null>(null);
  const [loopStartTime, setLoopStartTime] = useState<number | null>(null);
  const [loopEndTime, setLoopEndTime] = useState<number | null>(null);
  const [diff, setDiff] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [clock, setClock] = useState('00:00.000');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loopStartTime && !loopEndTime) {
      interval = setInterval(() => {
        const elapsed = Date.now() - loopStartTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        const ms = elapsed % 1000;
        setClock(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(3, '0')}`);
      }, 10);
    }
    return () => clearInterval(interval);
  }, [loopStartTime, loopEndTime]);

  const handleDeploy = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setLoopStartTime(Date.now());
    setLoopEndTime(null);
    setClock('00:00.000');
    setAgents({ A: { status: 'idle' }, B: { status: 'idle' }, C: { status: 'idle' }, D: { status: 'idle' } });
    setScreenshots({});
    setPatch(null);
    setResult(null);

    const deployRes = await fetch('/api/deploy', { method: 'POST' });
    const deployData = await deployRes.json();
    setDiff(deployData.diff);

    if (iframeRef.current) {
      iframeRef.current.src = '/checkout-preview';
    }

    const es = new EventSource(`/api/run-loop?diff=${encodeURIComponent(deployData.diff)}`);

    es.onmessage = (e) => {
      const event: SSEEvent = JSON.parse(e.data);

      switch (event.type) {
        case 'agent_start':
          setAgents(prev => ({
            ...prev,
            [event.agent!]: { status: 'running', startedAt: Date.now() }
          }));
          break;

        case 'agent_done':
          setAgents(prev => ({
            ...prev,
            [event.agent!]: {
              ...prev[event.agent!],
              status: 'done',
              completedAt: Date.now(),
              output: event.data,
            }
          }));
          break;

        case 'screenshot':
          setScreenshots(prev => ({ ...prev, ...(event.data as any) }));
          break;

        case 'patch':
          setPatch(event.data as any);
          break;

        case 'result':
          setResult(event.data as any);
          setLoopEndTime(Date.now());
          setIsRunning(false);
          es.close();
          break;

        case 'error':
          console.error('Loop error:', event.data);
          setIsRunning(false);
          es.close();
          break;
      }
    };
  };

  const handleReset = async () => {
    await fetch('/api/reset', { method: 'POST' });
    setAgents({ A: { status: 'idle' }, B: { status: 'idle' }, C: { status: 'idle' }, D: { status: 'idle' } });
    setScreenshots({});
    setPatch(null);
    setResult(null);
    setLoopStartTime(null);
    setLoopEndTime(null);
    setClock('00:00.000');
    if (iframeRef.current) {
      iframeRef.current.src = '/checkout-preview';
    }
  };

  const getAgentSummary = (agent: 'A' | 'B' | 'C' | 'D') => {
    const output = agents[agent].output;
    if (!output) return '';

    if (agent === 'A') {
      const data = output as unknown as AgentAOutput;
      return data.description;
    }
    if (agent === 'B') {
      const data = output as unknown as AgentBOutput;
      return `${data.file}:${data.line} — ${data.property}: ${data.new_value} → ${data.old_value}`;
    }
    if (agent === 'C') {
      const data = output as unknown as AgentCOutput;
      return `- ${data.old_code.trim()}\n+ ${data.new_code.trim()}`;
    }
    if (agent === 'D') {
      const data = output as unknown as AgentDOutput;
      return data.description + (data.regression_resolved ? ' ✓' : '');
    }
    return '';
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between w-full max-w-none">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              FixLoop
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-semibold border border-indigo-100">
              Cerebras AI UI-Healing
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="font-mono text-xl font-semibold text-gray-700 bg-gray-50 px-4 py-1.5 rounded-lg border border-gray-200">
              {clock}
            </div>
            <button
              onClick={handleDeploy}
              disabled={isRunning}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors shadow-sm disabled:cursor-not-allowed"
            >
              Deploy Bug
            </button>
            <button
              onClick={handleReset}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-6 py-2.5 rounded-lg transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Screen */}
      <div className="flex flex-1 w-full overflow-hidden">
        {/* Left Side: Site Preview */}
        <div className="w-1/2 h-full flex flex-col border-r border-gray-200 bg-gray-50">
          <div className="flex-shrink-0 bg-white px-4 py-2 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-400"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
              <span className="w-3 h-3 rounded-full bg-green-400"></span>
              <span className="text-xs text-gray-500 font-mono ml-2">Live Site Preview</span>
            </div>
            <span className="text-xs text-gray-400 font-mono">localhost:3000/checkout-preview</span>
          </div>
          <div className="flex-1 p-6 flex items-center justify-center overflow-auto bg-gray-100">
            <iframe
              ref={iframeRef}
              src="/checkout-preview"
              className="w-full h-full border border-gray-200 rounded-xl shadow-lg bg-white max-w-[480px] max-h-[850px]"
              title="Checkout Preview"
            />
          </div>
        </div>

        {/* Right Side: Agents & Pipeline Progress */}
        <div className="w-1/2 h-full overflow-y-auto p-6 space-y-6 bg-white">
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">Agentic Repair Pipeline</h2>
            <div className="space-y-3">
              <AgentCard name="Agent A" role="Visual QA" state={agents.A} outputSummary={getAgentSummary('A')} />
              <AgentCard name="Agent B" role="Root Cause Analysis" state={agents.B} outputSummary={getAgentSummary('B')} />
              <AgentCard name="Agent C" role="Fix Generation" state={agents.C} outputSummary={getAgentSummary('C')} />
              <AgentCard name="Agent D" role="Verification" state={agents.D} outputSummary={getAgentSummary('D')} />
            </div>
          </div>

          {screenshots.baseline && screenshots.bugged && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-sm text-gray-700 mb-3 font-mono">Screenshot Comparison</h3>
              <DiffViewer
                baseline={screenshots.baseline.mobile}
                bugged={screenshots.bugged.mobile}
                fixed={screenshots.fixed?.mobile}
              />
            </div>
          )}

          {patch && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-sm text-gray-700 mb-3 font-mono">Generated Patch</h3>
              <PatchViewer oldCode={patch.oldCode} newCode={patch.newCode} />
            </div>
          )}

          {result?.result === 'fixed' && result.pr && loopEndTime && loopStartTime && (
            <PRCard
              title={result.pr.title}
              file={result.pr.file}
              oldCode={result.pr.oldCode}
              newCode={result.pr.newCode}
              explanation={result.pr.explanation}
              durationSeconds={(loopEndTime - loopStartTime) / 1000}
            />
          )}

          {result?.result === 'pass' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-green-800 flex items-center gap-2">
                <span>✓</span> No Regression Detected
              </h3>
              <p className="text-green-700 mt-2 text-sm">{result.message}</p>
            </div>
          )}

          {result?.result === 'escalated' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
                <span>⚠</span> Escalated to Human
              </h3>
              <p className="text-red-700 mt-2 text-sm">{result.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
