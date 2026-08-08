import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { UuidGenerator } from '@/components/tools/UuidGenerator';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('uuid-generator');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <UuidGenerator />
    </ToolShell>
  );
}
