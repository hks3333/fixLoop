import { NextRequest } from 'next/server';
import { takeScreenshots } from '@/lib/screenshotter';
import { runAgentA, runAgentB, runAgentC, runAgentD } from '@/lib/agents';
import { getCurrentCSS, applyPatch, restoreBug } from '@/lib/bugInjector';
import fs from 'fs';
import path from 'path';
import type { SSEEvent } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function send(controller: ReadableStreamDefaultController, event: SSEEvent) {
  const encoder = new TextEncoder();
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
}

export async function GET(req: NextRequest) {
  const baselineDir = path.join(process.cwd(), 'public', 'baseline');
  const baselineDesktop = fs.readFileSync(path.join(baselineDir, 'desktop.png')).toString('base64');
  const baselineMobile = fs.readFileSync(path.join(baselineDir, 'mobile.png')).toString('base64');

  const diff = req.nextUrl.searchParams.get('diff') || '';

  const stream = new ReadableStream({
    async start(controller) {
      try {
        send(controller, { type: 'agent_start', agent: 'A', data: { message: 'Taking post-deploy screenshots...' } });
        const buggedShots = await takeScreenshots();

        send(controller, {
          type: 'screenshot',
          data: {
            baseline: { desktop: baselineDesktop, mobile: baselineMobile },
            bugged: { desktop: buggedShots.desktop, mobile: buggedShots.mobile },
          },
        });

        const agentAResult = await runAgentA({
          baselineDesktop,
          baselineMobile,
          buggedDesktop: buggedShots.desktop,
          buggedMobile: buggedShots.mobile,
        });

        send(controller, { type: 'agent_done', agent: 'A', data: agentAResult });

        if (!agentAResult.regression_found) {
          send(controller, { type: 'result', data: { result: 'pass', message: 'No regression detected. Deploy is clean.' } });
          controller.close();
          return;
        }

        send(controller, { type: 'agent_start', agent: 'B', data: { message: 'Analysing root cause...' } });
        const cssContent = getCurrentCSS();
        const agentBResult = await runAgentB({
          regressionDescription: agentAResult.description,
          affectedElement: agentAResult.affected_element,
          cssContent,
          cssDiff: diff,
        });

        send(controller, { type: 'agent_done', agent: 'B', data: agentBResult });

        send(controller, { type: 'agent_start', agent: 'C', data: { message: 'Generating patch...' } });
        const agentCResult = await runAgentC({
          rootCause: agentBResult,
          cssContent: getCurrentCSS(),
        });

        send(controller, { type: 'agent_done', agent: 'C', data: agentCResult });

        applyPatch(agentCResult.line, agentCResult.old_code, agentCResult.new_code);

        send(controller, {
          type: 'patch',
          data: {
            file: agentBResult.file,
            line: agentCResult.line,
            oldCode: agentCResult.old_code,
            newCode: agentCResult.new_code,
            explanation: agentCResult.explanation,
          },
        });

        send(controller, { type: 'agent_start', agent: 'D', data: { message: 'Verifying fix...' } });

        await new Promise(r => setTimeout(r, 1500));
        const fixedShots = await takeScreenshots();

        const agentDResult = await runAgentD({
          baselineMobile,
          fixedMobile: fixedShots.mobile,
          regressionDescription: agentAResult.description,
        });

        send(controller, { type: 'agent_done', agent: 'D', data: agentDResult });

        send(controller, {
          type: 'screenshot',
          data: { fixed: { desktop: fixedShots.desktop, mobile: fixedShots.mobile } },
        });

        if (agentDResult.regression_resolved) {
          send(controller, {
            type: 'result',
            data: {
              result: 'fixed',
              pr: {
                title: `fix: restore z-index on .button-wrapper in ${agentBResult.file}`,
                file: agentBResult.file,
                oldCode: agentCResult.old_code.trim(),
                newCode: agentCResult.new_code.trim(),
                explanation: agentCResult.explanation,
              },
            },
          });
        } else {
          restoreBug();
          send(controller, {
            type: 'result',
            data: { result: 'escalated', message: 'Fix did not resolve regression. Escalating to human.' },
          });
        }

        controller.close();
      } catch (err) {
        send(controller, { type: 'error', data: { message: String(err) } });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
