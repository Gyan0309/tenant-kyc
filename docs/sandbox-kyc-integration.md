# Sandbox KYC integration

The active KYC flow uses Sandbox APIs instead of direct DigiLocker partner OAuth.

## Environment

```env
SANDBOX_BASE_URL=https://test-api.sandbox.co.in
SANDBOX_API_KEY=your_api_key
SANDBOX_API_SECRET=your_api_secret
SANDBOX_API_VERSION=1.0.0
```

Use `https://api.sandbox.co.in` for production after Sandbox enables production
access for the account. Do not expose these values to the browser.

## Supported flows

- Aadhaar OTP: `/api/verify/aadhaar/initiate` sends the OTP and stores only the
  Sandbox reference id plus masked Aadhaar in the temporary verification session.
  `/api/verify/aadhaar/verify` completes the session after OTP verification.
- Sandbox DigiLocker: `/api/verify/digilocker/initiate` creates a Sandbox
  DigiLocker session. `/api/verify/digilocker/status` polls Sandbox and finalizes
  the local session once consent is complete.

## Storage

- Full Aadhaar numbers are not persisted.
- Aadhaar photos are stored as private blobs only after OTP verification.
- Aadhaar XML from Sandbox DigiLocker is encrypted with `ENCRYPTION_KEY` before
  blob storage when Sandbox returns an XML document URL.
