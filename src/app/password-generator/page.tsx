import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { PasswordGenerator } from '@/components/tools/PasswordGenerator';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('password-generator');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <PasswordGenerator />
    </ToolShell>
  );
}
