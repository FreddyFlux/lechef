Add and commit all changes with a fitting commit message and with a tag (for backwards searchability). Merge the existing branch into main. Create a new branch called {{args}} and activate the new branch.

Execute these commands in sequence:

# Get current branch name

CURRENT_BRANCH=$(git branch --show-current)

# Stage and commit all changes

git add -A
git commit -m "chore: commit changes before branch switch" || echo "No changes to commit"

# Switch to main and pull latest

git checkout main
git pull origin main

# Merge the previous branch into main (if not already on main)

if [ "$CURRENT_BRANCH" != "main" ]; then
git merge "$CURRENT_BRANCH" -m "chore: merge $CURRENT_BRANCH into main"
fi

# Create and switch to new branch

git checkout -b {{args}}

echo "Created and switched to branch: {{args}}"
