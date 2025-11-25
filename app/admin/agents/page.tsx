/**
 * Admin - Agents Management List
 */

import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/server';
import { prisma } from '@/lib/db/prisma';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Bot, Plus, Edit } from 'lucide-react';

export default async function AdminAgentsPage() {
  await requireAdmin();

  const agents = await prisma.agents.findMany({
    include: {
      agent_models: {
        select: {
          tier: true,
        },
      },
      _count: {
        select: {
          projects: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold">Agents Management</h1>
            <p className="text-sm text-muted-foreground">
              Configure AI agents and their capabilities
            </p>
          </div>
        </div>

        <Link href="/admin/agents/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Agent
          </Button>
        </Link>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Specialization</TableHead>
              <TableHead>Models</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No agents found. Create your first agent.
                </TableCell>
              </TableRow>
            ) : (
              agents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium">{agent.name}</TableCell>
                  <TableCell>
                    {agent.specialization ? (
                      <Badge variant="secondary">{agent.specialization}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {agent.agent_models.map((model) => (
                        <Badge key={model.tier} variant="outline" className="text-xs">
                          {model.tier}
                        </Badge>
                      ))}
                      {agent.agent_models.length === 0 && (
                        <span className="text-muted-foreground text-sm">No models</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{agent._count.projects}</TableCell>
                  <TableCell>
                    <Badge variant={agent.is_active ? 'default' : 'secondary'}>
                      {agent.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/agents/${agent.id}`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
