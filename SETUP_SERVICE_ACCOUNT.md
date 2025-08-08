# Firebase Service Account Setup

## Step 1: Generate Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`vrisham-cad24`)
3. Go to **Project Settings** (gear icon)
4. Click on **Service Accounts** tab
5. Click **Generate new private key**
6. Download the JSON file
7. Rename it to `serviceAccountKey.json`
8. Place it in the root directory: `vrisham-customer/serviceAccountKey.json`

## Step 2: Verify File Structure

Your `serviceAccountKey.json` should look like this:

```json
{
  "type": "service_account",
  "project_id": "vrisham-cad24",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-...@vrisham-cad24.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-...%40vrisham-cad24.iam.gserviceaccount.com"
}
```

## Step 3: Security Note

⚠️ **IMPORTANT**: Never commit `serviceAccountKey.json` to version control!

Add to `.gitignore`:
```
serviceAccountKey.json
```

## Step 4: Test the Setup

1. Start the SMS proxy server:
   ```bash
   node sms-proxy-server.cjs
   ```

2. You should see:
   ```
   ✅ Firebase Admin SDK initialized with service account
   🚀 SMS Proxy Server started!
   ```

3. If you see an error, check:
   - File exists: `vrisham-customer/serviceAccountKey.json`
   - File has correct JSON format
   - Firebase project ID matches your project

## Step 5: Alternative (Production)

For production deployment, you can use environment variables instead:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccountKey.json"
```

Or set Firebase environment variables:
```bash
export FIREBASE_PROJECT_ID="vrisham-cad24"
export FIREBASE_CLIENT_EMAIL="..."
export FIREBASE_PRIVATE_KEY="..."
```

The server will automatically fall back to default credentials if the service account file is not found.
