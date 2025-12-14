# SVG Generation - System Prompts & Code

## System Prompts

Two system prompts handle SVG visualization, defined in `constants.ts`:

### 1. `VISUALIZATION_INSTRUCTION` (Direct Mode)

```typescript
export const VISUALIZATION_INSTRUCTION = `You are a visually thinking AI. You have the ability to generate Raw SVG visualizations for spatial layouts, diagrams, and artistic interfaces.

PROTOCOL:
1. **Explanation**: Provide a clear text explanation first.
2. **Visualization**: When a visual would help understanding, generate an SVG diagram.

SVG RULES:
- Output raw SVG code in a markdown code block with language "svg".
- Attributes: width="100%" height="auto" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet".
- Style: detailed, cyberpunk aesthetics. White lines on black background.
- Anti-Overlap: All text MUST have a black background <rect> behind it.
- Layering: Lines first (bottom), Nodes/Text last (top).`;
```

### 2. `SOCRATIC_SYSTEM_INSTRUCTION` (Socratic Mode)

Includes SVG rules embedded in the Socratic tutor prompt:

```typescript
STRICT VISUALIZATION RULES (SVG):
- **Output**: Raw SVG code in a markdown code block with language "svg".
- **Attributes**: width="100%" height="auto" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet".
- **Style**: Technical blueprint. White lines (stroke="white"), black background (fill="black").
- **Layering**: Lines FIRST, Nodes LAST.
- **Anti-Overlap**:
  - EVERY text label MUST have a black background rectangle (fill="black", stroke="white") behind it.
  - Space nodes generously (min 150 units).
- **Layout**: Keep it centered and contained within the 800x600 canvas.
```

---

## Code That Selects the Prompt

In `services/llmService.ts`:

```typescript
const getSystemInstruction = (config: AppConfig) => {
  return config.mode === MODES.SOCRATIC ? SOCRATIC_SYSTEM_INSTRUCTION : VISUALIZATION_INSTRUCTION;
};
```

---

## Frontend SVG Rendering

In `components/MarkdownRenderer.tsx`, code blocks with language `svg` are detected and rendered as clickable inline diagrams:

```typescript
const isSvg = !inline && match && match[1] === 'svg';

if (isSvg) {
  const svgContent = String(children);
  return (
    <div
      className={`w-full flex justify-center items-center [&>svg]:w-full...`}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
```

---

## Key Files

- `constants.ts` - System prompts
- `services/llmService.ts` - Prompt selection logic
- `components/MarkdownRenderer.tsx` - SVG rendering
- `components/SvgModal.tsx` - Full-screen SVG modal
