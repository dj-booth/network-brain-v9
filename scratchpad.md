# Project: App-to-Google Calendar Event Sync

**Goal:** Sync events created and published in this application to a designated Google Calendar, including inviting attendees when their status is set to "invited".

## Phase 1: Setup & Configuration
1.  **Google Cloud Project & API Setup:**
    *   Create a new project in Google Cloud Console (or use an existing one).
    *   Enable the Google Calendar API.
    *   Configure OAuth 2.0 Consent Screen (specify scopes for calendar access).
    *   Create OAuth 2.0 Client ID credentials (Web application type).
    *   Securely store the Client ID and Client Secret in application configuration (e.g., `.env.local`).
2.  **Authentication Flow:**
    *   Implement the Google OAuth 2.0 flow within the application (likely in `settings` or a dedicated connection area).
    *   Allow the user to authorize the application to access their Google Calendar.
    *   Store the obtained refresh token and access token securely, associated with the user account. Handle token refresh logic.
3.  **Google API Client Library:**
    *   Install the necessary Google API client library for Node.js (e.g., `googleapis`).

## Phase 2: Data Model & Validation
4.  **Database Schema Update:**
    *   Add a `status` column to the `events` table (e.g., with values like `draft`, `published`). Define a default value (likely `draft`).
    *   Add a `google_calendar_event_id` column (nullable text) to the `events` table to store the ID of the corresponding Google Calendar event once created.
    *   Review the `event_attendees` (or equivalent) table structure. Confirm it has a `status` column (e.g., `pending`, `accepted`, `invited`, `declined`).
    *   Create and run the necessary database migrations.
5.  **Type Definitions:**
    *   Update TypeScript types/interfaces for `Event` and `Attendee` to reflect the new schema changes.
6.  **Pre-Publish Validation Logic:**
    *   Implement server-side validation logic that runs *before* an event status can be changed to `published`.
    *   Ensure required fields for Google Calendar (title, start time, end time) are present and valid.

## Phase 3: Core Sync Logic
7.  **Event Creation Sync:**
    *   Modify the API endpoint or server action responsible for updating an event's status.
    *   When an event's status changes from `draft` to `published`:
        *   Check if `google_calendar_event_id` is already set. If so, skip creation (handle updates later if needed, though not in the initial scope).
        *   Use the stored OAuth tokens to authenticate with the Google Calendar API.
        *   Call the Google Calendar API (`events.insert`) to create a new event using the validated event data from the application.
        *   Store the returned Google Calendar event ID in the `google_calendar_event_id` column for the application event.
        *   Handle potential API errors gracefully.
8.  **Attendee Invitation Sync:**
    *   Modify the API endpoint or server action responsible for updating an attendee's status.
    *   When an attendee's status changes to `invited`:
        *   Check if the parent event is `published` and has a `google_calendar_event_id`.
        *   Use the stored OAuth tokens.
        *   Fetch the current Google Calendar event using `events.get`.
        *   Add the attendee's email to the event's attendees list.
        *   Call the Google Calendar API (`events.update` or `events.patch`) to update the event with the new attendee list. Ensure `sendUpdates` parameter is set appropriately (likely 'all' or 'externalOnly') to trigger the invitation email.
        *   Handle potential API errors.

## Phase 4: UI & Testing
9.  **UI Adjustments (Optional but Recommended):**
    *   Update the event creation/editing form to clearly show the `draft`/`published` status.
    *   Provide feedback to the user during the publishing process (e.g., loading state, success/error messages).
    *   Update the attendee management UI to reflect the `invited` status potentially triggering the Google Calendar sync.
10. **Testing:**
    *   Write unit/integration tests for the validation logic, API interaction services, and status update handlers.
    *   Perform end-to-end testing: create a draft event, add attendees, publish it, change attendee status to invited, and verify the results in Google Calendar.

## Progress Tracking
- Current Phase: Phase 1: Setup & Configuration
- Current Task: 2. Authentication Flow
- Next Task: 4. Database Schema Update

## Notes & Decisions
- Focusing solely on App -> Google Calendar sync for now.
- Google Calendar -> App sync is out of scope for this phase.
- Events are only pushed to Google Calendar when status changes from 'draft' to 'published'.
- Attendees are only added to Google Calendar event when their status changes to 'invited' in the app.

## Questions & Blockers
- Need specific Google Calendar API scopes required.
- Need secure storage strategy for OAuth tokens (refresh/access).
- Need to confirm existing table names for events and attendees. 