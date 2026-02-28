# Quick Migration Guide

## Add customer_line_id Column

The system needs a `customer_line_id` column in the `repair_requests` table to store LINE user IDs for notifications.

### Option 1: Auto-run Migration (Easiest)

```bash
node scripts/migrate-add-customer-line-id.js
```

This requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

### Option 2: Supabase Studio (Manual)

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project
   - Click **SQL Editor** tab

2. **Create new query and paste:**

```sql
-- Add customer_line_id to repair_requests for LINE notifications
ALTER TABLE IF EXISTS public.repair_requests
  ADD COLUMN IF NOT EXISTS customer_line_id text;

-- Optional index to speed up lookups by customer_line_id
CREATE INDEX IF NOT EXISTS idx_repair_requests_customer_line_id 
ON public.repair_requests (customer_line_id);
```

3. **Click "Run" button**

4. **Restart Next.js dev server**
```bash
npm run dev
```

### Option 3: PowerShell Script

```powershell
.\scripts\migrate-add-customer-line-id.ps1
```

---



## Add request_ip Column

In order to log the originating IP address of repair submissions, a new `request_ip` text column should be added to `repair_requests`.

### Option 1: Auto-run Migration (Easiest)

```bash
node scripts/migrate-add-customer-line-id.js # this script also handles the new column
```

(The JS/PowerShell helpers have been updated to add `request_ip` as well.)

### Option 2: Supabase Studio (Manual)

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project
   - Click **SQL Editor** tab

2. **Create new query and paste:**

```sql
-- Add request_ip to repair_requests for auditing
ALTER TABLE IF EXISTS public.repair_requests
  ADD COLUMN IF NOT EXISTS request_ip text;
```

3. **Click "Run" button**

4. **Restart Next.js dev server**
```bash
npm run dev
```

### Option 3: PowerShell Script

```powershell
.\scripts\migrate-add-customer-line-id.ps1 # also adds request_ip
```

---

## Verify Migration

Check that column exists in Supabase:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'repair_requests'
  AND column_name = 'customer_line_id';
```

Should return a row with:
- column_name: `customer_line_id`
- data_type: `text`

---

## How It Works

When a user fills out a repair form:
1. User enters their Line ID (optional)
2. Form saves to database with `customer_line_id` field
3. When admin marks job as "completed" in dashboard
4. System sends LINE notification to **customer's LINE account** (if customer_line_id was provided)
5. Falls back to **admin's LINE** if customer didn't provide their ID

---

## Troubleshooting

**Error: "Could not find the 'customer_line_id' column"**
- Migration hasn't run yet
- Run one of the migration options above
- Restart Next.js dev server

**No notification received?**
- Check that user entered a valid LINE ID in form
- Verify admin has `LINE_CHANNEL_ACCESS_TOKEN` in `.env.local`
- Local development may have DNS issues with LINE API
- Will work fine in production (Vercel, etc.) with proper DNS
