'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card } from '@/components/ui/card'
import type { UserGrowthData } from '@/lib/types/analytics'

interface UserGrowthChartProps {
  data: UserGrowthData[]
  height?: number
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{
    value: number
    name: string
    color: string
    dataKey: string
  }>
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-foreground mb-2">
          {payload[0].payload.date}
        </p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString('es-ES')}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function UserGrowthChart({
  data,
  height = 300,
}: UserGrowthChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          Crecimiento de Usuarios
        </h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">Sin datos disponibles</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Crecimiento de Usuarios</h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data as Record<string, unknown>[]}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border)"
          />
          <XAxis
            dataKey="date"
            stroke="var(--color-muted-foreground)"
            tick={{ fontSize: 12 }}
          />
          <YAxis stroke="var(--color-muted-foreground)" tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="newUsers"
            name="Usuarios Nuevos"
            stroke="#3b82f6"
            dot={false}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="totalUsers"
            name="Total Usuarios"
            stroke="#10b981"
            dot={false}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="activeUsers"
            name="Usuarios Activos"
            stroke="#f59e0b"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}
