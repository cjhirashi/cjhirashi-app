/**
 * User Status Chart Component
 * Displays users by status (active, inactive, suspended, pending) using a pie chart
 */

'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Card } from '@/components/ui/card'
import type { DashboardStats } from '@/lib/db/views'

export interface UserStatusChartProps {
  stats: DashboardStats
}

const COLORS = {
  active: '#10b981',
  inactive: '#6b7280',
  suspended: '#ef4444',
  pending: '#f59e0b',
}

interface ChartData {
  name: string
  value: number
  color: string
}

const statusLabels: Record<string, string> = {
  active: 'Activos',
  inactive: 'Inactivos',
  suspended: 'Suspendidos',
  pending: 'Pendientes',
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ value: number; name: string; color: string }>
}) {
  if (active && payload && payload.length) {
    const { value, name } = payload[0]
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-2 text-sm">
        <p className="font-semibold">{name}</p>
        <p className="text-foreground">{value} usuarios</p>
      </div>
    )
  }
  return null
}

export function UserStatusChart({ stats }: UserStatusChartProps) {
  const data: ChartData[] = [
    {
      name: statusLabels.active,
      value: Number(stats.active_users),
      color: COLORS.active,
    },
    {
      name: statusLabels.inactive,
      value: Number(stats.inactive_users),
      color: COLORS.inactive,
    },
    {
      name: statusLabels.suspended,
      value: Number(stats.suspended_users),
      color: COLORS.suspended,
    },
    {
      name: statusLabels.pending,
      value: Number(stats.pending_users),
      color: COLORS.pending,
    },
  ].filter(item => item.value > 0)

  if (data.length === 0) {
    return (
      <Card className="p-6">
        <div className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">Sin datos disponibles</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Usuarios por Estado</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data as unknown as Record<string, unknown>[]}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry: unknown) => {
              const item = entry as { name?: string; value?: number }
              return `${item.name}: ${item.value}`
            }}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  )
}
