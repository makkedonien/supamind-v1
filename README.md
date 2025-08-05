# SupaMind: AI-Powered Knowledge Assistant

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue.svg)](https://www.typescriptlang.org/)

> Transform your documents into an intelligent, searchable knowledge base. Upload, organize, and chat with your content using advanced AI technology.

SupaMind is a modern, open-source knowledge management platform that enables you to build a personalized AI assistant grounded in your own documents and data. Whether you're conducting research, managing team knowledge, or organizing personal information, SupaMind provides powerful AI-driven insights while maintaining complete control over your data.

## About The Project

SupaMind addresses the growing need for intelligent document management and knowledge retrieval. Unlike closed-source alternatives, this platform gives you full control over your data while providing enterprise-grade AI capabilities through a modern, intuitive interface.

Built with a robust architecture combining React, Supabase, and N8N workflows, SupaMind offers both cloud and self-hosted deployment options, making it suitable for individuals, teams, and organizations of any size.

## Key Features

### 📄 **Document Management**
- **Multi-format Support**: Upload PDFs, documents, audio files, images, and web content
- **Intelligent Processing**: Automatic text extraction, summarization, and categorization
- **Organized Collections**: Group related documents into notebooks for focused research

### 💬 **AI-Powered Chat**
- **Context-Aware Conversations**: Chat with your documents using advanced RAG (Retrieval-Augmented Generation)
- **Verifiable Citations**: Every AI response includes direct links to source material
- **Smart Search**: Find information across your entire knowledge base instantly

### 🎧 **Audio Generation**
- **Podcast Creation**: Generate engaging audio discussions from your documents
- **Content Summaries**: Create audio overviews of complex materials
- **Multiple Voices**: Natural-sounding AI narration for enhanced accessibility

### 🔒 **Privacy & Control**
- **Self-Hosted Option**: Deploy on your own infrastructure for maximum data control
- **Local AI Support**: Use local models with Ollama for complete privacy
- **Secure Storage**: Enterprise-grade security with Supabase backend

### ⚙️ **Customization**
- **Custom Prompts**: Tailor AI behavior to your specific needs
- **Category Management**: Organize content with custom taxonomies
- **Workflow Automation**: Extensible N8N-based processing pipelines

## Built With

**Frontend Stack:**
- [React 18](https://react.dev/) - Modern UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Vite](https://vitejs.dev/) - Fast build tool and dev server
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful, accessible components

**Backend & Infrastructure:**
- [Supabase](https://supabase.com/) - Database, authentication, and storage
- [N8N](https://n8n.io/) - Workflow automation and backend logic
- PostgreSQL with vector extensions for embeddings
- OpenAI/Gemini APIs for AI processing

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- N8N instance (cloud or self-hosted)
- OpenAI or Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd supamind-v1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the included migrations to set up the database schema
   - Configure authentication settings

5. **Import N8N workflows**
   - Import the JSON workflows from the `/n8n` directory
   - Configure webhook URLs and API credentials
   - Set up required secrets in Supabase Edge Functions

6. **Start development server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:5173` to access the application.

## Architecture Overview

SupaMind uses a modern, scalable architecture:

- **Frontend**: React SPA with TypeScript and Vite
- **Database**: PostgreSQL with vector extensions via Supabase
- **Authentication**: Supabase Auth with JWT tokens
- **File Storage**: Supabase Storage for documents and media
- **AI Processing**: N8N workflows orchestrating AI APIs
- **Real-time Updates**: Supabase realtime subscriptions

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Project Structure

```
src/
├── components/      # React components organized by feature
│   ├── auth/       # Authentication components
│   ├── chat/       # Chat interface and messaging
│   ├── dashboard/  # Main dashboard and navigation
│   ├── feed/       # Document feed management
│   ├── notebook/   # Notebook interface and tools
│   └── ui/         # Reusable UI components
├── hooks/          # Custom React hooks
├── pages/          # Top-level page components
├── contexts/       # React context providers
├── integrations/   # External service integrations
└── lib/           # Utility functions and helpers
```

## Deployment

### Cloud Deployment

Deploy to platforms like Netlify, Vercel, or Railway:

1. Connect your repository
2. Set environment variables
3. Deploy with automatic builds

### Self-Hosted Deployment

For maximum control and privacy:

1. Set up a VPS or cloud instance
2. Install Docker and Docker Compose
3. Configure reverse proxy (nginx/Traefik)
4. Deploy with provided Docker configuration

## Local AI Setup

For complete privacy, use the local AI version:

- **Models**: Ollama with Qwen3 for text generation
- **Speech**: Whisper for transcription, CoquiTTS for synthesis
- **Processing**: Fully offline document analysis

[Local AI Setup Guide](https://github.com/example/supamind-local)

## Contributing

We welcome contributions from the community! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** with appropriate tests
4. **Commit your changes** (`git commit -m 'Add amazing feature'`)
5. **Push to your branch** (`git push origin feature/amazing-feature`)
6. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Use existing component patterns
- Write meaningful commit messages
- Test your changes thoroughly
- Update documentation as needed

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Important Notes

### N8N Licensing

This project uses N8N for workflow automation, which operates under a [Sustainable Use License](https://github.com/n8n-io/n8n/blob/master/LICENSE.md). 

- ✅ **Free for internal business use** and self-hosting
- ❓ **Commercial SaaS usage** may require an Enterprise License
- 🔄 **Alternative**: Convert workflows to Supabase Edge Functions for full open-source deployment

Please review N8N's licensing terms for your specific use case.

### Support & Documentation

- **Issues**: Report bugs and request features via GitHub Issues
- **Discussions**: Join community discussions for questions and ideas
- **Documentation**: Comprehensive guides available in the `/docs` directory

---

**Built with ❤️ for the open-source community**