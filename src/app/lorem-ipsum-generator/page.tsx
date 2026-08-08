import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { LoremIpsumGenerator } from '@/components/tools/LoremIpsumGenerator';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('lorem-ipsum-generator');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <LoremIpsumGenerator />
    </ToolShell>
  );
}
