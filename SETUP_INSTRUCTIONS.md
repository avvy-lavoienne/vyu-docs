# 🚀 DocForge AI - Setup Instructions

## ⚠️ PENTING: Run Database Migration Dulu!

Sebelum aplikasi bisa berfungsi, Anda **HARUS** menjalankan SQL migration untuk membuat database tables di Supabase.

### Langkah-langkah:

1. **Buka Supabase SQL Editor:**
   👉 [https://supabase.com/dashboard/project/gsytlheevnquetnmdind/sql/new](https://supabase.com/dashboard/project/gsytlheevnquetnmdind/sql/new)

2. **Copy isi file SQL migration:**
   - File ada di: `/app/supabase/migrations/001_initial_schema.sql`
   - Atau copy langsung dari output di bawah ini

3. **Paste ke SQL Editor dan klik "Run"**

4. **Tunggu hingga muncul pesan sukses:**
   - Anda akan melihat: `✅ DocForge AI database schema created successfully!`

---

## 📋 SQL Migration (Copy ini ke Supabase SQL Editor)

```sql
-- DocForge AI - Initial Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgvector extension for Phase 3 RAG
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- TABLE: repositories
-- ============================================
CREATE TABLE IF NOT EXISTS repositories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  owner TEXT NOT NULL,
  repo TEXT NOT NULL,
  name TEXT,
  description TEXT,
  language TEXT,
  stars INTEGER DEFAULT 0,
  forks INTEGER DEFAULT 0,
  default_branch TEXT DEFAULT 'main',
  status TEXT DEFAULT 'pending',
  error TEXT,
  analyzed_at TIMESTAMPTZ,
  doc_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(url)
);

-- ============================================
-- TABLE: documentation
-- ============================================
CREATE TABLE IF NOT EXISTS documentation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repo_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  readme JSONB NOT NULL,
  architecture JSONB NOT NULL,
  setup JSONB NOT NULL,
  files_analyzed TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: document_versions (Phase 2)
-- ============================================
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doc_id UUID REFERENCES documentation(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  readme JSONB,
  architecture JSONB,
  setup JSONB,
  change_summary TEXT,
  created_by_webhook BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doc_id, version_number)
);

-- ============================================
-- TABLE: code_chunks (Phase 3 - RAG)
-- ============================================
CREATE TABLE IF NOT EXISTS code_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repo_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: chat_sessions (Phase 3 - RAG)
-- ============================================
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repo_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: chat_messages (Phase 3 - RAG)
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  sources JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_repositories_status ON repositories(status);
CREATE INDEX IF NOT EXISTS idx_repositories_created_at ON repositories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documentation_repo_id ON documentation(repo_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_doc_id ON document_versions(doc_id);
CREATE INDEX IF NOT EXISTS idx_code_chunks_repo_id ON code_chunks(repo_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_repo_id ON chat_sessions(repo_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);

-- pgvector index for similarity search (Phase 3)
CREATE INDEX IF NOT EXISTS idx_code_chunks_embedding ON code_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_repositories_updated_at BEFORE UPDATE ON repositories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documentation_updated_at BEFORE UPDATE ON documentation
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ DocForge AI database schema created successfully!';
END $$;
```

---

## ✅ Setelah Migration Berhasil

Setelah run SQL migration berhasil, aplikasi siap digunakan! Backend API sudah bisa:

1. **Analyze GitHub Repository** - `POST /api/analyze`
2. **List All Repositories** - `GET /api/repos`
3. **Get Specific Repo with Docs** - `GET /api/repos/[id]`
4. **Delete Repository** - `DELETE /api/repos/[id]`

---

## 🔑 Credentials yang Tersimpan

- ✅ Supabase URL & Keys
- ✅ DeepSeek API Key
- ⏳ GitHub PAT (akan Anda berikan nanti saat test)

---

## 📂 Project Structure Saat Ini

```
/app
├── .env                          # ✅ Environment variables
├── package.json                  # ✅ Dependencies installed
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # ✅ Database schema
├── lib/
│   ├── supabase/
│   │   ├── client.js             # ✅ Browser client
│   │   └── server.js             # ✅ Server client (admin)
│   ├── github/
│   │   └── api.js                # ✅ GitHub API wrapper
│   ├── ai/
│   │   └── deepseek.js           # ✅ DeepSeek AI service
│   └── utils/
│       ├── markdown.js           # ✅ Markdown utilities
│       └── validation.js         # ✅ Input validation
└── app/
    ├── api/[[...path]]/route.js  # ✅ Backend API (updated)
    ├── page.js                   # 🔨 Landing page (needs update)
    ├── dashboard/page.js         # 🔨 Dashboard (needs update)
    ├── analyze/page.js           # 🔨 Analyze page (needs update)
    └── docs/[id]/page.js         # 🔨 Doc viewer (needs update)
```

---

**🎯 Status Saat Ini:**
- ✅ Database schema ready
- ✅ Core libraries implemented
- ✅ Backend API complete
- 🔨 Frontend pages perlu diupdate dengan design system proper
- ⏳ Menunggu Anda run SQL migration

**Silakan run SQL migration di Supabase, lalu konfirmasi di sini agar saya bisa lanjut update frontend! 🚀**
