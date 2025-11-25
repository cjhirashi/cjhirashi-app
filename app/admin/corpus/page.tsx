/**
 * Admin - Corpus Management List
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
import { Database, Plus, Edit } from 'lucide-react';

export default async function AdminCorpusPage() {
  await requireAdmin();

  const corpora = await prisma.corpora.findMany({
    include: {
      owner_user: {
        select: {
          email: true,
        },
      },
      _count: {
        select: {
          corpus_documents: true,
          embeddings: true,
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
          <Database className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold">Corpus Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage global and personal knowledge bases
            </p>
          </div>
        </div>

        <Link href="/admin/corpus/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Global Corpus
          </Button>
        </Link>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Embeddings</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {corpora.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No corpus found. Create your first global corpus.
                </TableCell>
              </TableRow>
            ) : (
              corpora.map((corpus) => (
                <TableRow key={corpus.id}>
                  <TableCell className="font-medium">{corpus.name}</TableCell>
                  <TableCell>
                    <Badge variant={corpus.corpus_type === 'global' ? 'default' : 'secondary'}>
                      {corpus.corpus_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {corpus.owner_user?.email || (
                      <span className="text-muted-foreground">Global (No owner)</span>
                    )}
                  </TableCell>
                  <TableCell>{corpus._count.corpus_documents}</TableCell>
                  <TableCell>{corpus._count.embeddings}</TableCell>
                  <TableCell>
                    <Badge variant={corpus.is_active ? 'default' : 'secondary'}>
                      {corpus.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/corpus/${corpus.id}`}>
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
