# Token List Fetch Feature

Automated token list management with local and CI execution options.

## Local Usage

Run these commands in order:

```bash
# 1. Fetch token list from external source
npm run tokenlist:fetch

# 2. Generate token list files
npm run generate

# 3. Create PR with changes
npm run tokenlist:pr
```

## CI Usage

Use the GitHub Actions workflow:

1. Go to **Actions** tab
2. Select **"Token List Fetch"** workflow
3. Configure inputs:
   - `source_url`: External token list URL
   - `target_token_file`: Local file path
   - `assets_dir`: Logo storage directory
4. Click **"Run workflow"**

## Environment Variables

| Variable            | Purpose                 | Default                                       |
| ------------------- | ----------------------- | --------------------------------------------- |
| `SOURCE_URL`        | External token list URL | -                                             |
| `TARGET_TOKEN_FILE` | Local token file path   | `src/tokenlists/balancer/tokens/berachain.ts` |
| `ASSETS_DIR`        | Logo assets directory   | `src/assets/images/tokens`                    |
| `GITHUB_TOKEN`      | PR creation (CI only)   | -                                             |
| `INFURA_KEY`        | Blockchain API access   | -                                             |
| `ALCHEMY_KEY`       | Alternative API access  | -                                             |

## Workflow Steps

1. **Fetch**: Download token list and logos
2. **Generate**: Process and format token data
3. **Detect Changes**: Compare with existing files
4. **Create PR**: If changes found, create pull request
5. **Add Comment**: Include workflow metadata

## Required Secrets (CI)

- `GITHUB_TOKEN`: Repository access
- `INFURA_KEY`: Blockchain API
- `ALCHEMY_KEY`: Alternative API

## Troubleshooting

- **No changes detected**: Source data unchanged or wrong paths
- **PR creation fails**: Check `GITHUB_TOKEN` secret
- **Fetch fails**: Verify source URL accessibility
