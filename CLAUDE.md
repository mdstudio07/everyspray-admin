# Claude Code Project Rules

## Change Tracking
1. **All changes must be documented in changelog.md**
   - Add detailed entries for every modification, addition, or deletion
   - Include file paths, function names, and purpose of changes
   - Update changelog.md before completing any task

## Naming Conventions
2. **Consistent naming throughout the project:**
   - **Functions/Variables/Classes**: PascalCase (e.g., `getUserData`, `ApiResponse`, `handleSubmitForm`)
   - **File names**: kebab-case lowercase (e.g., `user-profile.tsx`, `api-service.ts`, `form-handler.js`)

## Decision Making
3. **Always ask for guidance when choosing between options:**
   - Package selection (when multiple viable options exist)
   - Architecture approaches (patterns, data flow, component structure)
   - Implementation strategies (when trade-offs are involved)
   - Wait for user confirmation before proceeding with significant decisions

## Commands to run for verification
- Lint: `npm run lint` (if available)
- Typecheck: `npm run typecheck` (if available)
- Tests: `npm test` (if available)