# Dashboard Implementation Guide

## Overview

The admin dashboard provides a comprehensive view of system statistics, user activity, and status monitoring. It is fully integrated with the database views and supports real-time data refresh.

## Features Implemented

### 1. Statistics Cards (6 cards)
- **Total Usuarios**: Total registered users with monthly growth trend
- **Usuarios Activos**: Active users with percentage of total
- **Administradores**: Count of admins and moderators
- **Acciones Hoy**: Actions in last 24 hours vs weekly average
- **Nuevos Usuarios (Mes)**: New users this month with weekly breakdown
- **Acciones Semana**: Weekly actions with daily average

Each card includes:
- Icon representation (lucide-react)
- Trend indicator with percentage and direction
- Color-coded variant for visual differentiation
- Responsive grid layout

### 2. Charts

#### User Status Chart (Pie/Donut)
- Displays user distribution by status
- Categories: Active, Inactive, Suspended, Pending
- Interactive tooltips showing user counts
- Legend with status names in Spanish
- Color-coded by status for quick identification

#### Role Distribution Chart (Horizontal Bar)
- Shows user count by role
- Categories: Admin, Moderator, User
- Displays percentages below chart
- Color-coded by role
- Responsive container for mobile devices

### 3. Recent Activity Table
- Shows last 10 activities by default
- Columns:
  - User avatar with fallback initials
  - User name/email
  - Action with category badge
  - Resource type (if applicable)
  - Relative timestamp (e.g., "hace 5 minutos")
- Features:
  - Scrollable area (400px height)
  - Color-coded activity category badges
  - Link to full audit logs page
  - Handles empty state gracefully

### 4. Top Users List
- Displays 5 most active users
- For each user:
  - Avatar with initials
  - Name, email, role, status badges
  - Total action count with progress bar
  - Activity breakdown (today, week, month)
  - Link to user detail page
- Features:
  - Interactive hover states
  - Progress bar shows percentage of max actions
  - Activity stats grid

### 5. System Status Card
- Database connection status indicator
- Last refresh timestamp with relative time
- App version display
- Refresh button that triggers:
  - API call to `/api/admin/refresh-stats`
  - Loading state with spinner
  - Error handling with display
- Authentication: Admin only

### 6. Quick Actions
- Context-aware action buttons
- Available actions:
  - Users: All roles
  - Roles: All roles
  - Audit Logs: Moderator+
  - Analytics: Admin+
  - Settings: Admin+
- Grid layout (5 columns on desktop, 2 on mobile)

## Data Flow

```
Admin Page (Server Component)
    │
    ├─> getDashboardStats()
    │   └─> StatsCard × 6
    │   └─> UserStatusChart
    │   └─> RoleDistributionChart
    │   └─> SystemStatusCard
    │
    ├─> getRecentActivity(10)
    │   └─> RecentActivityTable
    │
    └─> getUserActivitySummary(5)
        └─> TopUsersList
```

## File Structure

```
components/dashboard/
├── stats-card.tsx          # Individual stat display
├── user-status-chart.tsx   # Pie chart by status
├── role-distribution-chart.tsx  # Bar chart by role
├── recent-activity-table.tsx    # Activity feed
├── top-users-list.tsx      # Most active users
├── system-status-card.tsx  # System health & refresh
├── quick-actions.tsx       # Quick access buttons
├── index.tsx              # Component exports
└── README.md              # Component documentation

app/admin/
├── page.tsx               # Main dashboard page
├── layout.tsx             # Admin layout wrapper
└── DASHBOARD_GUIDE.md     # This file

app/api/admin/
└── refresh-stats/
    └── route.ts           # Refresh endpoint

hooks/
└── use-refresh-stats.ts   # Refresh stats hook

lib/db/
├── views.ts               # Database view queries
└── helpers.ts             # Database helpers
```

## Database Dependencies

### Views Used
1. **admin_dashboard_stats** - Materialized view with:
   - User counts by status (total, active, inactive, suspended, pending)
   - New users (today, week, month)
   - Role counts (admin, moderator, user)
   - Action counts (today, week)
   - Last refresh timestamp

2. **recent_activity** - View with:
   - Audit log entries
   - User information (name, email, role)
   - Action details (action, category, resource)
   - Timestamps

3. **user_activity_summary** - View with:
   - User profiles with roles and status
   - Activity counts (total, today, week, month)
   - Last login timestamp
   - User creation date

## API Endpoints

### POST /api/admin/refresh-stats
Refreshes materialized views.

**Request:**
```bash
POST /api/admin/refresh-stats
Authorization: Bearer <session-token>
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Dashboard statistics refreshed successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response (Error):**
- 401: Unauthorized (not authenticated)
- 403: Forbidden (not admin)
- 500: Server error

## Styling System

### Colors by Category
**User Status:**
- Active: Green (#10b981)
- Inactive: Gray (#6b7280)
- Suspended: Red (#ef4444)
- Pending: Yellow (#f59e0b)

**Roles:**
- Admin: Blue (#3b82f6)
- Moderator: Purple (#a855f7)
- User: Gray (#6b7280)

**Activity Categories:**
- Authentication: Blue
- User Management: Purple
- Content Management: Green
- System: Orange
- Default: Gray

**Stat Card Variants:**
- default: Gray left border
- success: Green left border
- warning: Yellow left border
- danger: Red left border
- info: Blue left border

### Responsive Breakpoints
- Mobile: < 768px (md)
  - Single column layout
  - Full width cards
  - Stacked grid

- Tablet: 768px - 1024px
  - 2 column layout
  - Charts side-by-side

- Desktop: 1024px - 1280px (lg)
  - 3 column layout for stats
  - 2 column layout for charts

- Large: > 1280px (xl)
  - 4 column layout for stats

## Accessibility

### ARIA Labels
- Charts include tooltips
- Badges have semantic meaning
- Buttons have descriptive labels
- Navigation links are properly labeled

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Proper tab order
- Focus states visible
- No keyboard traps

### Color Contrast
- All text meets WCAG AA standards
- Badges use sufficient contrast
- Borders and dividers are visible

### Semantic HTML
- Proper heading hierarchy (h1 > h3)
- Lists use semantic `<ul>` elements
- Tables have proper structure
- Links are semantic

## Performance Considerations

1. **Server Component**: Page uses async/await for parallel data fetching
2. **Client Components**: Charts are isolated to prevent rerenders
3. **Caching**: Materialized views provide pre-aggregated data
4. **Responsive Images**: Icons are SVG (lightweight)
5. **Lazy Loading**: Charts only render when visible

## Security

1. **Authentication**: Routes protected by `requireModerator()`
2. **Authorization**: Refresh endpoint requires admin role
3. **Data Privacy**: Sensitive data filtered by user role
4. **Input Validation**: All user inputs validated
5. **API Security**: Proper HTTP status codes and error handling

## Future Enhancements

### Potential Improvements
1. Add date range selectors for custom periods
2. Implement activity graph showing trends over time
3. Add export functionality (CSV, PDF)
4. Real-time updates with WebSocket
5. Custom dashboard layouts per role
6. Comparison with previous periods
7. Alert thresholds and notifications
8. Performance metrics and analytics
9. User engagement scoring
10. Predictive analytics

### Planned Additions
- Activity heatmap
- User retention metrics
- Revenue/performance tracking
- Custom report builder
- Email digest notifications
- Scheduled refresh jobs

## Troubleshooting

### Empty Dashboard
**Cause**: No data in materialized views
**Solution**: Ensure audit_logs, user_profiles, and user_roles tables have data

### Slow Charts
**Cause**: Large dataset
**Solution**: Limit data in views, increase materialized view refresh frequency

### Refresh Button Not Working
**Cause**: User not admin
**Solution**: Verify user role in database

### Incorrect Data
**Cause**: Views not refreshed
**Solution**: Manually call `refreshDashboardStats()` or restart view refresh job

## Testing

### Manual Testing Checklist
- [ ] Dashboard loads for admin users
- [ ] All stats display correct values
- [ ] Charts render properly on desktop/mobile
- [ ] Recent activity shows entries in correct order
- [ ] Top users list shows 5 users sorted by action count
- [ ] System status shows correct refresh time
- [ ] Refresh button works and updates timestamp
- [ ] Quick actions appear based on user role
- [ ] All links navigate to correct pages
- [ ] Responsive design works on mobile devices
- [ ] No console errors
- [ ] Loading states display during data fetch
- [ ] Error states display gracefully

### Test Data
See `/lib/db/examples.ts` for sample data creation scripts.

## Deployment Notes

1. Ensure database views are created before deployment
2. Configure cron job for periodic view refreshes (optional)
3. Test refresh endpoint with admin account
4. Verify all dependencies are installed (recharts, date-fns)
5. Check environment variables are set
6. Monitor initial dashboard load time
7. Set up alerts for view refresh failures

## Contact & Support

For issues or questions about the dashboard:
1. Check this guide and component README.md
2. Review database views in migrations
3. Check API endpoint error logs
4. Verify user permissions and roles
5. Review TypeScript types in lib/auth/types.ts
