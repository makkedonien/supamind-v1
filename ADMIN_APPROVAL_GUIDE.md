# Admin Approval System Guide

This document explains how to use the new manual admin approval system for user registration.

## Overview

A security layer has been added that requires new users to be manually approved by an admin before they can access any features of the application. This prevents unauthorized users from signing up and using the app.

## Database Changes

Two new fields have been added to the `profiles` table:

1. **`admin_approval`** (boolean, default: `false`)
   - Determines whether a user is approved to access the application
   - New users will have this set to `false` by default
   - Existing users were grandfathered in with `true` during migration

2. **`user_role`** (text, default: `'standard'`)
   - Stores the user's role (currently: 'standard')
   - Reserved for future role-based permissions if needed

## User Experience

### For New Users
1. User signs up with email/password
2. After authentication, they are automatically redirected to a "Pending Approval" page
3. This page explains their account is under review
4. They can check their approval status by clicking "Check Status" (refreshes the page)
5. Once approved by admin, they can access all features normally

### For Approved Users
- Full access to all features as before
- No changes to their experience

## How to Approve Users (Admin Tasks)

### Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Table Editor** → **profiles**
3. Find the user you want to approve
4. Set `admin_approval` to `true`
5. The user will be able to access the app on their next page refresh

### Using SQL Query

You can also approve users using SQL:

```sql
-- Approve a specific user by email
UPDATE public.profiles
SET admin_approval = true
WHERE email = 'user@example.com';

-- Approve a specific user by ID
UPDATE public.profiles
SET admin_approval = true
WHERE id = 'user-uuid-here';

-- View all pending users
SELECT id, email, full_name, created_at
FROM public.profiles
WHERE admin_approval = false
ORDER BY created_at DESC;

-- Approve multiple users at once
UPDATE public.profiles
SET admin_approval = true
WHERE email IN ('user1@example.com', 'user2@example.com');
```

### Setting up Admin Notifications (Optional)

You may want to set up email notifications when new users sign up. This can be done using:

1. **Supabase Functions**: Create a database trigger that sends you an email when a new profile is created
2. **n8n Workflow**: Use the existing n8n workflow "New user sign-up notification" (found in the `n8n/` directory)
3. **Supabase Webhooks**: Set up a webhook to notify your preferred system

## Security Features

### Frontend Protection
- `ProtectedRoute` component checks both authentication AND approval status
- Unapproved users are automatically redirected to `/pending-approval`
- `AuthContext` fetches and tracks approval status in real-time

### Backend Protection (RLS Policies)
All database tables now include admin approval checks:
- ✅ profiles (partial - can view own profile, but can't update without approval)
- ✅ notebooks
- ✅ sources
- ✅ notes
- ✅ documents
- ✅ n8n_chat_histories
- ✅ microcasts
- ✅ podcasts
- ✅ user_categories
- ✅ Storage buckets (sources, audio)

This means even if someone bypasses the frontend, they cannot:
- Create, read, update, or delete any data
- Upload or access files in storage
- Make database queries
- Execute any operations

## Files Changed

### Database Migrations
- `supabase/migrations/20251027000000_add_admin_approval_to_profiles.sql` - Adds columns
- `supabase/migrations/20251027000001_add_admin_approval_rls_policies.sql` - Updates RLS policies

### Frontend Components
- `src/contexts/AuthContext.tsx` - Fetches and tracks approval status
- `src/components/auth/ProtectedRoute.tsx` - Checks approval before rendering
- `src/pages/PendingApproval.tsx` - New page for unapproved users
- `src/App.tsx` - Adds route for pending approval page

## Testing the Implementation

### Test with a New User
1. Create a new user account (use an incognito window)
2. Verify they land on the "Pending Approval" page
3. Try to manually navigate to protected routes (they should redirect back)
4. Approve the user in the database
5. Click "Check Status" on the pending page
6. Verify they can now access all features

### Verify RLS Policies
Try making direct Supabase queries as an unapproved user - they should all fail with permission errors.

## Future Enhancements

Consider adding:
1. **Admin Dashboard**: Create a dedicated page for admins to view/approve pending users
2. **Email Notifications**: Auto-notify admins when new users sign up
3. **User Notifications**: Send email to users when they're approved
4. **Bulk Approval**: UI for approving multiple users at once
5. **Role Management**: Expand `user_role` field for different permission levels (admin, standard, viewer, etc.)
6. **Rejection Flow**: Add ability to reject users with a reason

## Troubleshooting

**Issue**: Existing users are locked out
- **Solution**: Run the first migration again - it sets `admin_approval = true` for all existing users

**Issue**: New user stuck on pending page even after approval
- **Solution**: Have user click "Check Status" or hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)

**Issue**: User bypasses frontend but can still access data
- **Solution**: Verify RLS policies are enabled and migrations ran successfully

**Issue**: Need to revoke a user's access
- **Solution**: Set `admin_approval = false` for that user - they'll be locked out immediately

## Support

For questions or issues with the approval system, check:
1. Supabase logs for RLS policy errors
2. Browser console for frontend errors
3. Database migrations to ensure they ran successfully


