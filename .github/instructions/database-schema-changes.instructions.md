# Database Schema Change Workflow

When modifying the database schema, follow these steps in order to ensure all parts of the system stay synchronized.

## Overview of Changes Needed

Database schema changes typically require updates across multiple layers:
1. **Database**: Prisma schema definition
2. **Backend**: Types, validation schemas, data transformations
3. **Frontend**: Components, forms, display logic
4. **Data**: Seed scripts and test data

## Step-by-Step Process

### 1. Update Prisma Schema
Edit `packages/backend-core/prisma/schema.prisma`:
- Add/remove/rename fields
- Change field types or constraints (nullable, unique, default values)
- Update indexes if needed
- Add comments for JSON fields to document their structure

**Example:**
```prisma
model DbAppForCatalog {
  id          String @id @default(cuid())
  slug        String @unique  // Added
  displayName String          // Renamed from 'name'
  
  @@index([displayName])      // Updated index
}
```

### 2. Update Backend TypeScript Types
Update corresponding TypeScript interfaces in `packages/backend-core/src/types/`:
- Match field names exactly to schema
- Update optional/required field markers
- Keep type definitions synchronized with Prisma model

**Location examples:**
- `packages/backend-core/src/types/common/appCatalogTypes.ts`

### 3. Update Validation Schemas
Update Zod schemas in backend routers:
- Add/remove/rename fields in CreateSchema and UpdateSchema
- Update validation rules (min, max, regex patterns)
- Adjust optional/required fields

**Example:**
```typescript
const CreateSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  displayName: z.string().min(1),  // Renamed from 'name'
  // ... other fields
})
```

### 4. Update Table Sync Configuration
**⚠️ CRITICAL**: If you change which field(s) identify unique records, update the table sync:

Edit `packages/backend-core/src/db/tableSyncMagazine.ts`:
```typescript
export const TABLE_SYNC_MAGAZINE = {
  DbAppForCatalog: {
    prismaModelName: 'DbAppForCatalog',
    uniqColumns: ['slug'],  // Updated from ['name']
  },
}
```

**Why this matters**: Table sync uses these columns to determine if a record should be created or updated during seeding.

### 5. Update Data Transformation Functions
Update any functions that map between different data representations:

For AppForCatalog, edit `packages/backend-core/src/db/syncAppCatalog.ts`:
- Add new required fields with appropriate defaults/transformations
- Update field mappings for renamed fields
- Handle backward compatibility for optional fields

**Example:**
```typescript
const dbApps = apps.map((app) => ({
  slug: app.slug ?? app.displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  displayName: app.displayName,  // Renamed from 'name'
  // ... other fields
}))
```

### 6. Regenerate Prisma Client
```bash
pnpm run prisma:generate
```

**What this does:**
- Regenerates `@prisma/client` with updated types
- Creates/updates type definitions in `node_modules`
- Updates `packages/backend-core/src/generated/` files

**⚠️ Important**: TypeScript may not immediately pick up these changes. You may need to:
1. Restart VS Code's TypeScript server (Cmd/Ctrl+Shift+P → "TypeScript: Restart TS Server")
2. Restart the dev server
3. Wait a few seconds for IntelliSense to refresh

### 7. Apply Schema to Database
Choose one of these approaches:

#### Option A: Schema Only (Recommended during development)
```bash
pnpm run prisma:push
```
- Applies schema changes
- Force resets database
- **Does NOT run seed scripts**
- Safe when seed data isn't updated yet

#### Option B: Schema + Seed (Full reset)
```bash
pnpm run db:repush
```
- Runs: `prisma:generate` → `prisma:push` → `prisma:seed`
- **⚠️ WILL FAIL if seed data doesn't match new schema**
- Only use after updating ALL seed data sources

### 8. Update Seed Data (If Seeding)
**⚠️ CRITICAL**: Update seed data BEFORE running `db:repush`

**Locations to check:**
- `examples/backend-example/src/scripts/syncAppCatalog.ts` (sample fallback data)
- `examples/backend-example/src/local/appCatalog.ts` (main seed data - may be gitignored)
- Any test fixtures in `__tests__/` directories

**Common mistakes:**
- Forgetting to update local data files (gitignored)
- Missing required fields in seed data
- Field name mismatches after renames

**What to update:**
- Add new required fields
- Rename fields to match schema
- Update field values to match validation rules

### 9. Update Backend Routes/Controllers
Update any backend code that uses the changed fields:
- Router handlers (create, update, list endpoints)
- Query filters and ordering (e.g., `orderBy: { displayName: 'asc' }`)
- Response formatting
- Default values in mutations

**Example locations:**
- `packages/backend-core/src/modules/*/routers.ts`
- REST controllers in `packages/backend-core/src/modules/*/controllers.ts`

### 10. Update Frontend Components
Update UI code that references changed fields:

**Table columns:**
```typescript
columnHelper.accessor('displayName', {  // Renamed from 'name'
  header: 'Name',
  cell: (info) => <span>{info.getValue()}</span>,
})
```

**Forms:**
```typescript
<Input
  id="displayName"
  value={formData.displayName}
  onChange={(e) => setFormData({...formData, displayName: e.target.value})}
/>
```

**Display components:**
```typescript
<h1>{app.displayName}</h1>  {/* Renamed from app.name */}
```

**Common locations:**
- `packages/frontend-core/src/modules/*/` - Feature-specific components
- `packages/frontend-core/src/routes/*/` - Route-level components

### 11. Check for Type Errors
```bash
pnpm run test:types
```

Or check VS Code's Problems panel for errors in edited files.

**Common issues:**
- Old field names in component props
- Missing fields in mutation payloads
- Type mismatches after field type changes
- Stale imports from regenerated types

### 12. Test the Changes
**Manual testing:**
- Start dev servers (`pnpm run dev`)
- Test create operations with new required fields
- Test update operations (check all fields save correctly)
- Test list/display (renamed fields show correctly)
- Test validation (new constraints work)

**Automated testing:**
```bash
pnpm run test:frontend
```

---

## Command Reference

### Development Commands
```bash
# Regenerate Prisma client only
pnpm run prisma:generate

# Apply schema without seeding (safest during development)
pnpm run prisma:push

# Full reset: generate + push + seed
pnpm run db:repush
# ⚠️ Fails if seed data doesn't match schema - update seed data first!
---

## Common Issues & Solutions

### Issue: "Prisma client types not updated" / "Property X does not exist"
**Symptoms:**
- TypeScript shows old field names
- Properties appear as `never` type
- IntelliSense doesn't show new fields

**Solutions:**
1. Re-run `pnpm run prisma:generate`
2. Restart TypeScript server: Cmd/Ctrl+Shift+P → "TypeScript: Restart TS Server"
3. Close and reopen the file
4. Restart VS Code if still not working
5. Check that `node_modules/@prisma/client` was updated (compare timestamps)

### Issue: "Argument X is missing" during seed/sync
**Symptoms:**
- `db:repush` fails with Prisma validation error
- Error shows which field is missing

**Solutions:**
1. Check `packages/backend-core/src/db/syncAppCatalog.ts` includes the field
2. Verify seed data files have the required field:
   - `examples/backend-example/src/scripts/syncAppCatalog.ts` (fallback data)
   - `examples/backend-example/src/local/appCatalog.ts` (main data)
3. Add default/generated values for new required fields:
   ```typescript
   fieldName: data.fieldName ?? generateDefault()
   ```
4. Or skip seeding and use `pnpm run prisma:push` instead
---

## Checklist for Schema Changes

Use this checklist to ensure you haven't missed any steps:

### Backend Changes
- [ ] Updated `packages/backend-core/prisma/schema.prisma`
- [ ] Updated TypeScript types in `packages/backend-core/src/types/`
- [ ] Updated Zod validation schemas in relevant routers
- [ ] Updated `packages/backend-core/src/db/tableSyncMagazine.ts` (if unique columns changed)
- [ ] Updated data transformation in `packages/backend-core/src/db/syncAppCatalog.ts`
- [ ] Updated query filters/ordering in router handlers
- [ ] Updated seed data files (if using seeding)

### Prisma Operations
- [ ] Ran `pnpm run prisma:generate` successfully
- [ ] Ran `pnpm run prisma:push` successfully
- [ ] Restarted TypeScript server (Cmd/Ctrl+Shift+P → "Restart TS Server")

### Frontend Changes
- [ ] Updated table columns to use new field names
- [ ] Updated form inputs and labels
- [ ] Updated display components showing the data
- [ ] Updated any mutation payloads
- [ ] Updated type imports if needed

### Verification
- [ ] No TypeScript errors in edited files
- [ ] `pnpm run test:types` passes
- [ ] Dev server starts without errors
- [ ] Can create new records with required fields
- [ ] Can update existing records (or database was reset)
- [ ] Data displays correctly in UI
- [ ] Validation works as expected

---

## Tips for Success

**1. Start with schema-only push during development:**
- Use `pnpm run prisma:push` instead of `db:repush`
- Update and test seed data separately
- Reduces iteration time when making multiple changes

**2. Make coordinated changes:**
- Update related files together (schema + types + validation)
- Commit related changes in a single commit
- Document breaking changes for other developers

**3. Watch out for gitignored files:**
- Local seed data may be gitignored (e.g., `examples/backend-example/src/local/`)
- Check `.gitignore` for files that need manual updates
- Document locations of local-only data files

**4. Test incrementally:**
- Generate Prisma client → check types
- Push schema → check database
- Update frontend → check UI
- Don't try to fix everything at once

**5. Use TypeScript to guide you:**
- Let type errors show which files need updates
- Fix errors in backend first, then frontend
- Check Problems panel frequently during refactoring

**6. Keep transformation logic simple:**
- Avoid complex regex replacements on large seed files
- Use explicit field mappings instead of clever tricks
- Consider generating slugs from displayName rather than storing duplicates

### Issue: TanStack Router types out of sync
**Symptoms:**
- Route paths show type errors
- `params` object doesn't have expected properties

**Solution:**
Routes are auto-generated during dev server runtime:
- Restart the dev server (`pnpm run dev`)
- Check `packages/frontend-core/src/routeTree.gen.ts` was regenerated
- Wait 5-10 seconds after server starts for types to generate

### Issue: Renamed field causes undefined values
**Symptoms:**
- Data displays as `undefined` or blank
- Old data doesn't appear after field rename

**Root cause:**
Existing database records have old field name, new schema expects new name.

**Solutions:**
1. Development: Use `pnpm run prisma:push` (force reset drops all data)
2. Production: Create migration that copies data:
   ```sql
   UPDATE "DbAppForCatalog" SET "displayName" = "name";
   ALTER TABLE "DbAppForCatalog" DROP COLUMN "name";
   ```

### Issue: Seed script transforms broke after field rename
**Symptoms:**
- Regex replacements affected wrong fields
- Nested objects have corrupted values
- Provider names or role names got transformed incorrectly

**Solution:**
Field renames in large seed files need careful regex:
```javascript
// Bad: Replaces ALL 'name:' occurrences
content.replace(/name: '([^']+)'/g, `displayName: '$1'`)

// Good: Only replaces at app object level
content.replace(/^(\s+)\{(\r?\n\s+)name: '([^']+)'/gm, 
  '$1{$2slug: "$3",\n$1displayName: "$3"')
```

Or manually update the file to avoid unintended changes.
- Re-run `pnpm run prisma:generate`
- Restart TypeScript server in VS Code (Cmd+Shift+P → "Restart TS Server")

### TanStack Router types out of sync
- Routes are auto-generated by the vite plugin during dev server runtime
- Restart the dev server if route types don't update

### Seed script fails after schema change
- Update seed data structure in `examples/backend-example/src/local/appCatalog.ts` (if exists)
- Or update the mapping in `packages/backend-core/src/db/syncAppCatalog.ts` to handle missing fields

### Table sync fails with "Argument X is missing"
- Ensure all required (non-nullable, no default) fields are included in the transformation
- Add fallback values: `fieldName: data.fieldName ?? defaultValue`

## File Checklist for Schema Changes

- [ ] `packages/backend-core/prisma/schema.prisma`
- [ ] `packages/backend-core/src/types/common/appCatalogTypes.ts` (or relevant type file)
- [ ] Router validation schemas (e.g., `appCatalogAdminRouter.ts`)
- [ ] `packages/backend-core/src/db/tableSyncMagazine.ts` (if unique constraint changed)
- [ ] `packages/backend-core/src/db/syncAppCatalog.ts` (data transformation)
- [ ] Run `pnpm run prisma:generate`
- [ ] Run `pnpm run prisma:push`
- [ ] Update frontend components using the changed fields
- [ ] Run `pnpm run test:types` to verify
