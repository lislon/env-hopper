---
status: accepted
---

# Nothing moves once it is shown

A person reads the form and the panel beside it while data is still arriving. When a widget appears late and pushes what is under it down, the link they were about to click moves away from the pointer. So the UI does not shift: anything that loads after the page is planned, in the API and in the component, so it takes its place without moving what is already there.

- **Know the shape before the data.** If a widget may or may not be there, the first answer that says so should arrive with the page (the bootstrap), not after a second round trip. A procedure that only says "this App has none" late is a layout shift waiting to happen.
- **Remember the last answer per device.** A widget that depends on the selection starts from what this device saw last for it (`initialData` from local storage), then refreshes. A revisit never grows the panel.
- **Ask ahead for what is likely next.** Favourite and recently used Apps and Environments are prefetched in the background when the form loads, so picking one renders at once.
- **Reserve, do not reflow.** When the space is known but the content is not, hold the space (fixed-height rows, a skeleton of the same height); when it is not known, put the late content where its arrival moves nothing (the end of a column, an overlay such as a hover card).
- **Overlays stay inside their box.** A card or tooltip never lets its content spill out of its frame: long values truncate with the full text on hover, so nothing under it is covered or loses the pointer.

New widgets and procedures say, in their review, which of these they rely on.

## Considered Options

- **Accept the shift, it lasts a moment.** Rejected: it lands exactly when a person acts, on the most used screen.
- **Skeleton for everything.** Rejected alone: a skeleton for a widget that turns out absent collapses, which is the same shift.
- **Delay rendering until everything is loaded.** Rejected: the form is the fast path (ADR 0003); nothing waits for a widget.
