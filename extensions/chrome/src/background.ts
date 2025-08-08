import { supabase, loadSavedSession } from './supabase';

async function addPageInBackground(url: string) {
  await loadSavedSession();
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    throw new Error('No session available in background. Please authenticate first.');
  }

  const sourcePayload = {
    title: `Website: ${url}`,
    type: 'website' as const,
    url,
    processing_status: 'processing',
    metadata: { originalUrl: url, addedToFeed: true, webhookProcessed: true },
    user_id: sessionData.session.user.id,
    notebook_id: null as any,
  };

  const { data: inserted, error: insertErr } = await supabase
    .from('sources')
    .insert(sourcePayload)
    .select()
    .single();
  if (insertErr) throw insertErr;

  const { error: fnErr } = await supabase.functions.invoke('process-feed-sources', {
    body: {
      type: 'multiple-websites',
      userId: sessionData.session.user.id,
      urls: [url],
      sourceIds: [inserted.id],
      timestamp: new Date().toISOString(),
    },
  });
  if (fnErr) throw fnErr;

  return { sourceId: inserted.id };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message && message.type === 'ADD_PAGE' && typeof message.url === 'string') {
    addPageInBackground(message.url)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((err) => sendResponse({ ok: false, error: String(err?.message || err) }));
    // Keep the message channel open for async response
    return true;
  }
  return undefined;
});


