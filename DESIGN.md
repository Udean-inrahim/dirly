# Design Direction: Dirly

Source of direction: user-approved restyle toward a soft, rounded "PlantX"-style greenhouse
dashboard (pastel-green canvas, lime accent, glossy photo hero, glassmorphism stat cards),
while keeping the soil moisture monitoring domain and content.

> Dial: ENERGY 2 / RHYTHM 2 / MOTION 1

## Design Read

Reading this as: a calm, plant-green operations console for a plant caretaker or greenhouse
operator. Rounded panels, soft shadows and a photographic hero make the screen feel
approachable; the data still reads first.

## What the product is

Dirly monitors soil moisture (primary) and temperature (secondary) for plant sensors.
Caregiver attention should land on: is the soil ok right now, which sensor is in trouble,
and what happened over the last hours.

## Identity

- Field/agri-tech tone: soft green canvas, lime-green actions, white rounded panels.
  Confident but not loud (the earlier neo-brutal iteration was rejected by the user).
- Honestly utilitarian: dense data tables, precise numeric readouts, generous whitespace.
- Identity motif: live "pulse" dot on the navbar status pill and on every sensor status
  line, repeating the heartbeat metaphor of the system. One accent family (lime green) is
  used for actions and healthy status; everything else defers.
- Icons (lucide): only content-relevant glyphs (droplet for soil, thermometer, radio/signal
  for sensor health). The mockup used emoji/symbols; we deliberately kept lucide icons
  (antislop R-04: emoji only when explicitly requested by the user).

## Palette (R-29: 2-3 core + 1 accent)

- Core: canvas `#eef2ed`, container `#f7faf7` with 3px border `#506b36`, surface white
  `#ffffff`, ink `#30352f`, secondary text `#929892` / `#565c56`.
- Primary (interactive): lime `#9bcf24` (hover `#87bb19`), white foreground. Used for
  buttons, active nav, bell, avatar, data chart.
- Accent: green tones in one family: `#76b73a` icons, `#a5d836` chart line, `#5f8f22`
  secondary chart line, `#4d7f12` success text on `#e7f5d4`.
- Semantic status colors (functional, not palette roles): green healthy, yellow warning
  (`#fdf3d3`/`#9c7a1a`), red critical (`#fbe9e7`/`#c0392b`). Used for badges/pills only.
- Destructive actions: `#e6534a` with white text.

Contrast: ink on white > 13:1; secondary text `#929892` on white 3.8:1 (AA large/UI only for
small labels); button lime with white text >= 3:1 (AA large labels).

## Typography (R-06)

- Body and UI: system stack (-apple-system, Segoe UI, Roboto), chosen for legibility in
  dense tables at 13-14px, no custom load.
- Numeric readouts: the same stack with `font-variant-numeric: tabular-nums`, so
  temperature/moisture values do not jitter between updates.
- No display font, no uppercase tracking labels. Section headers are medium ink.
  Wordmark "DIRLY" in bold lime, matching the mockup's "PLANTX".

## Language

All UI copy is Bahasa Indonesia. Plain hyphens, no em dashes, no decorative punctuation.

## Components

- Outer shell: a max-width rounded container (`22px radius`, 3px green border, soft big
  shadow) on the soft canvas, holding a top navbar and the page content.
- Navbar: wordmark left, flat nav links (lime active), right side live-status pill, alerts
  bell with active-count badge (links to Peringatan), avatar circle, logout. Mobile uses a
  hamburger; decorative search and upgrade controls from the mockup were not ported
  because they would be non-functional (R-38/R-24).
- Panels: white with `1px` light border, `16px` radius, soft shadow. Metric cards vary by
  content: soil card has a vertical range gauge, temperature card a status pill, system
  status a live row.
- Hero: the dashboard opens with a greenhouse photo header. Three glass stat cards
  (Suhu rata-rata, Kelembapan tanah, Sensor online) use real summary data, and a glass
  bottom bar shows rentang ideal, peringatan aktif, dan update terakhir.
- Buttons: lime rounded-full solid (white text), soft hover lift; outline variant is white
  with light border; destructive is `#e6534a`.
- Badges: soft tint rounded-full pills (green connotation per status), normal case.
- Forms: white rounded-full inputs with light border, lime focus ring.
- Charts (Recharts): area charts on white panels, grid in `#dbe4d4`, lime soil line,
  olive temperature line, dashed neutral threshold lines; range selector is a segmented
  rounded-full control with lime active pill.
- Status colors carry meaning in badges and pulses only.

## Motion (R-19)

MOTION 1: only hover states, a soft lift on buttons, and the live pulse/blink of health
indicators. No scroll reveal, no entrance animations.

## Empty / Loading / Error (R-27)

Every data view ships three states. When no sensor is online the dashboard says so plainly
instead of showing stale numbers. Demo seed data is clearly labeled as a cold-start
convenience, never disguised as live telemetry.

## Placeholders

Logo: DIRLY wordmark in bold lime, no invented icon. Demo login credentials are printed on
the login screen only when the backend reports a seeded environment.