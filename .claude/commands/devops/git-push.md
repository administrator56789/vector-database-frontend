---
name: git-push
description: Stage all changes, commit with a message, push to remote GitHub repository, and optionally raise PRs (with resumable execution)
---

Stage all changes, create a commit, push to the current branch on GitHub, and automatically create/merge PRs to `main` and upstream (if fork).

**Resumable execution:** State is persisted in `.devops/git-push-state.json`. If a prior run was interrupted, the command resumes from the last incomplete stage.

## State Tracking

Maintain `.devops/git-push-state.json` with structure:
```json
{
  "run_id": "timestamp-uuid",
  "stages": {
    "git_commit_push": { "status": "completed", "timestamp": "...", "commit_hash": "...", "branch": "..." },
    "main_pr": { "status": "pending", "timestamp": null, "pr_number": null },
    "upstream_detect": { "status": "pending", "timestamp": null, "upstream_exists": false, "upstream_url": null },
    "upstream_pr": { "status": "pending", "timestamp": null, "pr_number": null }
  },
  "error_log": []
}
```

## Steps

### Stage 1: Git Commit & Push
1. Load state from `.devops/git-push-state.json`; if `git_commit_push.status == "completed"`, skip to Stage 2.
2. Run `git status` to see changed/untracked files.
3. Run `git add .` to stage everything.
4. Determine commit message:
   - If `$ARGUMENTS` is non-empty, use it as-is.
   - Otherwise, run `git diff --cached --stat` and generate a conventional-style message (e.g. `feat: add query page filters`).
5. Commit and run `git push`.
6. Capture commit hash and branch.
7. **Update state:** Set `git_commit_push.status = "completed"`, log commit hash and branch.

### Stage 2: Merge Conflict Check & Main PR
8. Run:
```
   git fetch origin
   git merge-tree $(git merge-base HEAD origin/main) HEAD origin/main
```
   - If conflicts detected: post warning (via `gh pr comment` if PR exists, else stdout). Set `main_pr.status = "skipped"` and **stop here**.
   - If no conflicts: proceed.

9. If current branch is not `main`:
   - Check if PR to `main` exists: `gh pr list --head <branch> --base main`.
   - If none exists: create with `gh pr create --base main` (title/body from `git log main..HEAD --oneline`).
   - Merge PR using `gh pr merge <number> --merge`.
10. **Update state:** Set `main_pr.status = "completed"`, log PR number.

### Stage 3: Upstream Detection (Auto-Add Fork)
11. Load state; if `upstream_detect.status == "completed"`, skip to Stage 4.
12. Check if `upstream` remote exists:
```
    git remote -v | grep upstream
```
    - If exists: set `upstream_exists = true` and skip to Stage 4.
    - If missing: proceed to fork detection.

13. **Fork Detection via GitHub API:**
    - Get origin repo: `git remote get-url origin` (extract owner/repo).
    - Query GitHub API: `GET /repos/{owner}/{repo}` → check `fork` field.
    - If `fork == true`: get parent repo from `parent.full_name`.
    - If fork detected: set `upstream_url = parent.full_name`, add remote: `git remote add upstream https://github.com/<upstream_url>.git`, fetch: `git fetch upstream`.
    - If not a fork: set `upstream_exists = false` and skip Stage 4.

14. **Update state:** Set `upstream_detect.status = "completed"`, log upstream_url and upstream_exists.

### Stage 4: Upstream PR (If Fork Detected)
15. Load state; if `upstream_detect.upstream_exists == false` OR `upstream_pr.status == "completed"`, **stop**.
16. Check if upstream PR already exists:
```
    gh pr list --repo <upstream_owner>/<upstream_repo> --head <your_username>:<branch> --base main
```
17. If none exists:
    - Create: `gh pr create --repo <upstream_owner>/<upstream_repo> --head <your_username>:<branch> --base main` (same summary as main PR).
    - Merge: `gh pr merge <number> --merge --repo <upstream_owner>/<upstream_repo>`.
18. **Update state:** Set `upstream_pr.status = "completed"`, log PR number.

## Error Handling

- On any stage failure: log error to `state.error_log`, set stage status to `"failed"`, and exit with clear message (e.g. "Stopped at Stage 3: GitHub API fork detection failed — check credentials").
- On resume: attempt to re-run failed stage; if it fails again, report and exit.

## Summary Output

Report:
- Commit hash and branch pushed.
- Main PR status (created/merged or skipped due to conflicts).
- Upstream fork status (detected/exists or not a fork).
- Upstream PR status (created/merged or skipped if not a fork).