---
name: git-push
description: Stage all changes, commit with a message, and push to the remote GitHub repository
---

Stage all changes, create a commit, and push to the current branch on GitHub.

If the user provided arguments after `/git-push`, use that text as the commit message. Otherwise, run `git diff --stat HEAD` (or `git status`) to summarize the changes and generate a concise, descriptive commit message from that summary.

## Steps

1. Run `git status` to see what files are changed or untracked.
2. Run `git add .` to stage everything.
3. Commit using the message:
   - If `$ARGUMENTS` is non-empty, use it as-is.
   - Otherwise, inspect `git diff --cached --stat` and write a short conventional-style message (e.g. `feat: add query page filters`).
4. Run `git push` to push to the tracked remote branch.
5. Report the commit hash and branch that was pushed.
