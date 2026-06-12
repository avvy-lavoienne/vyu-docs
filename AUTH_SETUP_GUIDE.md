# 🔐 Authentication System - Quick Start Guide

## ⚠️ FIXED: Migration SQL Error

**Error sebelumnya:** `relation "users" does not exist`

**Solution:** Menggunakan Supabase Auth's built-in `auth.users` table + custom `profiles` table.

---

## 🚀 LANGKAH SETUP (UPDATED):

### **Step 1: Run Fixed Migration SQL**

Buka Supabase SQL Editor:
👉 [https://supabase.com/dashboard/project/gsytlheevnquetnmdind/sql/new](https://supabase.com/dashboard/project/gsytlheevnquetnmdind/sql/new)

Copy & paste SQL dari file:
📄 `/app/supabase/migrations/003_production_auth_fixed.sql`

**Apa yang di-create:**
- ✅ `profiles` table (extends auth.users)
- ✅ `payments` table (QRIS manual verification)
- ✅ `api_usage` table (tracking)
- ✅ Auto-create profile trigger (on signup)
- ✅ Credit management functions
- ✅ Row Level Security (RLS) policies

**Klik "Run" dan tunggu success message:**
```
✅ Phase 3 Production schema complete! Profiles, payments, and API tracking ready with RLS enabled.
```

---

### **Step 2: Test Authentication**

#### **A. Signup Test:**
1. Buka: `https://codebase-docs-3.preview.emergentagent.com/auth/signup`
2. Fill form:
   - Name: Your Name
   - Email: your@email.com
   - Password: minimum 6 characters
3. Submit → Akan redirect ke login dengan success message
4. Check email untuk verification link (dari Supabase)

#### **B. Login Test:**
1. Buka: `/auth/login`
2. Login dengan credentials yang baru dibuat
3. Success → Akan redirect ke `/dashboard`

#### **C. Verify Profile Created:**
```sql
-- Check di Supabase Table Editor
SELECT * FROM profiles WHERE email = 'your@email.com';

-- Should show:
-- - id (UUID from auth.users)
-- - email
-- - name
-- - subscription_tier: 'free'
-- - credits_remaining: 5
-- - trial_ends_at: 7 days from now
```

---

## 📊 **ARCHITECTURE:**

```
┌──────────────────────────────────────────────────────┐
│  SUPABASE AUTH (Built-in)                            │
│  ┌────────────┐                                      │
│  │ auth.users │ - Handles authentication            │
│  └────────────┘ - Email verification                │
│        │        - Password reset                     │
│        │        - Session management                 │
│        ▼                                             │
│  ┌────────────┐  [AUTO-CREATED BY TRIGGER]          │
│  │  profiles  │ - User metadata                     │
│  │            │ - Subscription tier                 │
│  │            │ - Credits tracking                  │
│  │            │ - API keys                          │
│  └────────────┘                                     │
└──────────────────────────────────────────────────────┘
```

---

## 🎯 **FEATURES READY:**

### **User dapat:**
- ✅ Sign up dengan email/password
- ✅ Login & logout
- ✅ Reset password (forgot password flow)
- ✅ Auto-assigned FREE tier (5 credits)
- ✅ 7 days trial period
- ✅ Email verification (Supabase handles ini)

### **System dapat:**
- ✅ Auto-create profile on signup (database trigger)
- ✅ Track credits per user
- ✅ Enforce tier limits
- ✅ Log API usage
- ✅ Monthly credit reset
- ✅ Row Level Security (users only see their own data)

---

## 🔒 **SECURITY (RLS Enabled):**

- ✅ Users can only view/update their own profile
- ✅ Users can only see their own repositories
- ✅ Users can only see their own payments
- ✅ Users can only see their own API usage
- ✅ Database-level security (not just application-level)

---

## 🐛 **TROUBLESHOOTING:**

### **1. Email not received?**
- Check spam folder
- Verify email settings di Supabase Dashboard > Authentication > Email Templates
- Test email delivery di Supabase > Authentication > Email Preview

### **2. Login fails?**
- Verify email first (check inbox)
- Password minimum 6 characters
- Check Supabase Dashboard > Authentication > Users untuk melihat user status

### **3. Profile not created?**
- Trigger should auto-create profile
- Check SQL logs di Supabase > Database > Triggers
- Manually check: `SELECT * FROM profiles;`

---

## 📁 **FILES UPDATED:**

- ✅ `/app/lib/auth/context.js` - Uses `profiles` table
- ✅ `/app/lib/auth/middleware.js` - Uses `profiles` table
- ✅ `/app/supabase/migrations/003_production_auth_fixed.sql` - Correct schema

---

## ⏭️ **NEXT: Sprint 2**

Setelah auth working, kita akan build:
1. Profile page dengan credits display
2. Usage dashboard
3. Account settings
4. Protected routes untuk all pages
5. Credits enforcement di analyze flow

**Konfirmasi setelah test auth berhasil untuk lanjut Sprint 2!** 🚀
