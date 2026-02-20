# Mission Control Dashboard - GitHub Pages Deployment

## Setup Instructions

1. Create a new GitHub repository
2. Push the `dashboard/` folder contents to the root of the repository
3. Enable GitHub Pages in repository settings
4. Use the `_config.yml` for Jekyll configuration (optional)

## File Structure for GitHub Pages

```
repository-root/
├── index.html          # Main dashboard
├── agents.html         # Agent roster
├── task-board.html     # Task board
├── office.html         # Pixel office
├── deals.html          # DealFlow
├── token-tracker.html  # Token tracker
├── logs.html           # Activity logs
├── data.html           # Data management
├── standup.html        # Daily standup
├── _config.yml         # Jekyll config (optional)
└── .nojekyll           # Disable Jekyll processing
```

## Important: Update API URLs

For GitHub Pages, update the API URLs in each HTML file:

```javascript
// Change from:
const API_URL = '/api';

// To your actual API endpoint:
const API_URL = 'https://dashboard-ten-sand-20.vercel.app/api';
// OR your own API server
```

## Navigation Links

All navigation links should use relative paths or full URLs:
- `./agents.html` instead of `/agents`
- `./task-board.html` instead of `/tasks`

## CORS Considerations

If hosting frontend on GitHub Pages and API on Vercel:
1. Enable CORS on your Vercel API
2. Or use a proxy service
3. Or migrate API to a serverless function on GitHub Pages (limited)
