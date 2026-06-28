# Agent Context — benefactor.cc

Durable operating context for coding agents in this repo. Read this first, then
read any nested `AGENTS.md` in the subdirectory you are working in.

## Worktrees

Git worktrees go under the repo's `tmp/` folder, which is gitignored:

```
tmp/worktrees/*
```

Create each worktree at `tmp/worktrees/<name>` (e.g.
`git worktree add tmp/worktrees/my-feature`). Keeping them under `tmp/` keeps
worktree checkouts out of version control.
