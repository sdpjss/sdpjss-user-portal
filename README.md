# SDPJSS Frontend

The frontend module provides the public SDPJSS website and authenticated member
portal. For complete repository setup, see the [root README](../README.md).

## Responsibilities

- Public home, about, team, contact, job, and staff-requirement pages
- Registration, login, OTP verification, and password recovery
- Member profile and family-member management
- Donation entry and Razorpay payment flows
- Donation receipts and Maha Prasad token generation
- Member advertisements, job openings, and staff requirements
- Public notices and help content

## Technology

- React 18 and Vite
- React Router
- Tailwind CSS and React Bootstrap
- Axios, Framer Motion, and React Toastify
- `html2pdf.js`, QR Code, and reCAPTCHA integrations

## Requirements

- Node.js `20.19+` or `22.12+`
- npm
- The backend API running locally or available remotely

## Setup

From the repository root:

```bash
cd frontend
npm ci
```

Create `frontend/.env`:

```dotenv
VITE_APP_ENV=test
VITE_BACKEND_URL=http://localhost:4000
VITE_RAZORPAY_KEY_ID=<test-public-key-id>
VITE_RECAPTCHA_SITE_KEY=<site-key>
VITE_SHOW_PRASAD_TOKEN_DOWNLOAD_BUTTON=false
VITE_MAHA_PRASAD_COLLECTION_DATE=<display-date>
VITE_MAHA_PRASAD_COLLECTION_TIME=<display-time>
VITE_MAHA_PRASAD_COLLECTION_LOCATION=<display-location>
```

### Environment variables

| Variable | Purpose |
| --- | --- |
| `VITE_APP_ENV` | Set to `test` to display the test banner; use `live` or leave unset for live builds |
| `VITE_BACKEND_URL` | Backend base URL without `/api` or a trailing slash |
| `VITE_RAZORPAY_KEY_ID` | Public Razorpay test key used by browser payment flows |
| `VITE_RECAPTCHA_SITE_KEY` | Public reCAPTCHA site key |
| `VITE_SHOW_PRASAD_TOKEN_DOWNLOAD_BUTTON` | Enables token download when set to `true` |
| `VITE_MAHA_PRASAD_COLLECTION_DATE` | Collection date displayed on generated tokens |
| `VITE_MAHA_PRASAD_COLLECTION_TIME` | Collection time displayed on generated tokens |
| `VITE_MAHA_PRASAD_COLLECTION_LOCATION` | Collection location displayed on generated tokens |

Every `VITE_*` value is visible in browser code. Only public identifiers belong
in this file; private service credentials must remain in the backend.

## Run Locally

Start the backend first, then run:

```bash
npm run dev
```

The website is available at `http://localhost:5173` by default. Environment
changes require a development-server restart.

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite with hot module replacement |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across the module |

## Source Layout

```text
frontend/
├── public/              # Static public assets
├── src/
│   ├── assets/          # Images, icons, and team assets
│   ├── components/      # Shared UI, receipts, navigation, and modals
│   │   └── userfiles/   # Authenticated user-portal features
│   ├── context/         # Authentication and shared application state
│   ├── pages/           # Public and protected route-level pages
│   ├── utils/           # Printing helpers
│   ├── App.jsx          # Application routes and layout
│   └── main.jsx         # React entry point and providers
├── tailwind.config.js
└── vite.config.js
```

## Authentication

Protected user-portal routes are wrapped by `ProtectedRoute`. Authentication is
verified against the backend and maintained through application context. Do not
rely on frontend route protection alone; backend middleware must protect all
sensitive data and mutations.

## Payments and Generated Documents

- Browser code receives only the Razorpay public key.
- Payment signature verification happens in the backend.
- Receipts and tokens can be downloaded or printed.
- The Prasad token download control has an independent feature variable.

Use provider test modes and non-production accounts during development.

## Validation

```bash
npm run lint
npm run build
```

Also smoke-test responsive public navigation, authentication and password
recovery, protected-route redirects, profile and family operations, test
payments, receipts, tokens, and the `TEST` banner.

## Troubleshooting

### API calls fail or are blocked by CORS

Confirm that the backend is running, `VITE_BACKEND_URL` is correct, and the
backend's `ALLOWED_CORS_ORIGINS` includes `http://localhost:5173`.

### reCAPTCHA does not validate

Confirm that the frontend site key and backend secret belong to the same test
configuration and that localhost is permitted by the provider.

### Payment verification fails

Confirm that the frontend public key matches the backend test account and that
the backend has the corresponding secret. Never add the secret here.

### Environment changes are ignored

Restart Vite after changing `.env`.

## Deployment

Run `npm run build` and publish `dist/` using an SPA route fallback. Configure
`VITE_*` variables before building and use `VITE_APP_ENV=test` only for test
deployments.
