# Agent Context — benefactor.cc/src

See the repo-root `AGENTS.md` for full context.

## Worktrees

Git worktrees go under the repo's `tmp/` folder, which is gitignored:

```
tmp/worktrees/*
```

Create each worktree at `tmp/worktrees/<name>` (e.g.
`git worktree add tmp/worktrees/my-feature`) so worktree checkouts stay out of
version control.
