---
'@env-hopper/frontend-core': minor
---

The deployed-version line shows the newest deploy that has not succeeded as a
chip after the Version: `↻ deploying <version>`, `✕ <version> failed · 5 min
ago` or `⊘ <version> canceled · 5 min ago`. The chip opens the attempt beside
the current stable Version. When a running attempt succeeds, the new Version
takes the old one's place with a short animation (a crossfade under reduced
motion). Every relative time on the line reads one shared clock, so they move
together.
