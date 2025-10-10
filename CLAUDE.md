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

## Code Architecture Principles
18. **DRY – Don't Repeat Yourself:**
    - Keep one source of truth for routes, constants, colors, and utilities
    - Never duplicate logic or config
    - Create shared utilities for repeated patterns
    - Extract common logic into reusable functions

19. **Single Responsibility Principle:**
    - Each file, function, and component should have ONE clear purpose
    - If a file does multiple things, split it
    - Name files/functions clearly to reflect their single purpose
    - Example: `validate-email.ts` NOT `utils.ts`

20. **Composition Over Inheritance:**
    - Build small, reusable UI atoms (Button, Input, Card)
    - Combine atoms to make complex components (LoginForm = Input + Button + Card)
    - Prefer React composition patterns over class inheritance
    - Use children props and component composition

21. **Types-First Development:**
    - Always type your data, props, and responses
    - Use Zod for runtime validation and type inference
    - Define types BEFORE implementing logic
    - Never use `any` - use `unknown` if type is truly unknown

22. **Secure By Default:**
    - Never expose secrets or private logic in client code
    - Handle sensitive data only on the server (Server Components, API Routes)
    - Environment variables with `NEXT_PUBLIC_` prefix are exposed to client
    - Use tRPC protected procedures for authenticated operations

## File Organization Rules
23. **Keep App Minimal:**
    - The `app/` folder should only contain pages, layouts, and routes
    - All logic lives in `src/lib/`, `src/components/`, `src/hooks/`
    - No business logic in page components
    - Pages should be thin wrappers that compose components

24. **Group By Feature:**
    - Organize files by feature or problem domain
    - Example structure:
      ```
      src/lib/auth/
        ├── login.ts
        ├── register.ts
        ├── roles.ts
        └── redirects.ts
      ```
    - NOT: `src/utils/auth-login.ts`, `src/utils/auth-register.ts`

25. **Folder Growth Rule:**
    - If a component/page needs multiple files (hooks, styles, helpers), give it a folder
    - Use `index.tsx` as the main entry point
    - Example:
      ```
      components/perfume-card/
        ├── index.tsx          (main component)
        ├── use-perfume-data.ts (hook)
        ├── helpers.ts          (utilities)
        └── types.ts            (local types)
      ```

## Styling & Design System
26. **Design Tokens:**
    - Define colors, fonts, spacing, and shadows in `tailwind.config.ts`
    - Export design tokens in `src/lib/design-tokens.ts` for reuse
    - Never hardcode colors/spacing - use token variables
    - Example: `text-primary` NOT `text-gray-900`

27. **Utility-First Styling:**
    - Use Tailwind utilities for layout and styling
    - Extract repeating patterns into reusable component classes
    - Use `@apply` rules sparingly (only for truly repeated patterns)
    - Prefer composition over utility extraction

## Performance Rules
28. **Image Optimization:**
    - Always use Next.js `<Image />` component for performance
    - Never use `<img>` tag directly
    - Pre-generate or cache remote images when possible
    - Set proper width/height to prevent layout shift

29. **Server-Side Heavy Work:**
    - Use Server Components for data-heavy operations
    - Use Server Actions or API routes for mutations
    - Never block client render with heavy computation
    - Fetch data on server, send HTML to client

30. **Split Large Code:**
    - Break large files into smaller logical pieces
    - Each file should be < 300 lines
    - If file is growing, it's doing too much - split it
    - Use dynamic imports for heavy components

31. **Dynamic Imports:**
    - Use lazy loading for heavy or rarely used components
    - Keep client bundles small (target < 200KB)
    - Example: `const HeavyChart = dynamic(() => import('./chart'))`

32. **HTTP Caching and Revalidation:**
    - Implement smart caching strategies with Next.js
    - Use `revalidate` carefully to balance speed and freshness
    - Static pages: revalidate: 3600 (1 hour)
    - Dynamic pages: revalidate: 60 (1 minute)
    - Real-time data: no cache

33. **TanStack Query Caching:**
    - Use server-side dehydrated state for initial data
    - Hydrate client-side to avoid redundant refetches
    - Set proper staleTime and cacheTime
    - Prefetch data on server, use on client

## Accessibility & Quality
34. **Accessibility (a11y):**
    - Every component must support `aria-*` props
    - Ensure keyboard navigation works (Tab, Enter, Escape)
    - Test with screen readers (VoiceOver, NVDA)
    - Minimum color contrast ratios (WCAG AA: 4.5:1)
    - Touch targets minimum 44x44px on mobile

35. **Readability Over Cleverness:**
    - Write code so a new developer can understand it in one read
    - No clever one-liners that sacrifice clarity
    - Add comments for complex logic, NOT obvious code
    - Example: Write `if (user.role === 'admin')` NOT `if (user?.role?.includes('admin')?.length)`

36. **Consistency > Perfection:**
    - Follow the same naming, structure, and style patterns everywhere
    - Don't mix camelCase and snake_case
    - Don't mix different folder structures
    - Better to be consistently good than inconsistently perfect

## Documentation & Maintenance
37. **Docs Maintenance:**
    - Keep `/docs` updated with every major change
    - Required docs:
      - `developer-onboarding.md` - How to get started
      - `how-to-add-a-component.md` - Component development guide
      - `release-checklist.md` - Pre-deployment checklist
    - Update docs BEFORE implementing feature (prevents forgetting)

38. **Environment Clarity:**
    - Include `dev.env.example` listing ALL required env variables
    - Document what each env variable does
    - Never commit `.env` files
    - Validate env variables at startup (use `src/lib/utils/env.ts`)

39. **Standardize Scripts:**
    - Required package.json scripts:
      ```json
      {
        "dev": "next dev",
        "build": "next build",
        "start": "next start",
        "lint": "next lint",
        "lint:fix": "next lint --fix",
        "type-check": "tsc --noEmit",
        "test": "jest",
        "migrate": "npx supabase migration new",
        "db:push": "npx supabase db push",
        "db:reset": "npx supabase db reset",
        "seed": "npx supabase db seed"
      }
      ```

40. **Document Before Debugging:**
    - When adding new logic or structure, update docs FIRST
    - Future developers (including you) will thank you
    - Don't debug undocumented systems
    - Documentation is code maintenance insurance

## UI/UX Design Principles - Professional Interface Design
41. **Consistent Spacing & Alignment → Visual Harmony:**
    - **Spacing Scale**: Use 4–8–16–24–32–48–64 (never arbitrary values)
    - All paddings/margins MUST come from this scale
    - Align elements to shared grid or container (`max-w-3xl mx-auto px-6`)
    - **Never**: Manual offsets like `ml-[73px]` ❌
    - Keep vertical spacing consistent (`space-y-6`, `gap-8`)
    - 📘 **Why**: Structure, polish, and professional rhythm

42. **Hierarchy & Readability → Make Content Instantly Scannable:**
    - Use limited typographic scale (3–4 font sizes, 2–3 weights max)
    - **Headings**: Darker, larger, bolder
    - **Body**: Smaller, muted (`text-muted-foreground`)
    - Maintain clear vertical rhythm: heading → paragraph → button
    - Align text left; don't justify long paragraphs
    - 📘 **Why**: If spacing is rhythm, hierarchy is melody

43. **Color & Tone → Communicate Purpose, Not Decoration:**
    - Use single accent color (brand tone) + neutral backgrounds
    - **Never hardcode hexes** — use semantic tokens (`bg-primary`, `text-muted-foreground`)
    - Maintain proper contrast for readability and accessibility
    - Don't stack multiple bright colors — guide attention with ONE accent
    - 📘 **Why**: Mastery is subtlety. Neutral + one accent = senior design

44. **Component Consistency → Feel Like One System:**
    - Reuse same border radius (`rounded-md` or `rounded-lg`) everywhere
    - Keep component density consistent per context (dashboard = tight, marketing = spacious)
    - Always use shadcn/ui variants (`default`, `outline`, `ghost`, `link`)
    - If two components look similar, make them IDENTICAL in spacing, shadow, typography
    - 📘 **Why**: Consistency is trust. Separates senior work from "styled chaos"

45. **Whitespace & Layout Breathing → Luxury Through Simplicity:**
    - Don't crowd components; let them breathe (`py-12` or `py-16` between sections)
    - Use negative space to separate visual groups
    - Remove unnecessary dividers — whitespace can do that job
    - Every visual cluster should have purpose: section → card → element
    - 📘 **Why**: Senior designers design space, not decorations

46. **Semantic & Accessible Structure → Professional Foundation:**
    - Use semantic HTML elements (`<section>`, `<header>`, `<button>`, `<nav>`)
    - Add `aria-*` attributes for icons or interactive items
    - Always define keyboard focus and hover states (`focus:ring-2 ring-primary`)
    - **Never** remove outlines or focus rings for style reasons
    - 📘 **Why**: Accessibility isn't optional — it's invisible professionalism

47. **Responsiveness & Adaptability → Design Once, Scale Everywhere:**
    - Start mobile-first; then expand
    - Use Tailwind breakpoints (`sm`, `md`, `lg`, `xl`, `2xl`)
    - Horizontal layouts collapse into vertical stacks naturally
    - Text and spacing scale together — no micro fonts on mobile
    - 📘 **Why**: If it looks great at 360px and 1440px, it's real design

48. **Interaction Feedback & Motion → Feel Alive, Not Static:**
    - Every interactive element has hover, focus, and active feedback
    - Buttons/cards: Subtle lift or color shift (`hover:scale-[1.01] hover:shadow-md`)
    - Use consistent animation timing (150–250ms, `ease-in-out`)
    - Avoid flashy transitions; prefer elegance and speed
    - 📘 **Why**: Feedback = respect for the user

49. **Performance & Clarity → Code That Feels Instant:**
    - Fetch data server-side (Server Components or RSC) when possible
    - Lazy-load heavy components with `dynamic(import())`
    - Use TanStack Query smartly: dehydrate server-side, hydrate client-side
    - Always show skeleton loaders, NOT spinners
    - Cache and revalidate intelligently
    - 📘 **Why**: Fast = beautiful. Speed IS design

50. **Typography Discipline → Quiet Confidence:**
    - Use only 1–2 fonts (e.g., Geist + system fallback)
    - Max paragraph width: `max-w-prose` or `max-w-[65ch]`
    - Line height: `leading-relaxed` or `leading-loose`
    - Avoid uppercase everywhere; mix weights instead
    - 📘 **Why**: Typography is how professionalism whispers

51. **Image & Asset Optimization → Lightweight Precision:**
    - Always use Next.js `<Image>` with defined `width`/`height`
    - Use `object-fit` classes (`object-cover`, `object-center`)
    - Lazy-load by default
    - Store assets on CDN or optimized storage
    - Never rely on uncompressed remote images
    - 📘 **Why**: Fast visuals feel effortless

52. **Design Tokens & Tailwind Discipline → Single Source of Truth:**
    - Define all colors, fonts, radii, shadows in `tailwind.config.ts`
    - Export as `tokens.ts` for reuse in non-Tailwind code
    - Never use arbitrary pixel values (`p-[13px]`, `text-[17px]`)
    - Prefer semantic classnames (`text-muted-foreground`) over raw utilities
    - 📘 **Why**: Great systems aren't designed — they're parameterized

53. **Information Hierarchy in Components → Logical Composition:**
    - Structure every interface: **Section → Group → Element**
    - Each element should visually belong to parent via spacing, alignment, or border
    - **Example Structure**:
      ```tsx
      <section className="space-y-8">
        <header className="space-y-2">
          <h2 className="text-xl font-semibold">Settings</h2>
          <p className="text-muted-foreground text-sm">Manage preferences</p>
        </header>
        <Card className="p-6 space-y-4">
          <Button>Save Changes</Button>
        </Card>
      </section>
      ```
    - 📘 **Why**: Hierarchy is mental scaffolding — turns noise into clarity

54. **Consistency Across Contexts → Unified System Feel:**
    - Use same border radius, shadow, typography, color scale across ALL modules
    - Match component proportions (buttons, cards, modals)
    - Build layouts from repeating sections — don't reinvent spacing each time
    - Consistency builds subconscious user trust
    - 📘 **Why**: Consistency makes design invisible — that's mastery

55. **Documentation & Reusability → Scalable Intelligence:**
    - Maintain `/docs` with guides: add component, extend tokens, design patterns
    - Document responsive, accessibility, and naming conventions
    - Add component gallery (`/ui-testing` route) for visual QA
    - Never ship unreviewed new visual patterns — they must join design system
    - 📘 **Why**: Documentation is how design becomes culture

## Enforcement
**✅ MANDATORY**: All rules (1-55) must be followed on EVERY task
- Before writing code: Review relevant rules
- During code review: Check compliance
- After completion: Verify all rules followed

**⚠️ If unsure**: Ask before implementing
**🚫 Never**: Skip rules for "speed" - it costs more later

## Quick Reference Checklist
Before shipping ANY UI component, verify:
- ✅ Uses spacing scale (4-8-16-24-32-48-64)
- ✅ Semantic HTML + aria-* attributes
- ✅ Hover/focus/active states defined
- ✅ Works in light AND dark mode
- ✅ Responsive on mobile (360px) and desktop (1440px)
- ✅ Uses design tokens, no hardcoded colors
- ✅ Typography follows scale (1-2 fonts max)
- ✅ Consistent with existing components
- ✅ Added to /ui-testing page
- ✅ Documented in component guide

## Commands to run for verification
- Lint: `npm run lint` (if available)
- Typecheck: `npm run typecheck` (if available)
- Tests: `npm test` (if available)