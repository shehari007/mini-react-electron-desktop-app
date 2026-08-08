import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { WaterTracker } from '@/components/tools/WaterTracker';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('water-tracker');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <WaterTracker />
    </ToolShell>
  );
}
