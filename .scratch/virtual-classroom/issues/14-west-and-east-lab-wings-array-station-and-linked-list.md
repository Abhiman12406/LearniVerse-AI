# 14: West & East Lab Wings (Array Station & Linked List Lab with Walk-in Corridors)

**What to build:** The virtual campus expands laterally by connecting the central diorama to two fully enclosed, walk-in laboratory wings: the Array Station Lab situated in the West Wing (X = -20) and the Linked List Lab situated in the East Wing (X = +20). Both laboratories are accessible via open corridor archways that the avatar can walk through unimpeded. Each laboratory features solid exterior wall colliders that prevent the avatar from falling off platforms into void space. Inside the Array Station Lab, the avatar can approach and operate the interactive memory index rack with distinct slots illustrating constant-time random memory lookup ($O(1)$) versus linear traversal ($O(n)$). Inside the Linked List Lab, the avatar can inspect interactive heap memory nodes connected by glowing pointer energy beams and observe node linking, traversal, and pointer updates in real time.

**Blocked by:** 12: Performance Prefactoring & Texture Singleton Caching (60 FPS Foundation)

**Status:** ready-for-agent

- [ ] West corridor opens directly into an enterable 14x14m Array Station Lab featuring wooden flooring, branded signage, research desks, and wall colliders.
- [ ] East corridor opens directly into an enterable 14x14m Linked List Lab featuring dynamic node pedestals, tech benches, and solid perimeter boundary colliders.
- [ ] Collision detection allows smooth, unobstructed passage through corridor doorways while strictly blocking penetration through room perimeter walls.
- [ ] Interactive 3D apparatuses in both wings trigger proximity detection, show instructional interaction prompts (`[E] Operate Station`), and integrate with the active station store state.
- [ ] Visual signboards, thematic lighting, and architectural accents match the pedagogical styling established in reference campus designs.
