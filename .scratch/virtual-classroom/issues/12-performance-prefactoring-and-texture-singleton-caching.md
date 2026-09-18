# 12: Performance Prefactoring & Texture Singleton Caching (60 FPS Foundation)

**What to build:** The virtual classroom diorama environment renders at a stable, consistent 60 FPS without frame drops, garbage collection stutter, or memory leaks during navigation. Procedural textures (including floor wooden planks, chalkboard lecture equations, whiteboard architecture diagrams, and computer monitor terminals) are baked once and cached as application singletons across render cycles. Common PBR materials (light wood, dark wood, black metal, wall plaster, floor planks) are shared globally rather than duplicated for each individual furniture prop. Minor decorative props (books, writing pens, desk drawer pulls, chair casters) have dynamic shadow casting disabled, restricting active shadow maps to the avatar character, primary pedagogical apparatuses, and main structural pillars to ensure silky-smooth rendering across all desktop devices.

**Blocked by:** None (can start immediately)

**Status:** completed

- [x] Procedural canvas textures are cached as module-level singletons and never re-allocated during avatar locomotion or camera movements.
- [x] Shared PBR materials are reused across all architectural and furniture meshes instead of generating unique material instances per geometry.
- [x] Decorative classroom props have dynamic shadow casting disabled, reducing overall draw calls and shadow map passes.
- [x] Directional light shadow map resolution is tightened to 1024x1024 with bounded frustum coordinates to prevent shadow acne and eliminate frame stutter.
- [x] The virtual classroom maintains a measured 60 FPS frame rate throughout continuous avatar movement across the central diorama.
