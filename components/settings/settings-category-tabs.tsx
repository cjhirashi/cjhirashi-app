'use client'

/**
 * Settings Category Tabs Component
 *
 * Tabbed navigation for switching between settings categories
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, Shield, Sparkles, Wrench } from 'lucide-react'
import type { SettingCategory } from '@/lib/types/settings'

interface SettingsCategoryTabsProps {
  categories: SettingCategory[]
  activeCategory: string
  onCategoryChange: (category: string) => void
  children?: React.ReactNode
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Settings,
  Shield,
  Sparkles,
  Wrench,
}

export function SettingsCategoryTabs({
  categories,
  activeCategory,
  onCategoryChange,
}: SettingsCategoryTabsProps) {
  return (
    <Tabs value={activeCategory} onValueChange={onCategoryChange}>
      <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => {
          const Icon = iconMap[category.icon] || Settings
          return (
            <TabsTrigger key={category.name} value={category.name} className="gap-2">
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{category.label}</span>
            </TabsTrigger>
          )
        })}
      </TabsList>

      {categories.map((category) => (
        <TabsContent key={category.name} value={category.name} className="mt-6">
          {/* Content will be passed as children from parent */}
        </TabsContent>
      ))}
    </Tabs>
  )
}
