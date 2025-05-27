# Backend Development Instructions

## Resetting the Database on Schema Changes

If you are actively developing and your Prisma schema changes often, and you **do not care about preserving data**, follow this workflow:

### 1. Modify the Prisma Schema
Edit `prisma/schema.prisma` as needed.

### 2. Reset and Apply the Schema
Run the following command from the `apps/backend` directory:

```
pnpm prisma db push --force-reset
```

- This will **drop all tables and data** in your development database.
- It will then recreate the tables according to your latest schema.
- No migration files will be created or needed.

### 3. (Optional) Seed the Database
If you have a seed script, run it to populate initial data.

### 4. Start the Development Server
```
pnpm dev
```

---

**Note:**
- This workflow is for development only. **Never use `--force-reset` in production!**
- If you need to preserve data or deploy to production, use Prisma Migrate instead. 