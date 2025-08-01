# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

InsightsLM is an open-source, self-hostable alternative to NotebookLM. It's a React-based web application that allows users to upload documents, chat with them using AI, and generate audio overviews/podcasts from source materials.

## Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for development and building
- **Tailwind CSS** + **shadcn/ui** for styling
- **React Router** for routing
- **TanStack Query** for server state management
- **React Hook Form** + **Zod** for form handling

### Backend & Infrastructure
- **Supabase** for database, authentication, storage, and edge functions
- **N8N workflows** for backend automation and AI processing
- **PostgreSQL** with vector extensions for document embeddings
- **OpenAI/Gemini APIs** for chat and content generation

### Key Data Models
- `profiles` - User profiles linked to Supabase auth, now includes user preferences for AI processing (summary_prompt, deep_dive_prompt, categorization_prompt)
- `notebooks` - Collections of sources with generated content
- `sources` - Individual documents/URLs with processing status, includes content, summary, deep_summary, display_name, category fields
- `notes` - User-generated notes within notebooks
- `documents` - Vector embeddings for RAG search with metadata (notebook_id, source_id, user_id)
- `user_categories` - Custom categorization system for content organization

## Development Commands

```bash
# Development
npm run dev              # Start Vite dev server on port 8080
npm run build            # Production build
npm run build:dev        # Development build
npm run preview          # Preview production build
npm run lint             # ESLint check

# Supabase (if working locally)
supabase start           # Start local Supabase stack
supabase db reset        # Reset local database
supabase functions serve # Serve edge functions locally
```

## Key Directories

- `src/components/` - React components organized by feature
  - `auth/` - Authentication components
  - `chat/` - Chat interface and message rendering
  - `dashboard/` - Main dashboard and notebook grid
  - `feed/` - Document feed and source management
  - `notebook/` - Notebook interface with chat and sources
  - `ui/` - shadcn/ui components
- `src/hooks/` - Custom React hooks for data fetching
- `src/pages/` - Top-level page components
- `src/integrations/supabase/` - Supabase client and types
- `supabase/functions/` - Edge functions for backend logic
- `supabase/migrations/` - Database schema migrations
- `n8n/` - N8N workflow JSON files

## Key Features & Workflows

### Document Processing
1. User uploads document via `useFileUpload` hook
2. Creates source record in database
3. Triggers `process-document` edge function
4. N8N workflow processes file, extracts text, generates embeddings
5. Status updates reflected in UI via real-time subscriptions

### Chat System
- Uses `useChatMessages` hook for message management
- Sends messages via `send-chat-message` edge function
- N8N workflow handles RAG search and AI response generation
- Citations link back to source documents

### Notebook Generation
- `useNotebookGeneration` triggers content generation
- N8N workflow creates summaries, questions, and insights
- Audio generation creates podcast-style overviews

## Development Notes

### State Management
- Uses TanStack Query for server state with optimistic updates
- Supabase real-time subscriptions for live updates
- React Context for authentication state

### Authentication
- Handled entirely through Supabase Auth
- `AuthContext` manages user state and session handling
- `ProtectedRoute` component guards authenticated pages

### Styling
- Tailwind CSS with custom configuration
- shadcn/ui component library
- CSS-in-JS not used - pure Tailwind classes

### Testing
No test framework currently configured. When adding tests, check if the project already uses a specific framework before installing new dependencies.

## N8N Integration

The application relies heavily on N8N workflows for backend processing. Key workflows include:

### Core Processing Workflows
- **Process Additional Sources** - Handles multiple website URLs, uses Jina.ai for web scraping, supports both feed and notebook sources with different storage paths
- **Upsert to Vector Store** - Creates embeddings from extracted text, generates AI summaries/titles/categories using user preferences, updates source records with processing results
- **Document processing** - File upload and text extraction pipeline
- **Chat message handling** - RAG search with context from vector store
- **Notebook content generation** - AI-generated summaries and insights
- **Audio overview generation** - Podcast-style audio content creation

### Enhanced Features
- **User Customization** - Workflows now read user preferences from profiles table (summary_prompt, deep_dive_prompt, categorization_prompt)
- **Feed vs Notebook Sources** - Intelligent handling of different source types with appropriate storage paths
- **Content Analysis** - AI-powered title generation, categorization, and deep-dive analysis
- **Web Scraping** - Multiple approaches including Jina.ai and custom URL content scraper
- **ICE Scoring** - Creative testing framework support for content optimization

N8N webhooks are configured in Supabase edge function secrets and triggered from the edge functions.

## Environment Setup

When working with this codebase:
1. Ensure Supabase project is connected
2. N8N workflows are imported and configured
3. Required API keys (OpenAI, etc.) are set in N8N and Supabase secrets
4. Database migrations are up to date