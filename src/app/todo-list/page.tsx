import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { TodoList } from '@/components/tools/TodoList';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('todo-list');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <TodoList />
    </ToolShell>
  );
}
