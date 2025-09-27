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

## Commands to run for verification
- Lint: `npm run lint` (if available)
- Typecheck: `npm run typecheck` (if available)
- Tests: `npm test` (if available)