# Azure Deployment Guide

This guide will help you deploy DataBits-Convert to Azure Static Web Apps.

## Prerequisites

- An Azure account with an active subscription ([Create one for free](https://azure.microsoft.com/free/))
- A GitHub account
- This repository pushed to GitHub

## Deployment Options

### Option 1: Deploy via Azure Portal (Recommended for beginners)

1. **Create Azure Static Web App**
   - Go to [Azure Portal](https://portal.azure.com)
   - Click "Create a resource" and search for "Static Web App"
   - Click "Create"

2. **Configure Basic Settings**
   - **Subscription**: Select your Azure subscription
   - **Resource Group**: Create new or select existing
   - **Name**: Choose a unique name for your app
   - **Plan type**: Select Free or Standard
   - **Region**: Choose a region close to your users
   - **Deployment details**:
     - **Source**: GitHub
     - Sign in to GitHub and authorize Azure
     - **Organization**: Select your GitHub organization
     - **Repository**: Select this repository
     - **Branch**: Select `main` or `master`

3. **Configure Build Settings**
   - **Build Presets**: Select "Custom"
   - **App location**: `/`
   - **Api location**: (leave empty)
   - **Output location**: `dist`

4. **Review and Create**
   - Click "Review + create"
   - Click "Create"

5. **Wait for Deployment**
   - Azure will automatically create a GitHub Actions workflow
   - The first deployment will start automatically
   - Check the "Actions" tab in your GitHub repository to monitor progress

6. **Access Your App**
   - Once deployed, find your app URL in the Azure Portal
   - Your app will be available at: `https://<your-app-name>.azurestaticapps.net`

### Option 2: Deploy via GitHub Actions (Manual Setup)

1. **Create Azure Static Web App**
   - Follow steps 1-4 from Option 1, but choose "Other" for deployment source

2. **Get Deployment Token**
   - After creating the resource, go to your Static Web App in Azure Portal
   - Click "Manage deployment token" in the Overview section
   - Copy the deployment token

3. **Add GitHub Secret**
   - Go to your GitHub repository settings
   - Navigate to "Secrets and variables" → "Actions"
   - Click "New repository secret"
   - Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - Value: Paste the deployment token
   - Click "Add secret"

4. **Deploy**
   - The GitHub Actions workflow (`.github/workflows/azure-static-web-apps.yml`) is already configured
   - Push to the `main` or `master` branch to trigger deployment
   - Monitor the deployment in the "Actions" tab

### Option 3: Deploy via Azure CLI

1. **Install Azure CLI**

   ```bash
   # Windows (via winget)
   winget install Microsoft.AzureCLI

   # macOS
   brew install azure-cli

   # Linux
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
   ```

2. **Login to Azure**

   ```bash
   az login
   ```

3. **Create Static Web App**

   ```bash
   az staticwebapp create \
     --name databits-convert \
     --resource-group <your-resource-group> \
     --source https://github.com/<your-username>/<your-repo> \
     --location "West US 2" \
     --branch main \
     --app-location "/" \
     --output-location "dist" \
     --login-with-github
   ```

4. **Get App URL**
   ```bash
   az staticwebapp show \
     --name databits-convert \
     --resource-group <your-resource-group> \
     --query "defaultHostname" -o tsv
   ```

## Configuration Files

This repository includes the following Azure-specific configuration files:

- **`staticwebapp.config.json`**: Azure Static Web Apps configuration
  - Routing rules and SPA fallback
  - Security headers
  - MIME types
  - OAuth callback routing

- **`.github/workflows/azure-static-web-apps.yml`**: GitHub Actions workflow
  - Automated build and deployment
  - Pull request preview environments
  - Node.js 20 environment

## Custom Domain

To use a custom domain:

1. Go to your Static Web App in Azure Portal
2. Click "Custom domains" in the left menu
3. Click "Add"
4. Choose "Custom domain on other DNS"
5. Enter your domain name
6. Add the provided CNAME record to your DNS provider
7. Click "Validate and configure"

## Environment Variables

To add environment variables:

1. Go to your Static Web App in Azure Portal
2. Click "Configuration" in the left menu
3. Click "Add" under Application settings
4. Add your environment variables (e.g., API keys)
5. Click "Save"

## Monitoring and Logs

- **Application Insights**: Automatically enabled for monitoring
- **Logs**: Available in Azure Portal under "Monitoring" → "Logs"
- **GitHub Actions**: Check deployment logs in your repository's Actions tab

## Costs

- **Free Tier**: Includes:
  - 100 GB bandwidth per month
  - 0.5 GB storage
  - 2 custom domains
  - Free SSL certificates
- **Standard Tier**: Higher limits and SLA

[View full pricing](https://azure.microsoft.com/pricing/details/app-service/static/)

## Troubleshooting

### Build Failures

- Check GitHub Actions logs for error messages
- Ensure `package.json` scripts are correct
- Verify Node.js version (should be 20+)

### 404 Errors

- Verify `staticwebapp.config.json` routing configuration
- Check that `output_location` is set to `dist`
- Ensure build completes successfully

### Slow Initial Load

- Azure Static Web Apps uses a global CDN
- First load may be slower, subsequent loads are cached
- Consider implementing lazy loading for large assets

## Additional Resources

- [Azure Static Web Apps Documentation](https://docs.microsoft.com/azure/static-web-apps/)
- [Azure CLI Documentation](https://docs.microsoft.com/cli/azure/)
- [GitHub Actions for Azure](https://github.com/Azure/actions)

## Support

For issues specific to Azure deployment:

- [Azure Static Web Apps Issues](https://github.com/Azure/static-web-apps/issues)
- [Azure Support Portal](https://portal.azure.com/#blade/Microsoft_Azure_Support/HelpAndSupportBlade)
