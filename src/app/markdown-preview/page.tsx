import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { MarkdownPreview } from '@/components/tools/MarkdownPreview';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('markdown-preview');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <MarkdownPreview />
    </ToolShell>
  );
}
