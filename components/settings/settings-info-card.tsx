'use client'

/**
 * Settings Info Card Component
 *
 * Displays informational content about a settings category
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Info, ShieldAlert, Wrench } from 'lucide-react'
import { CATEGORY_DESCRIPTIONS } from '@/lib/constants/settings-categories'

interface SettingsInfoCardProps {
  category: string
}

export function SettingsInfoCard({ category }: SettingsInfoCardProps) {
  const description = CATEGORY_DESCRIPTIONS[category]

  let Icon = Info
  let bgColor = 'bg-blue-50'
  let borderColor = 'border-blue-200'
  let titleColor = 'text-blue-900'
  let textColor = 'text-blue-800'

  switch (category) {
    case 'security':
      Icon = ShieldAlert
      bgColor = 'bg-orange-50'
      borderColor = 'border-orange-200'
      titleColor = 'text-orange-900'
      textColor = 'text-orange-800'
      break
    case 'maintenance':
      Icon = Wrench
      bgColor = 'bg-yellow-50'
      borderColor = 'border-yellow-200'
      titleColor = 'text-yellow-900'
      textColor = 'text-yellow-800'
      break
    case 'features':
      Icon = Info
      bgColor = 'bg-purple-50'
      borderColor = 'border-purple-200'
      titleColor = 'text-purple-900'
      textColor = 'text-purple-800'
      break
  }

  return (
    <Card className={`border-l-4 ${borderColor} ${bgColor}`}>
      <CardHeader className="pb-3">
        <CardTitle className={`flex items-center gap-2 text-base ${titleColor}`}>
          <Icon className="h-5 w-5" />
          Información importante
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-sm ${textColor}`}>{description}</p>
      </CardContent>
    </Card>
  )
}
