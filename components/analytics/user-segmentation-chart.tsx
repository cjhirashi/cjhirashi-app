'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card } from '@/components/ui/card'
import type { UserSegment } from '@/lib/types/analytics'

interface UserSegmentationChartProps {
  data: UserSegment[]
  title: string
  height?: number
  barColor?: string
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
    payload: UserSegment
  }>
}) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-foreground">{data.segment}</p>
        <p>Usuarios: {data.count.toLocaleString('es-ES')}</p>
        <p>Porcentaje: {data.percentage.toFixed(1)}%</p>
      </div>
    )
  }
  return null
}

export function UserSegmentationChart({
  data,
  title,
  height = 300,
  barColor = '#3b82f6',
}: UserSegmentationChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">Sin datos disponibles</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data as Record<string, unknown>[]}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border)"
          />
          <XAxis type="number" stroke="var(--color-muted-foreground)" />
          <YAxis
            type="category"
            dataKey="segment"
            stroke="var(--color-muted-foreground)"
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" fill={barColor} />
        </BarChart>
      </ResponsiveContainer>

      {/* Legend below chart */}
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        {data.map((segment, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded"
              style={{ backgroundColor: barColor }}
            />
            <span>
              {segment.segment}: {segment.count} (
              {segment.percentage.toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
