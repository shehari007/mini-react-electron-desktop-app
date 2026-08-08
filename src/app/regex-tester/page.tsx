import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { RegexTester } from '@/components/tools/RegexTester';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('regex-tester');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <RegexTester />
    </ToolShell>
  );
}
