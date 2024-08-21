#!/bin/bash

start_commit=$1
end_commit=$2

git cherry-pick -X theirs $start_commit^..$end_commit

while true; do
    # Check if cherry-pick is in progress
    if ! git cherry-pick --continue > /dev/null 2>&1; then
        # Handle files deleted by us but present in theirs
        git status | grep 'deleted by us' | awk '{print $4}' | while read file; do
            git checkout --theirs -- "$file"
            git add "$file"
        done

        # Handle files added by us but not present in theirs
        git status | grep 'both added' | awk '{print $3}' | while read file; do
            git rm -f "$file"
        done

        # Add all files git thinks are modified or added
        git add -A

        # Remove files deleted by them
        git status | grep 'deleted by them' | awk '{print $4}' | xargs git rm -f

        # Check if there are any changes to commit
        if git diff --cached --quiet && git diff --quiet; then
            # The cherry-pick is empty, commit it
            git commit --allow-empty -C $(git rev-parse CHERRY_PICK_HEAD)
        else
            # Continue the cherry-pick
            git cherry-pick --continue
        fi
    else
        # Cherry-pick is complete
        break
    fi
done