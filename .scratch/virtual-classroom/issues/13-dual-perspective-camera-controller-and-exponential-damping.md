# 13: Dual-Perspective Camera Controller & Exponential Motion Damping

**What to build:** The camera system delivers buttery smooth motion using frame-rate independent exponential damping, completely eliminating rigid snapping and jerky tracking artifacts when the avatar starts, stops, or navigates corners. The player can seamlessly switch between Third-Person Perspective (3P chase camera with orbit azimuth controls) and First-Person Perspective (1P eye-level camera fixed at 1.62 meters above ground). Switching perspectives is available through multiple intuitive inputs: pressing the 'V' keyboard shortcut, clicking a camera perspective pill button on the top HUD overlay, and scrolling the mouse wheel (zooming inward past threshold switches into 1P, scrolling back pulls out into 3P). In First-Person mode, the avatar's character mesh is automatically hidden so that the player's direct forward view is never occluded by head or hair geometry, allowing detailed close-up inspection of interactive apparatuses.

**Blocked by:** 12: Performance Prefactoring & Texture Singleton Caching (60 FPS Foundation)

**Status:** ready-for-agent

- [ ] Camera position and target tracking utilize delta-timed exponential smoothing (`1 - Math.exp(-lambda * delta)`) rather than fixed-step linear interpolation.
- [ ] The global classroom store supports perspective mode state toggling between `3rd_person` and `1st_person`.
- [ ] Pressing the 'V' hotkey toggles camera perspective instantly without disrupting avatar locomotion.
- [ ] A dedicated perspective pill button on the HUD clearly indicates current view mode (`3P` vs `1P`) and allows click-to-toggle.
- [ ] Scrolling forward with the mouse wheel smoothly zooms toward the avatar and seamlessly enters 1P mode when distance reaches minimum threshold; scrolling backward returns smoothly to 3P mode.
- [ ] The 3D avatar model geometry is automatically hidden from view while in 1P mode and restored when returning to 3P mode.
