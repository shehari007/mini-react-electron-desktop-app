import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { ImageTools } from '@/components/tools/ImageTools';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('image-tools');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <ImageTools />
    </ToolShell>
  );
}
