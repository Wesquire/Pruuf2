# EAS Secrets Configuration for Pruuf

## Overview

EAS Secrets are encrypted environment variables stored securely in Expo's cloud infrastructure. They are injected at build time and are never exposed in your codebase or version control.

---

## Required EAS Secrets

### Client-Side Secrets (bundled into app)

| Secret Name | Purpose | Example Value |
|-------------|---------|---------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://ivnstzpolgjzfqduhlvw.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ...` |
| `EXPO_PUBLIC_API_BASE_URL` | API base URL | `https://api.pruuf.me` |
| `EXPO_PUBLIC_EXPO_PROJECT_ID` | Expo project ID for push notifications | `your-project-id` |

### Server-Side Secrets (Edge Functions via Supabase)

These are set via `supabase secrets set` and are **NOT** needed in EAS:

| Secret Name | Purpose |
|-------------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Admin database access |
| `JWT_SECRET` | Token signing |
| `POSTMARK_SERVER_TOKEN` | Email service |

---

## Commands

### Set Production Secrets

Run these commands from the project root:

```bash
# Supabase configuration
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://ivnstzpolgjzfqduhlvw.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your_anon_key_here"

# API configuration
eas secret:create --scope project --name EXPO_PUBLIC_API_BASE_URL --value "https://api.pruuf.me"

# Expo project ID (for push notifications)
eas secret:create --scope project --name EXPO_PUBLIC_EXPO_PROJECT_ID --value "your_expo_project_id"
```

### Manage Secrets

```bash
# List all secrets
eas secret:list

# Delete a secret
eas secret:delete --name SECRET_NAME

# Update a secret (delete and recreate)
eas secret:delete --name EXPO_PUBLIC_SUPABASE_URL
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "new_value"
```

---

## Pre-Build Checklist

Before running a production build, verify:

- [ ] EAS CLI installed (`npm install -g eas-cli`)
- [ ] Logged into EAS (`eas login`)
- [ ] Project linked to EAS (`eas init`)
- [ ] All required secrets set (`eas secret:list`)
- [ ] Secrets verified in [EAS dashboard](https://expo.dev)

---

## Using Secrets in eas.json

Secrets can be referenced in `eas.json` using the `@secret_name` syntax (lowercase with underscores):

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "@expo_public_supabase_url",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "@expo_public_supabase_anon_key",
        "EXPO_PUBLIC_API_BASE_URL": "@expo_public_api_base_url",
        "EXPO_PUBLIC_EXPO_PROJECT_ID": "@expo_public_expo_project_id"
      }
    }
  }
}
```

---

## Setting Supabase Edge Function Secrets

For server-side secrets used by Supabase Edge Functions:

```bash
# Set secrets for Edge Functions
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
supabase secrets set JWT_SECRET=your_jwt_secret
supabase secrets set POSTMARK_SERVER_TOKEN=your_postmark_token
supabase secrets set POSTMARK_FROM_EMAIL=noreply@pruuf.me
supabase secrets set POSTMARK_FROM_NAME=Pruuf

# List Edge Function secrets
supabase secrets list
```

---

## Security Notes

1. **Never commit secrets** - All `.env` files with real values should be in `.gitignore`
2. **Use EAS Secrets for production** - Don't hardcode values in `eas.json`
3. **Rotate secrets regularly** - Update secrets periodically for security
4. **Limit access** - Only team members who need access should have EAS permissions
5. **Audit usage** - Review EAS dashboard for secret access logs
