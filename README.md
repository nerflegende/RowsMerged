# RowsMerged

RowsMerged is a small frontend script for Jellyfin that merges the **"Continue Watching"** and **"Up Next"** rows into one combined row.

Goal: fewer duplicate items on the home screen and a cleaner home layout.

## Functionality

The script runs in the browser and only operates on the user interface:

- It searches the Jellyfin home screen for the "Continue Watching" and "Up Next" sections.
- It moves cards from "Up Next" into the "Continue Watching" row.
- It avoids duplicates using a card ID (`data-id`) or link (`href`).
- It hides the original "Up Next" section.
- It improves horizontal scrolling so all cards in the merged row remain reachable.
- It reacts to dynamic UI changes via `MutationObserver`.

## Requirements

- Jellyfin Web (in a browser)
- An installed JS injector

## Installation (JS Injector)

### 1) Get the script

- Use [rowsmerged.js](rowsmerged.js) from this repository.

### 2) Configure the JS injector

- Create a new script in your JS injector.
- Paste the content of [rowsmerged.js](rowsmerged.js).
- Enable the script.

### 3) Reload Jellyfin

- Reload the Jellyfin web page (hard refresh recommended).
- The home screen should now show only the merged row.

## Update

When updates are available, replace the script content with the new version from [rowsmerged.js](rowsmerged.js) and reload the page.

## Uninstall

- Disable or delete the script in your JS injector.
- Reload the page.

## Notes

- The script does not modify your media library or server data.
- It only affects how the browser UI is displayed.
- If your Jellyfin language/theme differs a lot, different titles or CSS structures may prevent the merge.

## Troubleshooting

If nothing happens:

- Check whether the script was pasted correctly.
- Check whether the script is enabled and loaded without syntax errors.
- Reload the page with an empty cache.

## Languages

Works in the following languages:
- English
- German
- French
- Spanish
- Italian

## License

- MIT
