import { supabase, loadSavedSession, saveSession } from './supabase';

const APP_ORIGIN = import.meta.env.VITE_APP_ORIGIN as string;

async function getActiveTabUrl(): Promise<string> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  return tab?.url || '';
}

async function ensureAuth() {
  await loadSavedSession();
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session;

  console.log('Opening auth window at:', `${APP_ORIGIN}/extension-auth`);
  const authUrl = `${APP_ORIGIN}/extension-auth`;
  const authWin = window.open(authUrl, 'supamind-auth', 'width=420,height=640');

  const session: any = await new Promise((resolve, reject) => {
    const handler = (event: MessageEvent) => {
      try {
        console.log('Received message:', event);
        console.log('Event origin:', event.origin, 'Expected:', APP_ORIGIN);
        // Allow messages from the expected origin, but be more lenient for debugging
        if (event.origin !== APP_ORIGIN) {
          console.log('Origin mismatch - Expected:', APP_ORIGIN, 'Got:', event.origin);
          // Still process the message for debugging, but log the mismatch
        }
        if (typeof event.data !== 'object') return;
        if (event.data?.type === 'SUPABASE_SESSION' && event.data?.session) {
          console.log('Received valid session!');
          window.removeEventListener('message', handler);
          resolve(event.data.session);
        }
      } catch (err) {
        console.error('Error handling message:', err);
      }
    };
    window.addEventListener('message', handler);
    setTimeout(() => {
      console.log('Auth timeout after 2 minutes');
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
  const iconSpan = btn.querySelector('.status-icon') as HTMLSpanElement;
  
  btn.disabled = true;
  const originalText = 'Add this page';
  const originalIcon = '+';
  
  try {
    // Adding state
    iconSpan.textContent = '⏳';
    btn.innerHTML = '<span class="status-icon">⏳</span>Adding…';
    
    await addCurrentPage();
    
    // Success state
    btn.classList.add('success-state');
    iconSpan.textContent = '✓';
    btn.innerHTML = '<span class="status-icon">✓</span>Page added successfully!';
    
    // Show success for 5 seconds with countdown
    let countdown = 5;
    const countdownInterval = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        btn.innerHTML = `<span class="status-icon">✓</span>Page added successfully! (${countdown}s)`;
      } else {
        clearInterval(countdownInterval);
        
        // Reset to original state
        btn.classList.remove('success-state');
        btn.innerHTML = `<span class="status-icon">${originalIcon}</span>${originalText}`;
        btn.disabled = false;
      }
    }, 1000);
    
  } catch (e) {
    console.error(e);
    
    // Error state
    iconSpan.textContent = '❌';
    btn.innerHTML = '<span class="status-icon">❌</span>Failed to add page';
    
    // Reset after 3 seconds
    setTimeout(() => {
      btn.innerHTML = `<span class="status-icon">${originalIcon}</span>${originalText}`;
      btn.disabled = false;
    }, 3000);
  }
});


