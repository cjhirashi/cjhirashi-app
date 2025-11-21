/**
 * Role Distribution Chart Component
 * Displays users by role (admin, moderator, user) using a horizontal bar chart
 */

'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { Card } from '@/components/ui/card'
import type { DashboardStats } from '@/lib/db/views'

export interface RoleDistributionChartProps {
  stats: DashboardStats
}

const COLORS = {
  admin: '#3b82f6',
  moderator: '#a855f7',
  user: '#6b7280',
}

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  moderator: 'Moderador',
  user: 'Usuario',
}

interface ChartData {
  name: string
  cantidad: number
  fill: string
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ value: number; name: string }>
}) {
  if (active && payload && payload.length) {
    const { value } = payload[0]
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-2 text-sm">
        <p className="text-foreground font-semibold">{value} usuarios</p>
      </div>
    )
  }
  return null
}

export function RoleDistributionChart({ stats }: RoleDistributionChartProps) {
  const data: ChartData[] = [
    {
      name: roleLabels.admin,
      cantidad: Number(stats.total_admins),
      fill: COLORS.admin,
    },
    {
      name: roleLabels.moderator,
      cantidad: Number(stats.total_moderators),
      fill: COLORS.moderator,
    },
    {
      name: roleLabels.user,
      cantidad: Number(stats.total_regular_users),
      fill: COLORS.user,
    },
  ]

  const totalUsers = Number(stats.total_users) || 1

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Distribución de Roles</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          layout="horizontal"
          margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="cantidad" fill="#8884d8" radius={[0, 8, 8, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Role percentages */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
        {data.map((role) => (
          <div key={role.name} className="text-center">
            <div
              className="w-3 h-3 rounded-full mx-auto mb-2"
              style={{ backgroundColor: role.fill }}
            />
            <p className="text-xs font-medium text-muted-foreground">{role.name}</p>
            <p className="text-lg font-bold mt-1">
              {Math.round((role.cantidad / totalUsers) * 100)}%
            </p>
            <p className="text-xs text-muted-foreground">{role.cantidad} usuarios</p>
          </div>
        ))}
      </div>
    </Card>
  )
}
