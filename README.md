# flythrough.osu

A 3D interactive star map of every course offered at The Ohio State University. Each star is a real course - fly through the galaxy, hover over a star to identify it, and open it to see live enrollment data.

## Features

- ~9,000 courses rendered as a navigable star field
- Star color and size reflect college and credit hours
- Click any star to view course details and live section enrollment
- Search by course code or title with cinematic fly-to animation
- Decorative nebula objects and shooting stars

## Controls

| Action | Input |
|---|---|
| Capture mouse | Click canvas |
| Look around | Mouse move |
| Fly forward | Hold mouse button |
| Open course panel | Space (while hovering a star) |
| Search & fly to course | Type in search bar |
| Release mouse | Esc |

## Running locally

```bash
npm install
npm run dev
```

Course data is pre-built in `public/courses.json`. To refresh it from the OSU API:

```bash
node scripts/fetch-courses.mjs
```

## Tech

- [Three.js](https://threejs.org) — WebGL rendering, custom GLSL shaders
- [Vite](https://vitejs.dev) — build tooling
- [OSU Content API](https://content.osu.edu/v2/classes/search) — live enrollment data

## License

MIT
