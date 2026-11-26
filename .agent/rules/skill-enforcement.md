---
trigger: always_on
---

# Skill Enforcement Rule

You must strictly enforce mandatory skill loading and execution across all tasks.

## Mandatory Skill Execution Protocol

Before planning, writing, or modifying any code or interface, you MUST follow this protocol:

1. **Identify Relevant Skills**:
   - Inspect [.agents/skills/](D:\Projects\dhruv_patel_portfolio\.agent\skills) to identify all skills relevant to the current task.
   - Core domain triggers:
     - **3D Scene Architecture & Math**: Read [threejs-fundamentals](D:\Projects\dhruv_patel_portfolio\.agent\skills/threejs-fundamentals/SKILL.md)
     - **Shaders & Visual Effects**: Read [threejs-shaders](D:\Projects\dhruv_patel_portfolio\.agent\skills/threejs-shaders/SKILL.md)
     - **3D Models & GLTF/GLB Loading**: Read [threejs-gltf-loading](D:\Projects\dhruv_patel_portfolio\.agent\skills/threejs-gltf-loading/SKILL.md)
     - **3D Skeletal & Procedural Animation**: Read [threejs-animation](D:\Projects\dhruv_patel_portfolio\.agent\skills/threejs-animation/SKILL.md)
     - **React Three Fiber (R3F)**: Read [threejs-react-three-fiber](D:\Projects\dhruv_patel_portfolio\.agent\skills/threejs-react-three-fiber/SKILL.md)
     - **DOM / Scroll Animation**: Read relevant [GSAP skills](D:\Projects\dhruv_patel_portfolio\.agent\skills/gsap-core/SKILL.md)
     - **Site Art Direction & Polish**: Read [build-awwwards-quality-sites](D:\Projects\dhruv_patel_portfolio\.agent\skills/build-awwwards-quality-sites/SKILL.md)
     - **UI/UX & Design Systems**: Read [ui-ux-pro-max](D:\Projects\dhruv_patel_portfolio\.agent\skills/ui-ux-pro-max/SKILL.md)

2. **Mandatory Pre-Execution Reading**:
   - You MUST read the corresponding `SKILL.md` before taking action or writing code.
   - NEVER start code generation or implementation without consulting the relevant skill guidelines first.

3. **Strict Adherence**:
   - Implementations MUST strictly follow the architecture patterns, performance guidelines, and constraints defined in the loaded skills.
