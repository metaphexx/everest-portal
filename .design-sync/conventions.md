# Everest Portal Components - how to build with this system

## No provider needed

Every component here renders standalone. There is no theme provider, no context
wrapper, no store to set up - the components in this library were selected on
exactly that basis. Import and render:

```jsx
import { MasterTable, Icon } from 'everest-portal';
```

The one thing that IS required is the stylesheet. Load `styles.css` (it `@import`s
the component CSS and the self-hosted fonts). Without it the components render
structurally correct and completely unstyled.

For the full page look, render `<Background />` once at the root. It paints the
three blurred colour washes that the frosted-glass surfaces sit over. Skip it and
every `.glass-card` reads as a flat grey panel - the glass has nothing to be glassy
about.

## The styling idiom: CSS custom properties, plus a small class set

There is **no utility-class framework here**. Style your own layout with the CSS
variables, and use the component classes for surfaces and controls.

Ink ramp - `--fg1` (headings) · `--fg2` (body) · `--fg3` (muted) · `--fg4` (captions
that still inform). Everything down to `--fg4` clears 4.5:1 on white.

Brand and surfaces - `--brand-500` (primary action, focus ring) · `--brand-600`
(text on tinted brand backgrounds) · `--bg-page` (the warm ivory ground) ·
`--glass-bg` · `--glass-border`.

Status, never decoration - `--success-500` · `--warn-500` · `--danger-500`.
Identity accents, never status - `--accent-violet` · `--accent-teal`.

Type - `--font-display` (Montserrat: headings, big numbers, nav) · `--font-body`
(Inter: prose). Two faces, no third.

Layers - only `--z-dropdown` and `--z-modal` and their four siblings. Never write a
bare z-index.

Motion - `--ease-out` is the house curve.

Classes that exist and should be used rather than reinvented:
`.glass-card` · `.glass-stat` · `.glass-control` · `.btn-primary` · `.btn-soft` ·
`.btn-ghost` · `.icon-btn` · `.field` · `.portal-title` · `.portal-section-title` ·
`.press` (tap feedback) · `.list-hover`.

## Where the truth lives

Read `styles.css` and the files it imports before styling anything - the real token
values are there and beat any summary. Each component has a `.prompt.md` beside its
`.d.ts` with its props and usage.

## An idiomatic screen

```jsx
<>
  <Background />
  <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 24px' }}>
    <h1 className="portal-title">Booklet requests</h1>
    <p className="portal-lede">Print requests from tutors, by centre.</p>

    <div className="glass-card" style={{ padding: '20px 22px', marginTop: 16 }}>
      <MasterTable
        rows={rows}
        idOf={(r) => r.id}
        statusOf={(r) => ({ label: 'Active', color: 'var(--success-700)', bg: 'rgba(34,160,91,.12)' })}
        columns={[{ key: 'n', label: 'Centre', render: (r) => r.name, text: (r) => r.name }]}
        searchHint="Search centres"
        emptyTitle="No centres yet"
        emptyBody="Add one to get started."
      />
    </div>
  </div>
</>
```

## House rules inherited from the source

Australian English, hyphens never em dashes. Tables collapse to cards below 720px
rather than clipping a column. Every control clears 40px on touch.
