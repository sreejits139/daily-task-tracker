# How to Fix Your Other Fandango Project

## Problem
After switching git credentials, your other project (using fandango account) may not be able to push/pull.

## Solution
Update that project to use SSH with the fandango account.

### Steps:

1. **Navigate to your other project**:
   ```bash
   cd /path/to/your/fandango/project
   ```

2. **Check current remote**:
   ```bash
   git remote -v
   ```

3. **If it shows HTTPS** (https://github.com/fandango/...):
   ```bash
   # Remove HTTPS remote
   git remote remove origin
   
   # Add SSH remote (using default github.com for fandango)
   git remote add origin git@github.com:fandango/PROJECT-NAME.git
   
   # Replace PROJECT-NAME with your actual repo name
   ```

4. **Test it works**:
   ```bash
   git fetch origin
   ```

5. **Set branch tracking**:
   ```bash
   git branch --set-upstream-to=origin/main main
   ```

## Quick Reference

**Your SSH Setup**:
- `git@github.com:fandango/...` → ssankara-fd (fandango account)
- `git@github-account2:sreejits139/...` → sreejits139 (personal account)

**Always use SSH, not HTTPS!** SSH automatically uses the correct account based on the host.
# SSH setup complete - both accounts working
