# Dashboard Components

Comprehensive dashboard components for the admin panel displaying statistics, charts, activity feeds, and system status.

## Components

### StatsCard
Displays individual statistics with icon, value, trend, and description.

**Props:**
- `title` (string): Label for the statistic
- `value` (number | string): Main value to display
- `description` (string, optional): Description text
- `icon` (LucideIcon, optional): Icon from lucide-react
- `trend` (object, optional): Trend data with value, isPositive, and label
- `variant` ('default' | 'success' | 'warning' | 'danger' | 'info'): Visual variant
- `loading` (boolean, optional): Show skeleton loader

**Example:**
```tsx
<StatsCard
  title="Total Usuarios"
  value={150}
  description="Usuarios registrados"
  icon={Users}
  variant="info"
  trend={{
    value: 12,
    isPositive: true,
    label: "Nuevos este mes"
  }}
/>
```

### UserStatusChart
Pie/Donut chart showing distribution of users by status (active, inactive, suspended, pending).

**Props:**
- `stats` (DashboardStats): Dashboard statistics object

**Status Colors:**
- active: Green (#10b981)
- inactive: Gray (#6b7280)
- suspended: Red (#ef4444)
- pending: Yellow (#f59e0b)

### RoleDistributionChart
Horizontal bar chart showing user distribution by role (admin, moderator, user).

**Props:**
- `stats` (DashboardStats): Dashboard statistics object

**Role Colors:**
- admin: Blue (#3b82f6)
- moderator: Purple (#a855f7)
- user: Gray (#6b7280)

Displays percentages below the chart.

### RecentActivityTable
Scrollable table displaying recent user activities with user info, action, resource, and timestamp.

**Props:**
- `activities` (RecentActivity[]): Array of recent activities

**Features:**
- User avatar with fallback initials
- Activity category badge with color coding
- Relative timestamps (e.g., "hace 5 minutos")
- Link to audit logs page
- Scrollable area with 400px height

### TopUsersList
Card displaying the 5 most active users with stats and progress bars.

**Props:**
- `users` (UserActivitySummary[]): Array of users with activity summary

**Features:**
- User avatar and role/status badges
- Progress bar showing activity percentage
- Activity breakdown (today, week, month)
- Link to user detail page
- Links to all users page

### SystemStatusCard
Displays system health status, last refresh time, and app version.

**Props:**
- `stats` (DashboardStats): Dashboard statistics object
- `appVersion` (string, optional): App version string
- Integrates with `useRefreshStats` hook

**Features:**
- Database connection status
- Last refresh timestamp and time ago
- App version display
- Refresh button with loading state
- Error message display

### QuickActions
Grid of quick access buttons to common admin tasks based on user role.

**Props:**
- `userRole` (UserRole, optional): User's current role
- `canCreateUsers` (boolean, optional): Permission to create users
- `canViewLogs` (boolean, optional): Permission to view logs
- `canManageSettings` (boolean, optional): Permission to manage settings

**Actions by Role:**
- All roles: Users, Roles
- Moderator+: Audit logs, Analytics
- Admin only: Settings

## Usage

### In Page Components

```tsx
import {
  StatsCard,
  UserStatusChart,
  RoleDistributionChart,
  RecentActivityTable,
  TopUsersList,
  SystemStatusCard,
  QuickActions,
} from '@/components/dashboard'
import {
  getDashboardStats,
  getRecentActivity,
  getUserActivitySummary,
} from '@/lib/db/views'

export default async function AdminPage() {
  const [stats, activities, topUsers] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(10),
    getUserActivitySummary(5),
  ])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard {...props} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <UserStatusChart stats={stats} />
        <RoleDistributionChart stats={stats} />
      </div>
      <RecentActivityTable activities={activities} />
      <TopUsersList users={topUsers} />
      <SystemStatusCard stats={stats} />
      <QuickActions userRole={userRole} />
    </div>
  )
}
```

## Hooks

### useRefreshStats
Hook for refreshing dashboard statistics via API call.

**Returns:**
```typescript
{
  refresh: () => Promise<RefreshStatsResult>,
  isLoading: boolean,
  error: string | null
}
```

**Usage:**
```tsx
const { refresh, isLoading, error } = useRefreshStats()

const handleRefresh = async () => {
  try {
    await refresh()
  } catch (err) {
    console.error(err)
  }
}
```

## API Routes

### POST /api/admin/refresh-stats
Refreshes materialized views for dashboard statistics.

**Authentication:** Requires admin role

**Response:**
```json
{
  "success": true,
  "message": "Dashboard statistics refreshed successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Errors:**
- 401: User not authenticated
- 403: Admin access required
- 500: Internal server error

## Styling

All components use Tailwind CSS 4 and shadcn/ui primitives.

### Color Scheme
- Primary: Blue (blue-600)
- Success: Green (green-500)
- Warning: Yellow (amber-500)
- Danger: Red (red-500)
- Info: Blue (blue-500)

### Responsive Design
- Mobile: Full width, stacked layout
- Tablet (md): 2 columns for grids
- Desktop (lg): 3-4 columns for grids
- XL: 4 columns for stats cards

## Dependencies

- `recharts`: Charts and visualizations
- `date-fns`: Date formatting and relative times
- `lucide-react`: Icons
- `shadcn/ui`: UI components
- `clsx`: Class name utility

## Notes

- All components are designed to work with Server Components (except charts which are client components)
- Charts use ResponsiveContainer for mobile responsiveness
- Activity table is scrollable to prevent layout shifts
- All badges and colors follow accessibility standards
- Date formatting uses Spanish locale (es-ES)
