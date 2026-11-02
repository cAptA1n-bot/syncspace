# SyncSpace Theme System — Modern Blue Dark

## Theme Direction

- **Product:** SyncSpace
- **Theme name:** Modern Blue Dark
- **Primary mode:** Dark
- **Visual character:** Professional, clean, modern, focused
- **Brand line:** Write · Collaborate · Stay in Sync

Use this file as the design-token reference when implementing or updating SyncSpace UI. Inspect the existing repository and follow its current framework and conventions. Do not replace working application code just to apply this theme.

## 1. Core Color Tokens

```css
:root {
  color-scheme: dark;

  /* Brand */
  --color-primary: #2563EB;
  --color-primary-hover: #1D4ED8;
  --color-primary-active: #1E40AF;
  --color-secondary: #3B82F6;
  --color-accent: #60A5FA;
  --color-on-primary: #FFFFFF;

  /* Backgrounds and surfaces */
  --color-background: #0F172A;
  --color-sidebar: #020C1B;
  --color-surface: #1E293B;
  --color-card: #111F33;
  --color-card-hover: #17263D;
  --color-border: #334155;
  --color-border-strong: #475569;

  /* Text */
  --color-text-primary: #F8FAFC;
  --color-text-secondary: #94A3B8;
  --color-text-muted: #64748B;
  --color-text-on-primary: #FFFFFF;

  /* Semantic */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #06B6D4;

  /* Interaction */
  --color-focus-ring: #60A5FA;
  --color-selection: #1D4ED8;
  --color-overlay: rgb(2 6 23 / 80%);

  /* Gradients */
  --gradient-primary: linear-gradient(135deg, #2563EB 0%, #60A5FA 100%);
  --gradient-hero: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%);
  --gradient-surface: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
}
```

## 2. Palette Reference

| Token | Hex | Intended use |
|---|---|---|
| Primary | `#2563EB` | Primary buttons, active navigation, selected controls |
| Primary hover | `#1D4ED8` | Hover state for primary actions |
| Primary active | `#1E40AF` | Pressed state |
| Secondary | `#3B82F6` | Secondary emphasis and supporting controls |
| Accent | `#60A5FA` | Links, highlights, focus accents |
| Background | `#0F172A` | Main app canvas |
| Sidebar | `#020C1B` | Main navigation sidebar |
| Surface | `#1E293B` | Inputs, toolbars, secondary panels |
| Card | `#111F33` | Document cards and content containers |
| Card hover | `#17263D` | Hovered document cards |
| Border | `#334155` | Default borders and dividers |
| Strong border | `#475569` | Emphasized boundaries |
| Primary text | `#F8FAFC` | Headings and primary content |
| Secondary text | `#94A3B8` | Supporting content and metadata |
| Muted text | `#64748B` | Low-priority labels; verify contrast for small text |
| Success | `#10B981` | Success states |
| Warning | `#F59E0B` | Warning states |
| Error | `#EF4444` | Error and destructive states |
| Info | `#06B6D4` | Informational states |

## 3. UI Application Rules

### App shell
- Use `--color-background` for the main application canvas.
- Use `--color-sidebar` for the primary navigation sidebar.
- Use `--color-surface` for toolbars, search inputs, and secondary regions.
- Use `--color-card` for document cards and grouped content.

### Navigation
- Inactive navigation: transparent background with `--color-text-secondary`.
- Hovered navigation: a subtle lighter surface, such as `--color-card-hover`.
- Active navigation: `--color-primary` with white text and icons.
- Keep active, hover, and keyboard-focus states visually distinct.

### Buttons
- Primary button: `--color-primary` with `--color-on-primary`.
- Primary hover: `--color-primary-hover`.
- Secondary button: `--color-surface` with `--color-text-primary` and a visible border.
- Outline button: transparent background, visible border, and readable text.
- Destructive actions: use `--color-error`; do not use red as a general accent.
- Include disabled, loading, hover, focus, and pressed states.

### Document cards
- Default background: `--color-card`.
- Border: `--color-border`.
- Hover: `--color-card-hover` with a subtle border or elevation change.
- Titles: `--color-text-primary`.
- Last-edited timestamps and descriptions: `--color-text-secondary`.
- Use consistent spacing, radius, and icon treatment across document cards.

### Forms and editor
- Input background: `--color-surface`.
- Input text: `--color-text-primary`.
- Placeholder: `--color-text-muted`.
- Border: `--color-border`.
- Focus: a clearly visible `--color-focus-ring` outline or border.
- Editor content must remain easy to read during long writing sessions.
- Errors must include text or icons as well as color; do not communicate state through color alone.

### Modals, menus, and overlays
- Use surface/card colors for dialog and menu panels.
- Use `--color-overlay` behind modal dialogs.
- Ensure menus and dialogs have clear boundaries and visible keyboard focus.
- Keep destructive actions visually distinct.

## 4. Typography and Shape

- Use the project's existing font stack unless a change is explicitly requested.
- Establish a clear hierarchy: page title, section title, card title, body, metadata.
- Prefer readable body text and restrained font weights.
- Use consistent spacing and corner radii from the existing design system.
- Avoid excessive glow, gradients, glass effects, and shadows. The design should feel like a focused productivity tool.
- Use icons consistently; do not rely on emoji as primary interface icons.

## 5. Accessibility

- Verify contrast for text, icons, borders, and interactive controls.
- Do not use `--color-text-muted` for essential small text unless contrast is sufficient in context.
- Provide a visible keyboard-focus indicator.
- Ensure hover is not the only way to discover an action.
- Include text labels or accessible names for icon-only buttons.
- Communicate errors, warnings, and success with text or icons in addition to color.
- Test disabled and selected states for clarity.

## 6. Theme Behavior

- Dark mode must be the initial/default theme.
- Apply the tokens consistently to public pages, authentication pages, the workspace, the document editor, settings, dialogs, menus, and empty/loading/error states.
- If a light-mode option already exists, preserve it and avoid breaking its behavior. Dark mode remains the default.
- Prefer a single centralized source of theme tokens in CSS variables or the existing Tailwind theme setup.
- Avoid duplicating literal color values across components when a token exists.

## 7. Implementation Guidance for Antigravity

Before editing:
1. Inspect the repository structure, package manifests, CSS/Tailwind configuration, and existing component conventions.
2. Identify how the current theme and dark-mode behavior are implemented.
3. Check the Git working tree and preserve unrelated user changes.
4. Plan the smallest complete change.

While editing:
- Reuse existing components and design tokens.
- Preserve routes, authentication, API contracts, document behavior, and data.
- Do not perform unrelated redesigns or introduce dependencies without a clear reason.
- Do not expose environment variables or secrets.

After editing:
1. Run the relevant lint, test, and build scripts available in the project.
2. Check the primary app shell, navigation, document cards, forms, buttons, editor, and dialogs.
3. Report files changed and commands/results accurately.
4. State any checks that could not be completed; do not claim unrun tests passed.

## 8. Suggested Antigravity Prompt

> Read `theme.md` and inspect the existing SyncSpace codebase before making changes. Implement the Modern Blue Dark theme as the default across the application using centralized CSS variables or the project's existing Tailwind theme configuration. Apply the tokens consistently to the app shell, sidebar, navigation, document cards, editor, forms, buttons, menus, dialogs, and all interaction states. Preserve existing functionality, routes, authentication, API integrations, and document data. Avoid unrelated rewrites. Run the available checks and report the files changed and actual results.
