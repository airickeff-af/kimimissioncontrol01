#!/bin/bash
# Quick theme fix for remaining pages

for file in index.html agents.html dealflow-view.html scout.html task-board.html; do
    # Add Kairosoft background color if not present
    if ! grep -q "f5e6c8" "$file"; then
        sed -i 's/--bg-primary: #2d1b4e;/--bg-primary: #f5e6c8;/g' "$file"
        sed -i 's/--bg-secondary: #3d2652;/--bg-secondary: #e8d4a8;/g' "$file"
        sed -i 's/--text-light: #f4e4c1;/--text-dark: #3d3225;/g' "$file"
        echo "Updated $file"
    fi
done

echo "Theme fixes applied"
