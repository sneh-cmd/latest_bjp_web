# BJP Latest Web Panel

A React-based admin dashboard for managing and analysing voter survey data for BJP election operations. The panel integrates with multiple SOAP web services to display reports such as booth-wise, date-wise, user-wise surveys, and detailed voter-level information.

---

## Tech Stack

- **Framework:** React (SPA)
- **Language:** JavaScript (ES6+)
- **Build Tool/Bundler:** Vite (via `import.meta.env` usage)
- **Styling:** TailwindCSS-style utility classes
- **Transport:** `fetch` + SOAP XML requests
- **API Layer:** Centralized in `src/apidata.jsx`

---

## Main Features

- **Authentication & Admin Panel**
  - Admin login and panel selection via central SOAP services.

- **Dashboard & Reports**
  - **Booth-wise survey dashboard** (counts by P/N/D/C, unavailable, totals).
  - **Date-wise survey dashboard** (daily survey counts for a month).
  - **User-wise survey voters** (e.g. Booth Pramukh detail screen).
  - **Booth-wise survey voters** (BoothDetailSlide) with tabbed views.
  - **Date-wise survey voters** (DateDetailSlide) with tabbed views.

- **Voter Detail Screens**
  - Consolidated voter information: name, address, booth, house, polling station, serial number.
  - Phone and ID card handling with fallbacks for multiple field names from the API.
  - Actions:
    - Call voter directly from the browser (`tel:` links).
    - Navigate to family screen using normalized voter IDs.
    - View voter survey logs.
    - Edit and update mobile numbers locally in state.

- **Availability & Status Logic**
  - Normalized handling of:
    - `voterStatus` (P = positive, N = negative, D = doubtful, C = cannot say).
    - `voter_available` / `not_available_status` across multiple endpoints.
  - Consistent tabs across detailed screens:
    - Positive, Negative, Doubtful, Nothing, Unavailable.

---

## Project Structure (high level)

```text
d:/BJP/latest_bjp_web/
  src/
    apidata.jsx              # Central SOAP API client and response parsing
    utils/
      localStorage.js        # Helper for storing/retrieving dynamic API URLs
    components/
      admindasbord/
        dashboard/
          report/
            BoothDetailSlide.jsx        # Booth-wise voter detail with tabs
            BoothPramukhDetailSlide.jsx # User-wise (Booth Pramukh) voter detail
            DateWiseSurvey.jsx          # Date-wise survey summary (per day)
            DateDetailSlide.jsx         # Date-wise voter detail with tabs
          ...
      common/
        PageHeader.jsx
        VoterCard.jsx
      modals/
        ValidationModal.jsx
        CalendarModal.jsx
  README.md
```

> Note: Only key files related to dashboards and API handling are listed here.

---

## API Layer (`src/apidata.jsx`)

All SOAP API calls and response parsing are centralized in `apidata.jsx`.

### Endpoints & Configuration

- **Base URLs**
  - `BASE_URL`: uses `/api` in development (proxied) and `http://ntmc.mhbjplok.com` in production.
  - `WEB_SERVICE_URL`: `${BASE_URL}/webservice.asmx`.

- **Dynamic Panel URL**
  - `getDynamicApiUrl()` and `getAdminEndpoint(panelApiUrl)` read the selected corporation/panel URL from `localStorage` via `localStorageManager`.
  - In dev mode, a proxy such as `/panel-api/webservice.asmx` is used to avoid CORS.

- **Authentication**
  - `AUTH_CONFIG` for central corporation services.
  - `ADMIN_AUTH_CONFIG` for panel/admin-specific services.
  - Both are injected as `<AuthUser>` header in the SOAP envelope.

### `apiService.makeRequest` Flow

1. Build SOAP XML envelope with:
   - Auth header (`AuthUser` with `UserName`, `Password`, `Token`).
   - Body taken from the specific request’s `soapBody`.
2. Send POST request to given endpoint with:
   - `Content-Type: text/xml; charset=utf-8`.
   - `SOAPAction: "http://tempuri.org/<action>"`.
3. Read text response and pass to `parseSoapResponse` with the action.

### `apiService.parseSoapResponse`

- Handles:
  - Authentication errors.
  - SOAP faults (`soap:Fault`, `faultstring`).
- Extracts the JSON payload from `<...Result>` tag based on `soapAction`.
- Parses JSON and then applies **per-action special handling**:
  - Dashboard aggregates (booth-wise, date-wise, etc.).
  - Voter lists for various filters (date-wise, booth-wise, user-wise, scheme-wise, etc.).
  - Some endpoints normalize structures and handle `Success` and `result` wrappers.

Key voter-list actions with normalization:

- `dis_user_wise_survey_voter` → `displayUserWiseSurveyVoter` (BoothPramukhDetailSlide).
- `dis_booth_wise_survey_voter` → `displayBoothWiseSurveyVoter` (BoothDetailSlide).
- `dis_date_wise_survey_voter` → `displayDateWiseSurveyVoter` (DateDetailSlide).

For these, the parsing layer:

- Normalizes name, address, booth/house, serial, and phone fields from many possible API keys.
- Computes `voterStatus` as a lowercased single-character code (`p`, `n`, `d`, `c`).
- **Normalizes availability fields** so UI can rely on them:

  ```js
  // voter_available normalization
  const rawVoterAvailable =
    item.voter_available ??
    item.voterAvailable ??
    item.available ??
    item.is_available ??
    ''

  const vaStr = String(rawVoterAvailable).toLowerCase().trim()
  const voter_available =
    vaStr === '0' || vaStr === 'false' || vaStr === 'no' || vaStr === '' ? '0' : '1'

  // not_available_status normalization
  const rawNotAvailableStatus =
    item.not_available_status ??
    item.notAvailableStatus ??
    item.na_status ??
    ''

  const not_available_status = String(rawNotAvailableStatus || '').trim()
  ```

- These normalized fields drive the "अनुपलब्ध" tab logic in multiple components.

---

## Important Screens & Logic

### BoothPramukhDetailSlide

- File: `src/components/admindasbord/dashboard/report/BoothPramukhDetailSlide.jsx`
- Fetches voters via `displayUserWiseSurveyVoter(adminId, '', panelApiUrl)`.
- Uses memoized filtering to build separate lists for:
  - Positive, Negative, Doubtful, Nothing, Unavailable.
- Counts per tab computed via `tabCounts` using `voter_status` (`p/n/d/c`).
- Unavailable tab relies on normalized `voter_available` and `not_available_status`:

  ```js
  const va = v.voter_available
  const nas = v.not_available_status
  return (va === '0' || va === false) && nas && nas.toString().trim() !== ''
  ```

### BoothDetailSlide

- File: `src/components/admindasbord/dashboard/report/BoothDetailSlide.jsx`
- Fetches voters by booth via `displayBoothWiseSurveyVoter(categoryId, panelApiUrl)`.
- Similar tab structure and filtering logic as BoothPramukhDetailSlide.
- Uses normalized `voter_available` and `not_available_status` to compute अनुपलब्ध tab and counts.

### DateWiseSurvey

- File: `src/components/admindasbord/dashboard/report/DateWiseSurvey.jsx`
- Fetches daily survey counts via `displayDateWiseSurveyDash(monthParam, panelApiUrl)`.
- Merges raw API days with a generated full month grid so that all days (even with 0 surveys) are shown.
- Cards navigate to `DateDetailSlide` with a computed `dateForAPI`.

### DateDetailSlide

- File: `src/components/admindasbord/dashboard/report/DateDetailSlide.jsx`
- Fetches voters for a specific date via `displayDateWiseSurveyVoter(dateForAPI, panelApiUrl)`.
- Same tabbed layout as other detail screens and uses normalized `voterStatus`, `voter_available`, `not_available_status`.

---

## Local Storage & Session Usage

- **`localStorageManager`** (`src/utils/localStorage.js`):
  - Stores and retrieves the selected panel API base URL.
  - Used to dynamically build endpoints for admin/panel-based APIs.

- **Session Storage keys:**
  - `boothPramukhDetailActiveTab`, `boothDetailActiveTab`, `dateDetailActiveTab` to persist the last selected tab when navigating to child screens (e.g., family view, log view) and coming back.

---

## Requirements

Because this project uses **Vite 7**, **React 19**, and modern ESLint, it requires a relatively recent Node.js version.

- **Recommended Node.js:** **20.x LTS**
- **Minimum Node.js:** **18.18.0** (to be compatible with Vite 7 ecosystem)
- **npm:** 9+ (or the version bundled with your Node installation)
- **Alternative package managers:** Yarn 1.x or pnpm 8+ also work if you prefer them.
- **Browsers:** Latest versions of Chrome, Edge, Firefox (modern ES modules and fetch support are required).

You can check your Node and npm versions with:

```bash
node -v
npm -v
```

If your Node version is older than **18.18.0**, upgrade to at least **Node 20 LTS** before running this project.

---

## Running the Project

> The exact scripts may vary depending on how the project was initialized; below is the typical setup for a Vite+React project.

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Development Server

```bash
npm run dev
# or
yarn dev
```

- Default Vite dev server: `http://localhost:5173` (can vary based on config).
- In dev, API calls are proxied via paths like `/api`, `/panel-api`, `/corporation-api` etc.

### 3. Production Build

```bash
npm run build
# or
yarn build
```

### 4. Preview Production Build (Optional)

```bash
npm run preview
# or
yarn preview
```

---

## Environment & Configuration

- **Vite env variables** (examples):
  - `import.meta.env.DEV` – used to decide between proxy URLs and real URLs.
  - You can define additional variables in `.env` / `.env.development` / `.env.production` as needed.

- **API URL selection**
  - The active panel URL is stored from the UI in local/storage (via `localStorageManager`).
  - If no panel URL is present, `apidata.jsx` may fall back to a default like `http://bmc1.mhbjplok.com/webservice.asmx` and log a warning.

---

## Error Handling & Logging

- `apidata.jsx`:
  - Logs SOAP requests (endpoint, SOAPAction, partial body) and responses (status, headers, first 500 chars).
  - Provides detailed errors for HTTP failures and SOAP faults.

- Components:
  - Show localized messages like `डेटा लोड हो रहा है...`, `कोई डेटा उपलब्ध नहीं है`, and retry buttons where appropriate.
  - Use `ValidationModal` for user-facing validation errors (e.g., missing phone number).

---

## Extending the Project

When adding a new report or screen:

1. **Add or reuse an API function** in `apidata.jsx`:
   - Define SOAP body and call `apiService.makeRequest(endpoint, 'POST', '<soapAction>', soapBody, useAdminAuth)`.
   - Add special parsing in `parseSoapResponse` if the result needs transformation or normalization.

2. **Create a React component** under `src/components/admindasbord/dashboard/...`:
   - Import the required API function from `apidata.jsx`.
   - Handle loading, error, search, and tab/filter logic similar to existing screens.

3. **Normalize data fields** in the parser:
   - Always normalize boolean/flag fields (`voterStatus`, `voter_available`, etc.).
   - Prefer mapping multiple possible API field names into a single consistent property for the UI.

4. **Reuse shared UI components**:
   - Use `PageHeader` for top bars with search and back navigation.
   - Use `VoterCard` for voter-level displays.
   - Use `ValidationModal` for error/validation dialogs.

---

## Troubleshooting

- **No data showing on a report:**
  - Check the browser console for API logs from `apidata.jsx`.
  - Confirm that the correct panel API URL is selected and stored.
  - Verify that the SOAP action and parameters match the backend specification.

- **Unavailable tab not matching expectations:**
  - Confirm that the underlying endpoint (`dis_user_wise_survey_voter`, `dis_booth_wise_survey_voter`, or `dis_date_wise_survey_voter`) returns the expected voters.
  - Check normalized fields in the console (`voter_available`, `not_available_status`).

- **Authentication errors:**
  - Look for messages like `Authentication failed: Invalid credentials` in the console.
  - Ensure `AUTH_CONFIG` and `ADMIN_AUTH_CONFIG` values are correct for the environment.

---

## Notes

- This project is tightly coupled to the SOAP APIs provided by `mhbjplok.com` infrastructure.
- Many endpoints share similar patterns; always centralize API changes in `apidata.jsx` so components remain thin and focused on presentation.
