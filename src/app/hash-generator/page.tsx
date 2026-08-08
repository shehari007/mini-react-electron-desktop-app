import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { HashGenerator } from '@/components/tools/HashGenerator';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('hash-generator');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <HashGenerator />
    </ToolShell>
  );
}
