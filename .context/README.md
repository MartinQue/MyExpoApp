# Context Engineering for MyExpoApp

This directory contains **context files** that help AI development tools (Cursor, Claude Code, GPT-5 Codex, KiloCode) understand your codebase architecture and patterns.

## 📁 Directory Structure

```
.context/
├── README.md              # This file
├── patterns.md            # Common code patterns
├── structure.md           # Codebase structure explanation
├── agents.md              # Multi-agent system documentation
└── examples/              # Example implementations
    ├── glassmorphism-component.tsx
    ├── zustand-store.ts
    ├── service-layer.ts
    └── agent-integration.tsx
```

## 🎯 Purpose

Context Engineering ensures that AI assistants:
1. **Understand** your architecture automatically
2. **Follow** established patterns consistently
3. **Respect** monorepo boundaries
4. **Generate** code that matches your style
5. **Remember** context across sessions

## 📚 Files Explained

### patterns.md
Common code patterns for:
- Glassmorphism UI components
- Zustand state management
- Service layer architecture
- Haptic feedback integration
- Theme system usage

### structure.md
- Monorepo organization
- App structure breakdown
- Shared packages explanation
- Import path conventions

### agents.md
- Multi-agent system architecture
- Agent routing and communication
- LangGraph integration patterns
- Agent-specific features

### examples/
Real, working code examples that serve as templates for AI tools to follow.

## 🤖 How AI Tools Use This

When you prompt an AI assistant:

**Without Context Engineering:**
```
You: "Add a new chat component"
AI: Creates generic component with inline styles
You: Manually fix styling, add glassmorphism, add haptics, fix theme
```

**With Context Engineering:**
```
You: "Add a new chat component"
AI: Reads .context/patterns.md → sees glassmorphism pattern
AI: Reads .context/examples/ → uses component template
AI: Generates perfect glassmorphism component with haptics and theme support
You: Review and ship ✅
```

## 🔧 Maintenance

### Adding New Patterns
When you establish a new pattern:
1. Document it in `patterns.md`
2. Add example to `examples/`
3. Update this README if structure changes

### Updating Patterns
When patterns evolve:
1. Update the relevant markdown file
2. Update corresponding examples
3. Keep BMAD_RULES.md in sync

## 🎓 Learning Resources

- **BMAD Method**: https://github.com/bmad-code-org/BMAD-METHOD
- **Context Engineering**: https://github.com/coleam00/context-engineering-intro
- Project-specific: See `/BMAD_RULES.md`

---

**Version**: 1.0.0
**Last Updated**: December 3, 2025
