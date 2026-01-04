# EAS Environment Variables Configuration for Pruuf

## Overview

EAS Environment Variables are securely stored in Expo's cloud infrastructure. They are injected at build time and are never exposed in your codebase or version control. Variables with `sensitive` visibility are encrypted.

---

## Environment Variables Status

### Production Environment ✅

| Variable Name | Purpose | Status | Visibility |
|--------------|---------|--------|------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ Set | plaintext |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ Set | sensitive |
| `EXPO_PUBLIC_API_BASE_URL` | API base URL | ✅ Set | plaintext |
| `EXPO_PUBLIC_EXPO_PROJECT_ID` | Expo project ID for push notifications | ✅ Set | plaintext |

### Preview Environment ✅

| Variable Name | Purpose | Status | Visibility |
|--------------|---------|--------|------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ Set | plaintext |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ Set | sensitive |
| `EXPO_PUBLIC_API_BASE_URL` | API base URL | ✅ Set | plaintext |
| `EXPO_PUBLIC_EXPO_PROJECT_ID` | Expo project ID for push notifications | ✅ Set | plaintext |

### Development Environment

Development builds use inline values in `eas.json` pointing to local Supabase instance.

---

## Server-Side Secrets (Supabase Edge Functions)

These are set via `supabase secrets set` and are **NOT** needed in EAS:

| Secret Name | Purpose | Where to Set |
|-------------|---------|--------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Admin database access | Supabase Dashboard or CLI |
| `JWT_SECRET` | Token signing | Supabase Dashboard or CLI |
| `POSTMARK_SERVER_TOKEN` | Email service | Supabase Dashboard or CLI |
| `POSTMARK_FROM_EMAIL` | Sender email address | Supabase Dashboard or CLI |
| `POSTMARK_FROM_NAME` | Sender display name | Supabase Dashboard or CLI |

---

## Commands

### List Environment Variables

```bash
# List all environments
eas env:list --environment production
eas env:list --environment preview
eas env:list --environment development

# Include sensitive values (use with caution)
eas env:list --environment production --include-sensitive
```

### Create Environment Variables

```bash
# Create a plaintext variable
eas env:create production --name VARIABLE_NAME --value "value" --visibility plaintext --non-interactive

# Create a sensitive variable
eas env:create production --name SECRET_VAR --value "secret_value" --visibility sensitive --non-interactive
```

### Update Environment Variables

```bash
# Delete and recreate to update
eas env:delete --name VARIABLE_NAME --environment production --non-interactive
eas env:create production --name VARIABLE_NAME --value "new_value" --visibility plaintext --non-interactive
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

## Pre-Build Checklist

Before running a production build, verify:

- [x] EAS CLI installed (`npm install -g eas-cli`)
- [x] Logged into EAS (`eas login`)
- [x] Project linked to EAS (`eas init`)
- [x] All required environment variables set (`eas env:list --environment production`)
- [x] Variables verified in [EAS dashboard](https://expo.dev)
- [ ] Supabase Edge Function secrets set (`supabase secrets list`)

---

## eas.json Configuration

The production profile only needs local-only variables. EAS environment variables are automatically injected:

```json
{
  "build": {
    "production": {
      "distribution": "store",
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "app-bundle"
      },
      "env": {
        "APP_ENV": "production",
        "EXPO_PUBLIC_ENABLE_DEV_TOOLS": "false"
      }
    }
  }
}
```

---

## Security Notes

1. **Never commit secrets** - All `.env` files with real values should be in `.gitignore`
2. **Use sensitive visibility** - Mark secrets like API keys with `--visibility sensitive`
3. **Rotate secrets regularly** - Update secrets periodically for security
4. **Limit access** - Only team members who need access should have EAS permissions
5. **Audit usage** - Review EAS dashboard for secret access logs
