# Categories Context Migration

## Problem
The `useUserCategories` hook was being called independently in multiple components (Settings, AppSidebar, SourceCategoryDialog), causing:
- Multiple simultaneous API calls to `manage-user-categories`
- Rapid rate limit exhaustion (100 req/hour limit)
- 429 "Too Many Requests" errors on page load

## Solution
Created a centralized `CategoriesContext` that:
- Fetches categories once when the user authenticates
- Shares the same data across all components
- Prevents duplicate API calls
- Eliminates rate limit issues

## Changes Made

### 1. Created New Context
**File:** `src/contexts/CategoriesContext.tsx`
- Moved all category management logic from the hook to a context provider
- Provides `useCategories` hook for consuming components
- Fetches categories once on authentication

### 2. Added Provider to App
**File:** `src/App.tsx`
- Added `CategoriesProvider` wrapper inside `AuthProvider`
- Ensures categories are available throughout the app

### 3. Updated Components
Updated the following components to use `useCategories()` instead of `useUserCategories()`:

- **src/components/layout/AppSidebar.tsx**
- **src/components/feed/SourceCategoryDialog.tsx**
- **src/pages/Settings.tsx**

## Rate Limit Information
- **Current Limit:** 100 requests per hour (LOW_COST tier)
- **Endpoint:** `/functions/v1/manage-user-categories`
- **Location:** `supabase/functions/_shared/rate-limit.ts`

With this change, categories are now fetched only once per session instead of 3+ times on every page navigation.

## Old Hook Status
The old `useUserCategories` hook (`src/hooks/useUserCategories.tsx`) can now be safely deleted as it's no longer in use.

