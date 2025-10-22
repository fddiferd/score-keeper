<div align="center">
  <a href="https://wristband.dev">
    <picture>
      <img src="https://assets.wristband.dev/images/email_branding_logo_v1.png" alt="Wristband" width="297" height="64">
    </picture>
  </a>
  <p align="center">
    Enterprise-ready auth that is secure by default, truly multi-tenant, and ungated for small businesses.
  </p>
  <p align="center">
    <b>
      <a href="https://wristband.dev">Website</a> •
      <a href="https://docs.wristband.dev">Documentation</a>
    </b>
  </p>
</div>

<br/>

---

# Deployment Setup

![Wristband](https://img.shields.io/badge/Wristband-Enterprise_Auth-blue.svg)
![Setup](https://img.shields.io/badge/Setup-Configuration_Guide-green.svg)

This guide will walk you through the complete setup process for deploying your full stack application to a Vercel hosted fronent and a Cloud Run hosted FastAPI backend.



## 🔧 Requirements

### Poetry
Poetry is used for python project and dependency management. The `package.json` already has pip install shortcuts built in but this can help with future development.
1. Visit [Poetry Downloads](https://python-poetry.org/docs/)
2. Download and install the appropriate version for your OS
3. Verify the installation by opening a terminal or command prompt and running:
```bash
poetry --version # Should show v18.x.x or higher
```

### Terraform
Terraform is used to manage the GCP infrastructure as code if you are intending on using firebase for documenent storeage.
1. Visit [Terraform Install](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli) 
2. Download and install the latest 
3. Verify the installation by opening a terminal or command prompt and running:
```bash
terraform --version # Should show Terraform vx.x.x
```
> **Note**: Needed for Deployment & Document Storage

### Google Cloud
GCP is used for firebase integration for the purposes of document storage
1. Visit [gcloud sdk install](https://cloud.google.com/sdk/docs/install) 
2. Download and install the latest 
3. Verify the installation by opening a terminal or command prompt and running:
```bash
gcloud --version # Should show Google Cloud SDK x.x.x
```
**Initialize gcloud**
```bash
gcloud init
```
**Select or create a project**
```bash
Pick cloud project to use: 
 [1] project-123a
 [2] Create a new project
```
> **Note**: Needed for Deployment & Document Storage

### Vercel (for frontend hosting)
Vercel is used to deploy and host the Next.js frontend.

1. Install Vercel globally:
```bash
npm i -g vercel
```

2. Verify the installation:
```bash
vercel --version # Should show Vercel CLI version
```


<br>
<hr>
<br>


## ☁️ Deployment

This repository is set up to use terraform to deploy on google cloud platform for hosting of the fast api as well as using firebase for the datastore.

### Update Project Configuration

Before deploying, you need to configure the Terraform variables with your specific GCP project details:

1. **Edit the configuration file**: Open `infrastructure/config.tfvars` and update the following values:

   ```bash
   project_id          = "your-gcp-project-id"
   app_name            = "your-app-name"
   billing_account_id  = "your-billing-account-id"
   region              = "us-central1"
   firestore_location  = "us-central"
   api_name            = "api"
   api_repo_name       = "api-repo"
   ```

2. **Required updates**:
   - `project_id`: Your GCP project ID (find this in the GCP Console or run `gcloud config get-value project`)
   - `app_name`: A unique name for your application (used in resource naming)
   - `billing_account_id`: Your GCP billing account ID (find this in the GCP Console under Billing)

3. **Optional updates**:
   - `region`: The GCP region where resources will be deployed (default: `us-central1`)
   - `firestore_location`: The location for your Firestore database (default: `us-central`)
   - `api_name` and `api_repo_name`: Names for the API components (can be left as defaults)

> **Note**: Make sure your GCP project has billing enabled before proceeding with deployment.

### Apply Infrastructure

```bash
cd infrastructure
./terraform.sh init
./terraform.sh plan
./terraform.sh apply -auto-approve
```

### Collect Service Accounts
This will collect the services accounts for `cloud run` and `firebase` which are used locally and for deployment and place them in the `backend/service_accounts` folder
```bash
cd infrastructure
./export_firebase_key.sh
./export_cloud_run_key.sh
```


### GET CLOUD RUN URL FOR FRONTNED
 terraform output cloud_run_url




###  ▲ Vercel Hosting Configuration




| ENV Var         | Value                        |
|-----------------|-----------------------------|
| **NEXT_PUBLIC_APPLICATION_SIGNUP_URL**   | `https://your-app-name.us.wristband.dev/signup` |
| **NEXT_PUBLIC_BACKEND_URL**    | `https://your-domain.com`                        |

to link your project:
```bash
  vercel --prod
```

### 🏷️ GCP Domain Mapping

To map your custom domain to your GCP project, follow these steps:

1. **Open Google Search Console**  
   Visit [Google Search Console](https://search.google.com/search-console).

2. **Add Your Custom Domain**  
   - Click on **"Add property"**.
   - Enter your custom domain (e.g., `your-domain.com`).
   - Follow the instructions to verify domain ownership.

> **Tip:** Verifying your domain ensures that Google Cloud and related services can recognize and securely use your custom domain.

3. **Configure DNS for Custom Domain**
   - Go to your domain registrar (e.g., Cloudflare)
   - Add CNAME record: `api` → `ghs.googlehosted.com` (DNS only)
   - Wait 5-10 minutes for DNS propagation
   - Your API will be available at `https://api.{your-domain}.com`

### Cloud Flare
Step 1: Get Your Cloudflare Credentials
Get Zone ID:
Go to Cloudflare Dashboard
Click on your domain (metric-layer.ai)
On the right sidebar, copy the Zone ID
Create API Token:
Go to Cloudflare API Tokens
Click "Create Token"
Use "Custom token" template
Set these permissions:
Zone:Zone Settings:Edit
Zone:Zone:Read
Zone:DNS:Edit
Zone Resources: Include → Specific zone → metric-layer.ai
Click "Continue to summary" → "Create Token"
Copy the token (you won't see it again!)

<br>
<hr>
<br>
