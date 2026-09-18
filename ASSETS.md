# ASSETS.md — Free 3D Assets for Learniverse AI

> Curated sources and directly usable/free 3D asset links for the adaptive 3D classroom.
>
> **Rule:** Prefer CC0/Public Domain assets and GLB/GLTF. Record the exact source URL and license in `public/assets/manifest.json`.

## 1. Primary Asset Sources

| Source | Best for | License / note | Link |
|---|---|---|---|
| Poly Pizza | Low-poly classroom, furniture, characters, props | License varies per asset; prefer CC0 | https://poly.pizza/explore |
| Quaternius | Characters, furniture, buildings, props, game packs | Quaternius states its assets are CC0 | https://quaternius.com/ |
| Kenney | Stylized 3D props, characters, environments | Many listed packs are CC0; verify each pack | https://kenney.nl/assets |
| Poly Haven | Realistic props, models, textures, HDRIs | CC0 | https://polyhaven.com/models |
| Sketchfab | Specialized models | License varies per model; verify individually | https://sketchfab.com/search?features=downloadable&type=models |

### License priority

1. CC0 / Public Domain — preferred
2. CC BY — acceptable if attribution is recorded
3. CC BY-SA — use only after checking redistribution requirements
4. CC BY-NC — avoid for a potentially commercial product
5. Editorial / unclear — do not use

“Free download” does not automatically mean “free for every use.”

---

# 2. Classroom Assets

## 2.1 Quaternius Furniture Pack — RECOMMENDED

Contains desks, chairs, tables, doors, bookcases and other furniture.

- FBX / GLTF
- CC0
- Suitable for personal and commercial projects

https://poly.pizza/bundle/Furniture-Pack-pgvx8Zkq8v

Official Quaternius page:
https://quaternius.com/packs/furniture.html

## 2.2 Classroom Search — Poly Pizza

https://poly.pizza/search/classroom

Useful for complete classroom scenes and individual classroom components.

**Warning:** some results are CC BY, not CC0. Check the individual model page.

## 2.3 School Desk Search

https://poly.pizza/search/school%20desk

Useful for desks, chairs, whiteboards, tables and bookcases.

---

# 3. Computer / Lab Assets

## Quaternius Desk

https://poly.pizza/m/V86Go2rlnq

- GLTF/FBX
- CC0
- Suitable for student workstations

## Quaternius Computer

https://poly.pizza/m/emxvTSMKnt

- GLTF/FBX
- CC0
- Useful for computer/lab stations

## Quaternius Large Computer

https://poly.pizza/m/or4LLmesjq

- GLTF/FBX
- CC0

## Poly Pizza Computer Search

https://poly.pizza/search/computer

Use this when a specific laptop, monitor or computer style is needed.

---

# 4. Office / Classroom Props

## Poly Pizza Office Pack

https://poly.pizza/bundle/Office-Pack-UGIy7YcQP9

Useful objects include:

- desks
- chairs
- computer screens
- printers
- shelves
- plants
- trash bins
- cabinets
- whiteboards
- monitors
- lights

**Important:** this pack is mixed-license. Use only individually verified CC0/compatible assets.

---

# 5. Characters

## Quaternius Universal Base Characters

https://quaternius.com/packs/universalbasecharacters.html

Recommended for:

- Student avatar
- AI mentor
- Teacher/NPC

Quaternius states its assets are CC0 and may be used in commercial, educational and personal projects.

## Kenney Blocky Characters

https://kenney.nl/assets/blocky-characters

- 3D
- Animated
- CC0

## Quaternius Universal Animation Library

https://quaternius.com/packs/universalanimationlibrary.html

Useful for walking, running, idle and interaction animations.

---

# 6. Knowledge Library Assets

## CC0 Book — Poly Pizza

https://poly.pizza/m/JjaLifEZON

- OBJ / GLTF
- CC0

## Poly Pizza Library Search

https://poly.pizza/search/library

Useful for:

- books
- bookshelves
- book stacks
- open books
- library props

Verify the license of each selected result.

---

# 7. Plants and Environmental Props

## Poly Haven Models

https://polyhaven.com/models

Poly Haven's models are CC0 and can be used for commercial projects.

Recommended for:

- plants
- realistic props
- environment objects
- materials
- HDRI lighting

## Kenney Assets

https://kenney.nl/assets

Use the 3D filter for suitable environment assets.

---

# 8. Campus / Outdoor Expansion

The MVP should remain focused on the classroom. These are useful for a later campus/world expansion.

## Kenney City Kit — Suburban

https://kenney.nl/assets/city-kit-suburban

- 3D
- City/environment
- CC0

Useful for campus surroundings and outdoor learning areas.

## Kenney Asset Library

https://kenney.nl/assets

Search/filter for:

- 3D
- City
- Buildings
- Roads
- Characters
- Vehicles
- Environment

---

# 9. Realistic Assets

## Poly Haven

https://polyhaven.com/

Use for realistic:

- furniture
- props
- plants
- materials
- HDRIs

Poly Haven states that its assets are CC0 and may be used for any purpose, including commercial work.

---

# 10. Specialized Assets

## Sketchfab Downloadable Models

https://sketchfab.com/search?features=downloadable&type=models

Useful searches:

- classroom
- whiteboard
- teacher
- student
- school desk
- laboratory
- science equipment
- computer
- bookshelf

### Sketchfab rules

Before downloading:

1. Open the individual model.
2. Check the exact license.
3. Prefer CC0.
4. CC BY is acceptable if attribution is recorded.
5. Avoid CC BY-NC for potentially commercial use.
6. Avoid editorial/restricted assets.
7. Record creator + URL + license in `manifest.json`.

Sketchfab provides downloadable models in formats including GLTF/GLB, but licensing varies by model.

---

# 11. DSA-Specific Assets — BUILD THESE YOURSELF

Do **not** download static 3D models for the core DSA visualizations.

Build them dynamically with Three.js because they must respond to learner state and game events.

## Array

```text
[10] [20] [30] [40] [50]
  0    1    2    3    4
```

## Linked List

```text
[10] → [20] → [30] → NULL
```

## Stack

```text
┌─────┐
│ 30  │
├─────┤
│ 20  │
├─────┤
│ 10  │
└─────┘
```

## Queue

```text
FRONT → [10][20][30] ← REAR
```

## Tree

```text
        50
       /  \
     30    70
    /  \  /  \
   20 40 60 80
```

## Graph

```text
      A
     / \
    B---C
    |   |
    D---E
```

## Heap

Create an interactive heap visualization.

## Sorting

Create animated bars/elements.

## Recursion

Create an interactive call-stack visualization.

## BFS / DFS

Create an interactive graph traversal visualization.

## Dynamic Programming

Create an interactive DP table/grid.

---

# 12. Why DSA Visualizations Must Be Custom

These are educational objects, not decorations.

```text
Student Knowledge
       ↓
Concept
       ↓
Learning Evidence
       ↓
Agent Decision
       ↓
3D Visualization
```

Example:

```text
Stack mastery = 38%
        ↓
Adaptive Planner
        ↓
Stack remediation
        ↓
3D Stack Lab
        ↓
Push/Pop mission
        ↓
Student interaction
        ↓
Learning evidence
```

Therefore the DSA visualization should be generated from application state rather than downloaded as a static model.

---

# 13. Project Asset Structure

```text
frontend/
└── public/
    └── assets/
        ├── classroom/
        │   ├── classroom.glb
        │   ├── whiteboard.glb
        │   └── door.glb
        ├── furniture/
        │   ├── desk.glb
        │   ├── chair.glb
        │   ├── bookshelf.glb
        │   └── table.glb
        ├── characters/
        │   ├── student.glb
        │   ├── mentor.glb
        │   └── teacher.glb
        ├── props/
        │   ├── computer.glb
        │   ├── books.glb
        │   ├── plant.glb
        │   └── clock.glb
        ├── educational/
        │   ├── array/
        │   ├── linked-list/
        │   ├── stack/
        │   ├── queue/
        │   ├── tree/
        │   ├── graph/
        │   ├── sorting/
        │   └── recursion/
        └── manifest.json
```

---

# 14. Required Asset Manifest

Every downloaded asset should be recorded.

```json
{
  "asset_id": "quaternius_desk_01",
  "name": "Desk",
  "local_file": "/assets/furniture/desk.glb",
  "source": "Poly Pizza / Quaternius",
  "source_url": "https://poly.pizza/m/V86Go2rlnq",
  "license": "CC0",
  "creator": "Quaternius",
  "format": "GLTF",
  "generated": false,
  "modified": false,
  "attribution_required": false
}
```

For CC BY assets:

```json
{
  "asset_id": "classroom_01",
  "name": "Classroom",
  "source": "Poly Pizza",
  "source_url": "INDIVIDUAL_ASSET_URL",
  "license": "CC BY",
  "creator": "CREATOR_NAME",
  "attribution_required": true,
  "attribution": "Asset name by Creator"
}
```

---

# 15. Asset Selection Rules

## MUST

- Prefer GLB/GLTF.
- Prefer CC0.
- Check the individual license.
- Record source URL.
- Record creator.
- Record license.
- Optimize large models.
- Keep polygon count reasonable.
- Use compressed textures where appropriate.
- Test models in Three.js.
- Maintain consistent scale.

## SHOULD

- Prefer low-poly assets for the MVP.
- Reuse furniture.
- Use instancing for repeated objects.
- Keep classroom assets modular.
- Keep the visual style consistent.

## MUST NOT

- Download models from random image-search results.
- Assume every Sketchfab model is free for commercial use.
- Use CC BY-NC assets without resolving commercial-use rights.
- Remove attribution requirements.
- Re-upload third-party assets as your own.
- Recreate an existing approved asset unnecessarily.

---

# 16. Recommended MVP Asset Stack

| Requirement | Recommended source |
|---|---|
| Classroom furniture | Quaternius Furniture Pack |
| Desks | Quaternius / Poly Pizza |
| Chairs | Quaternius / Poly Pizza |
| Computers | Quaternius / Poly Pizza |
| Books | Poly Pizza CC0 |
| Characters | Quaternius Universal Base Characters |
| Character animation | Quaternius Animation Library |
| Plants | Poly Haven / Quaternius |
| Realistic props | Poly Haven |
| Outdoor environment | Kenney / Poly Haven |
| Specialized model | Sketchfab, license-checked |
| DSA visualizations | Build in Three.js |
| Concept Doors | Build in Three.js |
| Mastery visualization | Build in Three.js |
| Mission Station | Build in Three.js |
| Knowledge Graph visualization | Build in Three.js |

---

# 17. Core Principle

> **Reuse existing assets for the physical world. Build the educational intelligence yourself.**

```text
INTERNET ASSETS
      ↓
Classroom
Furniture
Characters
Props
Environment
      ↓
Three.js
      ↓
ADAPTIVE EDUCATIONAL LAYER
      ↓
BKT + Knowledge Graph
      ↓
Agentic Planner
      ↓
Feynman Agent
      ↓
Dynamic Missions
      ↓
Custom DSA Visualizations
      ↓
ADAPTIVE 3D CLASSROOM
```

The downloaded assets provide the **world**. Your code provides the **intelligence**.

---

## License references

- Poly Haven license: https://polyhaven.com/license
- Quaternius FAQ/license information: https://quaternius.com/faq.html
- Kenney assets: https://kenney.nl/assets
- Sketchfab license information: https://sketchfab.com/licenses

> **License disclaimer:** Asset licenses can change and individual models can have different licenses. Re-check the asset page when downloading and before public/commercial release.
