'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card } from '@/components/ui/card'
import type { ActionTimelineData } from '@/lib/types/analytics'

interface ActionTimelineChartProps {
  data: ActionTimelineData[]
  interval?: 'hour' | 'day'
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
    payload: ActionTimelineData
  }>
}) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-foreground">{data.date}</p>
        <p>Acciones: {data.count.toLocaleString('es-ES')}</p>
      </div>
    )
  }
  return null
}

export function ActionTimelineChart({
  data,
  interval = 'day',
  height = 300,
}: ActionTimelineChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Timeline de Acciones</h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">Sin datos disponibles</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Timeline de Acciones</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Período: {interval === 'hour' ? 'Por hora' : 'Por día'}
      </p>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data as any} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
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
          <Area
            type="monotone"
            dataKey="count"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorCount)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}
