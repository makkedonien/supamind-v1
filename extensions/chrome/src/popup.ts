import { supabase, loadSavedSession, saveSession } from './supabase';

const APP_ORIGIN = 'https://www.supamind.ai/'; // Replace with your deployed app origin

async function getActiveTabUrl(): Promise<string> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  return tab?.url || '';
}

async function ensureAuth() {
  await loadSavedSession();
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session;

  const authUrl = `${APP_ORIGIN}/extension-auth`;
  const authWin = window.open(authUrl, 'supamind-auth', 'width=420,height=640');

  const session: any = await new Promise((resolve, reject) => {
    const handler = (event: MessageEvent) => {
      try {
        if (event.origin !== APP_ORIGIN) return;
        if (typeof event.data !== 'object') return;
        if (event.data?.type === 'SUPABASE_SESSION' && event.data?.session) {
          window.removeEventListener('message', handler);
          resolve(event.data.session);
        }
      } catch {}
    };
    window.addEventListener('message', handler);
    setTimeout(() => {
      window.removeEventListener('message', handler);
      reject(new Error('Auth timeout'));
    }, 120000);
  });

  await supabase.auth.setSession(session);
  await saveSession(session);
  authWin?.close();
  return session;
}

async function addCurrentPage() {
  const session = await ensureAuth();
  const url = await getActiveTabUrl();
  if (!url) throw new Error('Unable to read active tab URL');

  const sourcePayload = {
    title: `Website: ${url}`,
    type: 'website' as const,
    url,
    processing_status: 'processing',
    metadata: { originalUrl: url, addedToFeed: true, webhookProcessed: true },
    user_id: session.user.id,
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
      userId: session.user.id,
      urls: [url],
      sourceIds: [inserted.id],
      timestamp: new Date().toISOString(),
    },
  });
  if (fnErr) throw fnErr;
}

document.getElementById('add-btn')?.addEventListener('click', async () => {
  const btn = document.getElementById('add-btn') as HTMLButtonElement;
  btn.disabled = true;
  const original = btn.textContent || 'Add this page';
  try {
    btn.textContent = 'Adding…';
    await addCurrentPage();
    btn.textContent = 'Added!';
  } catch (e) {
    console.error(e);
    btn.textContent = 'Failed';
  } finally {
    setTimeout(() => {
      btn.textContent = original;
      btn.disabled = false;
    }, 1500);
  }
});


