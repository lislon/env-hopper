---
applyTo: '**'
---

# Post-Edit Type Checking

After completing any file edits, always verify there are no TypeScript errors in the edited files:

```
Use the `get_errors` tool with the edited file paths to check for type errors
```

**When to check:**
- After completing any TypeScript file edits
- Before marking a task as complete
- After multi-file changes that might affect types

**What to look for:**
- Type mismatches
- Missing type annotations
- Generic type constraint violations
- Unnecessary type assertions (warnings)

**How to fix common issues:**
- Add explicit `as any` type assertions for Refine DataProvider generic constraints
- Ensure return types match expected interfaces
- Add proper type guards for union types
- Use type imports (`import type`) where appropriate

**Example workflow:**
1. Edit files
2. Run `get_errors` on edited files
3. Fix any type errors found
4. Re-run `get_errors` to confirm
5. Mark task complete
