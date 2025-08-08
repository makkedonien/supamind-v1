import React from "react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: 2025-08-08</p>

        <div className="prose prose-neutral max-w-none">
          <p>
            This Privacy Policy explains how we collect, use, and safeguard information when you
            use the Supamind web app and the optional Supamind Chrome extension (together, the
            "Service"). By using the Service, you agree to the practices described here.
          </p>

          <h2>What this app does</h2>
          <p>
            Supamind lets you upload documents and links, organize them into notebooks, and use AI
            to chat with and summarize your content. You can also generate audio overviews and
            podcast-style microcasts from your materials. The Service uses Supabase for database,
            authentication, and storage, plus serverless workflows to process content and call AI
            providers for generation tasks.
          </p>

          <h2>Information we collect</h2>
          <ul>
            <li>
              <strong>Account information</strong>: When you sign in via Supabase Auth, we receive
              identifiers such as your email address and provider profile details.
            </li>
            <li>
              <strong>Content you provide</strong>: Documents and media you upload (e.g., PDFs,
              audio files), website or YouTube URLs you add, text you paste, notes you write, and
              chat prompts and messages.
            </li>
            <li>
              <strong>Derived data</strong>: Processing outputs such as extracted text, vector
              embeddings for retrieval, titles, summaries, categories, generated notebook content,
              and generated audio files.
            </li>
            <li>
              <strong>Usage and technical data</strong>: Basic logs and metadata needed to operate
              the Service (e.g., timestamps, error logs). We do not include third‑party analytics
              libraries in the app by default.
            </li>
            <li>
              <strong>Chrome extension (optional)</strong>: If you use the extension and click
              "Add this page", it reads the active tab URL you selected and sends it to your
              account. The extension stores your Supabase session in <code>chrome.storage.local</code>
              to keep you signed in. It does not otherwise collect your browsing history.
            </li>
          </ul>

          <h2>How we use information</h2>
          <ul>
            <li>Authenticate you and maintain your session.</li>
            <li>Store, organize, and display your sources, notebooks, notes, and audio.</li>
            <li>
              Process your content to enable features like text extraction, summarization,
              categorization, vector embeddings, chat answers with citations, notebook generation,
              and audio generation.
            </li>
            <li>Provide customer support, improve reliability, and prevent abuse.</li>
          </ul>

          <h2>Where your data is stored</h2>
          <ul>
            <li>
              <strong>Supabase</strong>: We use Supabase Postgres for tables (e.g., profiles,
              notebooks, sources, notes, documents) and Supabase Storage for uploaded files and
              generated media.
            </li>
            <li>
              <strong>Serverless workflows</strong>: Supabase Edge Functions trigger workflows (e.g.,
              via N8N or equivalent) that process your files/URLs and call AI providers. These
              workflows may temporarily handle content and metadata to complete processing.
            </li>
          </ul>

          <h2>Sharing with service providers</h2>
          <p>
            To deliver the Service, we share necessary data with subprocessors acting on our behalf,
            including:
          </p>
          <ul>
            <li>Supabase (database, authentication, storage, edge functions).</li>
            <li>
              Workflow automation (e.g., N8N) used to orchestrate document processing and AI calls.
            </li>
            <li>
              AI model providers (e.g., OpenAI and/or Gemini) for chat and content generation using
              your provided and derived content.
            </li>
            <li>
              Web content extraction services (e.g., Jina.ai or similar) for processing URLs you
              submit.
            </li>
            <li>
              Audio generation/transcription providers when you request audio features.
            </li>
            <li>Hosting and infrastructure providers required to run the Service.</li>
          </ul>
          <p>
            We do not sell your personal information. Providers are engaged under terms requiring
            appropriate confidentiality, security, and use only for providing the Service.
          </p>

          <h2>Legal bases (EEA/UK)</h2>
          <ul>
            <li>
              <strong>Contract</strong>: To provide and operate the Service you request.
            </li>
            <li>
              <strong>Legitimate interests</strong>: To secure and improve the Service and prevent
              abuse.
            </li>
            <li>
              <strong>Consent</strong>: Where required for optional features or specific providers.
            </li>
          </ul>

          <h2>Data retention</h2>
          <p>
            We retain your content and derived data until you delete it or close your account, or as
            needed to operate the Service. You can delete sources, notebooks, notes, and generated
            assets from within the app. Backups and logs may persist for a limited time.
          </p>

          <h2>Security</h2>
          <p>
            We use industry‑standard measures such as transport encryption, access controls, and
            scoped service keys. No method of transmission or storage is 100% secure, but we work to
            protect your information.
          </p>

          <h2>International transfers</h2>
          <p>
            Depending on your deployment and chosen providers, data may be processed in regions
            outside your own. Where applicable, we rely on appropriate safeguards.
          </p>

          <h2>Your rights</h2>
          <p>
            Subject to local laws, you may have rights to access, correct, delete, export, or object
            to processing of your personal information. You can exercise many controls directly in
            the app (e.g., deleting sources/notebooks). For additional requests, contact us.
          </p>

          <h2>Cookies and local storage</h2>
          <p>
            The web app uses browser storage (e.g., localStorage) to keep your Supabase
            authentication session and app preferences. We do not include third‑party analytics
            cookies by default.
          </p>

          <h2>Children</h2>
          <p>
            The Service is not intended for children under the age of 13 (or the age required by
            your jurisdiction). Do not use the Service if you do not meet the minimum age.
          </p>

          <h2>Contact</h2>
          <p>
            Questions or requests? Email: <a href="mailto:privacy@supamind.app">privacy@supamind.app</a>.
            If you self‑host this project, replace this contact with your own.
          </p>

          <h2>Changes to this policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Material changes will be reflected
            by updating the date above. Your continued use of the Service after changes indicates
            acceptance of the updated policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;


