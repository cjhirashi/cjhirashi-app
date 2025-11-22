# Deployment Strategy - CJHIRASHI APP

**Version**: 1.0
**Created**: 2025-11-21 (Bootstrap Phase)
**Last Updated**: 2025-11-21
**Status**: Initial Documentation

---

## Overview

This document outlines the deployment strategy for CJHIRASHI APP, including hosting platforms, CI/CD pipelines, environment management, and rollout procedures.

---

## Hosting Architecture

### Current Platform: Vercel

**Decision**: Deploy on Vercel as primary hosting platform

**Rationale**:
- Native Next.js support
- Automatic deployments from Git
- Edge and Serverless functions
- Zero-config setup
- Global CDN
- Built-in preview environments

**Vercel Features Used**:
- ✅ Automatic Git deployments
- ✅ Preview deployments (pull requests)
- ✅ Edge middleware execution
- ✅ Serverless API routes
- 🔄 Analytics (planned)
- 🔄 Web Vitals monitoring (planned)

---

### Database Hosting: Supabase

**Platform**: Supabase Cloud

**Configuration**:
- PostgreSQL 15+
- Connection pooling enabled
- Row-Level Security (RLS) policies active
- Automatic backups (daily)

**Regions**:
- Primary: TBD (closest to majority of users)
- Backup: TBD (disaster recovery)

---

### Vector Database: Qdrant Cloud (Planned)

**Platform**: Qdrant Cloud

**Configuration**:
- Managed vector database
- Automatic scaling
- High availability setup

**Status**: 🔄 Pending RAG System implementation (Phase 3)

---

## Environment Strategy

### Environment Types

#### 1. Development (Local)

**Purpose**: Active development and testing

**Configuration**:
- Local Next.js dev server (`npm run dev`)
- Supabase local instance (optional) OR staging database
- Environment variables in `.env.local`

**Access**: Developers only

---

#### 2. Preview (Vercel)

**Purpose**: Feature review and testing before merge

**Trigger**: Automatic on pull request creation

**Configuration**:
- Unique preview URL per PR
- Separate database (staging or preview-specific)
- Environment variables from Vercel project settings

**Access**: Developers + stakeholders (via preview URL)

**Lifecycle**: Deleted after PR is merged or closed

---

#### 3. Staging (Vercel)

**Purpose**: Pre-production testing and validation

**Branch**: `staging` (or `develop`)

**Configuration**:
- Staging database (Supabase)
- Production-like environment variables
- Test data (not production data)

**Access**: Developers + QA team + select stakeholders

**Deployment**: Automatic on push to `staging` branch

---

#### 4. Production (Vercel)

**Purpose**: Live user-facing application

**Branch**: `main`

**Configuration**:
- Production database (Supabase)
- Production environment variables
- Real user data

**Access**: Public (authenticated users)

**Deployment**: Manual promotion from staging OR automatic on push to `main` (after quality gates)

---

## Environment Variables

### Required Variables (All Environments)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...

# Application
NEXT_PUBLIC_APP_URL=https://cjhirashi.vercel.app
```

### Additional Variables (Production)

```bash
# Analytics (Planned)
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=...

# AI Providers (Planned)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...

# Vector Database (Planned)
QDRANT_URL=https://...
QDRANT_API_KEY=...

# Billing (Planned)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Environment Variable Management

**Storage**: Vercel Environment Variables UI

**Security**:
- ✅ Never commit secrets to Git
- ✅ Use Vercel's encrypted storage
- ✅ Rotate keys regularly
- ✅ Separate keys per environment

---

## CI/CD Pipeline

### Current Pipeline (Vercel Git Integration)

```
┌─────────────────┐
│  Developer      │
│  commits to Git │
└────────┬────────┘
         │
         ↓
┌─────────────────────┐
│  Vercel detects     │
│  new commit         │
└────────┬────────────┘
         │
         ↓
┌─────────────────────┐
│  Build Phase        │
│  - npm install      │
│  - npm run build    │
│  - Type checking    │
│  - ESLint           │
└────────┬────────────┘
         │
         ↓
┌─────────────────────┐
│  Deploy Phase       │
│  - Upload assets    │
│  - Configure CDN    │
│  - Health check     │
└────────┬────────────┘
         │
         ↓
┌─────────────────────┐
│  Live               │
│  (or Preview URL)   │
└─────────────────────┘
```

---

### Planned Enhancements (GitHub Actions)

**Phase**: QA & Testing (Phase 6)

**Additional Steps**:
1. **Automated Testing**
   - Unit tests (Vitest)
   - Integration tests
   - E2E tests (Playwright) on critical paths

2. **Code Quality Checks**
   - TypeScript type checking
   - ESLint
   - Prettier formatting
   - Dependency vulnerability scan

3. **Security Scanning**
   - SAST (Static Application Security Testing)
   - Dependency audit
   - Secrets scanning

4. **Performance Checks**
   - Lighthouse CI
   - Bundle size analysis
   - Core Web Vitals validation

**Quality Gates**:
- ✅ All tests passing
- ✅ No TypeScript errors
- ✅ No high-severity security issues
- ✅ Bundle size within limits

---

## Deployment Workflows

### Feature Development Workflow

```
1. Create feature branch from main
   ↓
2. Develop feature locally
   ↓
3. Push to feature branch
   ↓
4. Vercel creates preview deployment
   ↓
5. Review and test in preview
   ↓
6. Create pull request to main
   ↓
7. Code review + automated checks
   ↓
8. Merge to main
   ↓
9. Automatic production deployment (or staging first)
   ↓
10. Monitor production
```

---

### Hotfix Workflow

```
1. Create hotfix branch from main
   ↓
2. Implement fix with minimal changes
   ↓
3. Test in preview deployment
   ↓
4. Create pull request (expedited review)
   ↓
5. Merge to main
   ↓
6. Immediate production deployment
   ↓
7. Monitor for issues
   ↓
8. Backport fix to development branches if needed
```

---

### Database Migration Workflow

```
1. Develop migration locally
   ↓
2. Test migration on local/staging database
   ↓
3. Create migration script (Prisma or SQL)
   ↓
4. Review migration (backward compatibility check)
   ↓
5. Apply to staging database
   ↓
6. Test application on staging
   ↓
7. Schedule production migration (maintenance window if needed)
   ↓
8. Apply to production database
   ↓
9. Verify migration success
   ↓
10. Deploy application code
```

**Critical**:
- Always test migrations on staging first
- Ensure backward compatibility during zero-downtime deployments
- Have rollback plan ready

---

## Rollback Strategy

### Application Rollback (Vercel)

**Method**: Instant rollback to previous deployment

**Steps**:
1. Navigate to Vercel deployments
2. Select previous stable deployment
3. Click "Promote to Production"
4. Deployment reverted instantly (no build required)

**Recovery Time**: < 1 minute

---

### Database Rollback

**Method**: Point-in-time recovery (Supabase)

**Steps**:
1. Identify rollback point (timestamp)
2. Create new database from backup
3. Update application to point to restored database
4. Validate data integrity

**Recovery Time**: 5-30 minutes (depending on database size)

**Critical**:
- Data loss possible for transactions after rollback point
- Coordinate with users (maintenance mode)

---

## Monitoring & Observability

### Current Monitoring

**Manual Checks**:
- Vercel deployment logs
- Supabase database logs
- Custom audit logs (admin actions)

---

### Planned Monitoring (Phase 7+)

**Application Performance**:
- Vercel Analytics
- Core Web Vitals
- API response times
- Server Action execution times

**Error Tracking**:
- Error logging service (TBD: Sentry, LogRocket)
- Exception alerts
- User feedback integration

**Database Performance**:
- Query performance monitoring
- Connection pool metrics
- Slow query logs

**Business Metrics**:
- User signups
- Active users
- AI usage (requests, tokens)
- Cost tracking (per provider)

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Database migrations prepared and tested on staging
- [ ] Environment variables verified
- [ ] Documentation updated
- [ ] Changelog updated

### Deployment

- [ ] Merge to main (or staging)
- [ ] Vercel build successful
- [ ] Health check passed
- [ ] Manual smoke test on production
- [ ] Database migrations applied (if any)

### Post-Deployment

- [ ] Monitor error rates (first 15 minutes)
- [ ] Verify critical user flows
- [ ] Check performance metrics
- [ ] Notify team of successful deployment
- [ ] Document any issues encountered

---

## Security Considerations

### Deployment Security

1. **Access Control**:
   - Limit Vercel project access to authorized team members only
   - Use strong authentication (2FA enabled)

2. **Environment Variables**:
   - Never expose secrets in client-side code
   - Rotate API keys regularly
   - Use `NEXT_PUBLIC_` prefix only for truly public variables

3. **Build Security**:
   - Dependency vulnerability scanning
   - Lock file integrity checks (`package-lock.json`)

4. **Runtime Security**:
   - RLS policies enforced
   - CORS configured correctly
   - Rate limiting on API routes (planned)

---

## Disaster Recovery

### Backup Strategy

**Database Backups** (Supabase):
- Automatic daily backups (retained 7 days)
- Manual backups before major migrations

**Code Repository** (GitHub):
- Full Git history
- Protected main branch

**Environment Configuration**:
- Documented in this guide
- Backed up in Vercel project settings

### Recovery Scenarios

| Scenario | Recovery Steps | RTO | RPO |
|----------|---------------|-----|-----|
| **Bad deployment** | Instant rollback in Vercel | < 1 min | 0 |
| **Database corruption** | Restore from backup | < 30 min | < 24 hrs |
| **Vercel outage** | Deploy to alternative platform | < 4 hrs | 0 |
| **Complete data loss** | Restore from backups + Git | < 8 hrs | < 24 hrs |

**RTO**: Recovery Time Objective
**RPO**: Recovery Point Objective

---

## Future Enhancements

### Multi-Region Deployment (Phase 8+)

**Goal**: Reduce latency for global users

**Strategy**:
- Edge middleware (already on Vercel Edge)
- Read replicas for database (Supabase multi-region)
- CDN for static assets (already on Vercel CDN)

---

### Blue-Green Deployment (Advanced)

**Goal**: Zero-downtime deployments with instant rollback

**Strategy**:
- Deploy to "green" environment
- Run smoke tests on green
- Switch traffic from "blue" to "green"
- Keep blue environment for instant rollback

**Status**: 🔄 Not currently needed (Vercel rollback is sufficient)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-21 | Initial deployment strategy documentation |

---

## Related Documentation

- [System Overview](../architecture/system-overview.md)
- [Technology Stack](../architecture/technology-stack.md)
- [Security Architecture](../security/)

---

**Document Version**: 1.0
**Maintained By**: fase-docs (doc-writer)
**Review Cycle**: Quarterly or before major deployment changes
