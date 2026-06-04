# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

**This is a new, empty repository** - no code has been initialized yet.

## Collaboration Framework

This project follows the **Superpowers + AI 协作** model from the parent workspace. See `e:/Switch_CC/CLAUDE.md` for the complete workflow:

- **Claude**: 架构师 / 项目经理 / 前端开发
- **Codex**: 后端开发

### Workflow Lifecycle
1. **规划**: `superpowers:writing-plans`
2. **执行**: `superpowers:executing-plans`
3. **审查**: `superpowers:requesting-code-review`
4. **调试**: `superpowers:systematic-debugging`
5. **验收**: `superpowers:finishing-a-development-branch`

### Decision Framework
Before any architecture design or code review, apply the **Linus 三问**:
1. 这是现实问题还是想象问题？
2. 有没有更简单的做法？
3. 会破坏什么？（向后兼容）

## Common Commands

Will be populated once the project is initialized. Typical commands:

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Git Conventions

Follow Conventional Commits:
- `feat:` 新功能
- `fix:` 修补 bug
- `docs:` 文档变更
- `style:` 格式调整
- `refactor:` 重构
- `test:` 添加或修改测试
- `chore:` 构建过程或辅助工具的变动