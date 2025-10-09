# Claude Code Project Rules

## Change Tracking
1. **All changes must be documented in changelog.md**
   - Add detailed entries for every modification, addition, or deletion
   - Include file paths, function names, and purpose of changes
   - Update changelog.md before completing any task

## Naming Conventions
2. **Consistent naming throughout the project:**
   - **Functions/Variables/Classes**: PascalCase (e.g., `getUserData`, `ApiResponse`, `handleSubmitForm`)
   - **File names**: kebab-case lowercase for ALL files (e.g., `user-profile.tsx`, `api-service.ts`, `form-handler.js`)
   - **Documentation files**: kebab-case lowercase (e.g., `readme.md`, `claude.md`, `auth-flow-explained.md`)
   - **NO UPPERCASE**: Never use UPPERCASE or PascalCase for file names (wrong: `README.md`, `CLAUDE.md`, `AUTH_FLOW_EXPLAINED.md`)

## Decision Making
3. **Always ask for guidance when choosing between options:**
   - Package selection (when multiple viable options exist)
   - Architecture approaches (patterns, data flow, component structure)
   - Implementation strategies (when trade-offs are involved)
   - Wait for user confirmation before proceeding with significant decisions

## Design Consistency Rules
4. **The entire project MUST follow strict design consistency:**
   - **Colors**: Use ONLY the official shadcn/ui color scheme provided (see Color Schema section below)
   - **Dark/Light Mode**: ALL components must work in both light and dark modes seamlessly
   - **Fonts**: Maintain consistent font families, weights, and sizes throughout the application
   - **Headings**: Use standardized heading hierarchy (h1, h2, h3) with consistent sizing and spacing
   - **Shapes**: Consistent border-radius using --radius (0.625rem), shadows, and geometric elements
   - **Alignment**: Proper alignment rules for text, buttons, forms, and layout elements
   - **Spacing**: Consistent padding, margins, and gaps using a unified spacing system
   - **Components**: If same components are used in different places (buttons, cards, forms), they MUST look identical
   - **Sizing**: Consistent sizing for similar elements (same button sizes, same card dimensions, same input fields)
   - **Typography**: Simple yet professional fonts with consistent line-heights and letter-spacing
   - **Visual Hierarchy**: Clear distinction between primary, secondary, and tertiary elements

## Color Schema (Official shadcn/ui)
5. **MANDATORY Color Variables:**
   - All official shadcn/ui colors are defined in `src/app/globals.css`
   - Use ONLY the CSS variables defined in globals.css for all components
   - Never use hardcoded colors - always reference CSS variables

## Dark/Light Mode Requirements
6. **EVERY component must be designed with both modes in mind:**
   - Use CSS variables for colors (hsl() functions with var() references)
   - Test all components in both light and dark modes before completion
   - Ensure proper contrast ratios in both modes
   - Use semantic color names (background, foreground, primary, etc.) not specific colors
   - All text must be readable in both modes
   - All interactive elements (buttons, links, forms) must work in both modes

## Folder Structure Rules
7. **Project structure documentation in project-overview.md:**
   - Each folder and page purpose is documented in project-overview.md
   - When updating any folder structure, update the overview documentation
   - Maintain detailed descriptions of what each page does and its role access

## UI Development & Testing
8. **Development UI Testing Page:**
   - **Location**: `/ui-testing` (development only)
   - **Purpose**: Comprehensive showcase of all UI components, colors, fonts, animations
   - **Features**: Live theme toggle to test light/dark mode appearance
   - **Contents**: All shadcn/ui components, color palette, typography, icons, loading states
   - **Usage**: Access `/ui-testing` during development to see how components look together
   - **Icons**: Preference for Radix icons with Lucide fallback (configured in `src/lib/icons.ts`)

## Responsive Design Requirements
9. **MANDATORY: Multi-Device Native Experience:**
   - **Mobile First**: Design for mobile (320px+), then scale up to tablet and desktop
   - **Breakpoints**: Mobile (320-768px), Tablet (768-1024px), Desktop (1024px+)
   - **Touch Targets**: Minimum 44px touch targets on mobile, accessible spacing
   - **Native Feel**: Components must look and feel native on each device type
   - **Performance**: Smooth interactions, no lag on any device
   - **Accessibility**: Proper focus states, keyboard navigation, screen reader support

## Device-Specific Design Rules
10. **Component Responsiveness Requirements:**
    - **Navigation**: Collapsible mobile menu, tablet sidebar, desktop full sidebar
    - **Forms**: Single column mobile, optimized tablet layout, multi-column desktop
    - **Tables**: Horizontal scroll mobile, card view option, full table desktop
    - **Cards**: Single column mobile, 2-column tablet, 3+ column desktop
    - **Buttons**: Full-width mobile where appropriate, auto-width tablet/desktop
    - **Typography**: Scaled font sizes per device (mobile smaller, desktop larger)
    - **Spacing**: Compressed mobile, comfortable tablet, generous desktop
    - **Images**: Responsive with proper aspect ratios and optimization

## UI Component Synchronization
11. **UI Testing Page Sync Rule:**
    - **MANDATORY**: Every UI component/change must be added to `/ui-testing` page
    - **Purpose**: Visual verification of components across all devices and themes
    - **Requirement**: When creating/modifying any component, immediately add it to UI testing
    - **Testing**: Verify component works on mobile, tablet, desktop in light/dark modes
    - **Documentation**: Keep UI testing page as comprehensive component showcase

## Temporary Development User
12. **TEMPORARY AUTH BYPASS (Development Only):**
    - **Location**: `src/lib/stores/auth.ts` initialize() method
    - **Temporary User**: `admin@temp.com` with `super_admin` role
    - **Purpose**: Allows access to all pages during development without auth implementation
    - **Access Level**: Super admin - can visit all admin, contributor, and super admin pages
    - **⚠️ IMPORTANT**: This must be removed once auth pages are implemented and Supabase auth is fully connected
    - **TODO**: Uncomment the real Supabase auth code and remove tempUser when auth system is ready

## Commit Command Rule
13. **commit:current command behavior:**
    - When user says "commit:current", automatically add and commit all changes
    - **Process**: First test if build is passing, then create commit
    - **Commit message format**: One small line heading overview of what was done
    - **Details**: Add bullet points below heading if needed to explain changes
    - **Exclusions**: Do NOT include "helped by Claude" or similar AI assistance mentions
    - **Example format**:
      ```
      feat: update processing animation and migrate to Geist fonts

      - Fixed processing bars to anchor from bottom with slower timing
      - Migrated from Urbanist to Geist Sans for headings
      - Added Geist Mono support for tables and code
      ```

## VS Code Stability Measures
14. **PREVENT VS CODE CRASHES during large operations:**
    - **Auto-Save Frequency**: Ensure auto-save is enabled with 1-second intervals
    - **Large File Handling**: When working with large database migrations or complex operations, work in smaller chunks
    - **Memory Management**: Close unnecessary tabs and extensions during intensive development
    - **Backup Strategy**: Always commit progress before major operations or when working for extended periods
    - **Session Recovery**: If VS Code crashes, immediately check git status and commit any recoverable work
    - **Operation Breaking**: Break large operations (like RBAC implementation) into smaller, committable chunks
    - **Status Monitoring**: Use `git status` frequently to track progress and ensure nothing is lost

## Supabase Migration Rules - CRITICAL
15. **NEVER Edit Existing Migration Files:**
    - **❌ NEVER**: Edit or modify existing migration files that have been applied
    - **✅ ALWAYS**: Create NEW migration files to fix or update database schema
    - **Why**: Existing migrations may already be applied in production database
    - **Pattern**: New migration should DROP/ALTER existing objects, then recreate with fixes

    **Example - Fixing a function:**
    ```sql
    -- ❌ WRONG: Editing old migration file
    -- File: 20251008150000_security_hardening.sql
    -- (editing this file won't apply changes in production)

    -- ✅ CORRECT: Create new migration
    -- File: 20251009110237_fix_auth_hook_use_set_config.sql
    CREATE OR REPLACE FUNCTION public.custom_access_token_hook(...)
    -- New implementation with fixes
    ```

16. **Migration File Naming Convention:**
    - **Format**: Use timestamp format `YYYYMMDDHHMMSS_description.sql`
    - **Command**: `npx supabase migration new <descriptive-name>`
    - **Reasoning**: Supabase reads migrations in lexicographical order, timestamps ensure proper chronological execution
    - **Location**: Store in `supabase/migrations/` directory
    - **Ordering**: Never use 001, 002 format as it doesn't handle parallel development well
    - **Description**: Use descriptive names that explain the migration purpose
    - **Examples**:
      - `20251228143022_create_rbac_schema.sql`
      - `20251228143045_setup_role_permissions.sql`
      - `20251009110237_fix_auth_hook_use_set_config.sql`

17. **NEVER Push Data to Production:**
    - **❌ FORBIDDEN**: Never run commands that push data to production database
    - **❌ FORBIDDEN**: Never use `INSERT`, `UPDATE`, `DELETE` statements to sync data
    - **✅ ALLOWED**: Only push schema changes (migrations) via `npx supabase db push`
    - **Why**: Data in production is live user data and must never be overwritten
    - **Exception**: Seed data is ONLY for local development via `supabase/seed.sql`

    **Safe commands:**
    - `npx supabase db push` - Push schema migrations only
    - `npx supabase db reset` - Reset LOCAL database only (never affects production)
    - `npx supabase migration new` - Create new migration file

    **Forbidden commands:**
    - ❌ Any command that modifies production data directly
    - ❌ Bulk data imports/exports to production
    - ❌ Running seed files against production

## Commands to run for verification
- Lint: `npm run lint` (if available)
- Typecheck: `npm run typecheck` (if available)
- Tests: `npm test` (if available)