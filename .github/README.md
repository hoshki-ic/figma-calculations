# Figma Calculations Automation

This directory contains GitHub Actions workflows for automating Figma calculations and exporting data to the Instacart Design System repository.

## Weekly Figma Calculation Workflow

The `weekly-figma-calculation.yml` workflow:
1. Runs every Monday at 2:00 AM
2. Executes the Figma calculation script
3. Copies the output JSON to the Instacart Design System repository

## Required Secrets

To set up this workflow, add the following secrets in your GitHub repository settings:

1. `FIGMA_API_TOKEN`: Your Figma API token
2. `FIGMA_STYLE_TEAM_ID`: The Figma style team ID
3. `FIGMA_TEAM_IDS`: Comma-separated list of Figma team IDs
4. `FIGMA_DESIGN_SYSTEM_FILE_KEY`: The Figma design system file key
5. `TARGET_REPO_PAT`: A Personal Access Token with write permissions to the `instacart/instacart-design-system-web` repository

### Creating a Personal Access Token (PAT)

1. Go to your GitHub account settings
2. Select "Developer settings" > "Personal access tokens" > "Tokens (classic)"
3. Generate a new token with the `repo` scope
4. Add this token as the `TARGET_REPO_PAT` secret in your repository

## Manual Trigger

You can also manually trigger this workflow from the "Actions" tab in your GitHub repository.

## Testing the Workflow

There are three ways to test this workflow with an alternative target repository:

### 1. Using Manual Workflow Dispatch with Test Mode

1. Go to the "Actions" tab in your GitHub repository
2. Select the "Weekly Figma Calculation" workflow
3. Click "Run workflow"
4. Check the "Run in test mode" option
5. Click "Run workflow"

This will use the repository specified in the `TEST_TARGET_REPO` secret.

### 2. Using Manual Workflow Dispatch with Custom Parameters

1. Go to the "Actions" tab in your GitHub repository
2. Select the "Weekly Figma Calculation" workflow
3. Click "Run workflow"
4. Enter your test repository (e.g., `your-username/test-repo`) in the "Target repository" field
5. Optionally customize the target path within that repository
6. Click "Run workflow"

### 3. Using the Test Automation Branch

1. Create a branch named `test-automation` in your repository
2. Push code changes to this branch
3. The workflow will automatically run and use the repository specified in the `TEST_TARGET_REPO` secret

### Additional Test Secrets

To enable testing, add these additional secrets to your repository:

1. `TEST_TARGET_REPO`: The repository to use for testing (format: `owner/repo`)
2. `TEST_TARGET_PATH`: (Optional) The path within the test repository to store the data (defaults to `test-output`)
