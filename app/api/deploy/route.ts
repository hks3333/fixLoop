import { NextResponse } from 'next/server';
import { injectBug, BUG } from '@/lib/bugInjector';

export async function POST() {
  injectBug();

  const diff = `--- a/${BUG.file}
+++ b/${BUG.file}
@@ -43,1 +43,1 @@
-  z-index: ${BUG.before};
+  z-index: ${BUG.after};`;

  return NextResponse.json({ success: true, diff, bug: BUG });
}
