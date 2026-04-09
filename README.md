# Cloud Data Lakehouse Platform

A full-stack web application for a Cloud Data Lakehouse platform with fine-grained, policy-based access control.

## Architecture
- **Frontend**: React + Tailwind CSS + shadcn/ui
- **Backend**: Node.js (Express) + Vite Middleware
- **Metadata Layer**: Firebase Firestore (Policies, Datasets, Audit Logs)
- **Authentication**: Firebase Auth (Google Sign-In)
- **Query Engine**: Mock Lakehouse Engine with Policy Enforcement

## Features
- **Dataset & Table Browser**: View and manage data catalog.
- **Policy Management**: Create ABAC/RBAC policies for table, column, and row-level security.
- **Query Editor**: SQL interface with real-time policy enforcement (masking, filtering).
- **Audit Logging**: Every query is logged with user identity, timestamp, and status.
- **User Management**: Admin interface for role assignment.

## Setup Instructions
1. **Firebase Setup**:
   - The app uses Firebase for metadata and auth.
   - Configuration is stored in `firebase-applet-config.json`.
2. **Environment Variables**:
   - `GEMINI_API_KEY`: Required for AI features (if added).
   - `APP_URL`: Automatically set in AI Studio.
3. **Running the App**:
   - `npm install`
   - `npm run dev` (Starts full-stack server)

## Security Rules
The `firestore.rules` file ensures:
- Only admins can create/edit datasets, tables, and policies.
- Users can only read metadata they are authorized for.
- Audit logs are immutable and append-only for users.
- PII is protected via strict ownership and role checks.

## Sample Policies
- **Masking**: Mask `ssn` and `customer_email` columns for the `sales_data` table.
- **RLS**: Filter `sales_data` to only show rows where `region == 'North'`.
- **Deny**: Completely block access to sensitive tables.
