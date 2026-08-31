// @ts-ignore
import localtunnel from 'localtunnel';

async function start() {
  const subdomain = `leadflow-crm-${Math.random().toString(36).substring(2, 8)}`;
  console.log(`⏳ Connecting to localtunnel with subdomain: ${subdomain}...`);
  try {
    const tunnel = await localtunnel({
      port: 3000,
      subdomain,
    });

    console.log('\n======================================================');
    console.log(`🌐 Public Tunnel URL: ${tunnel.url}`);
    console.log(`📡 n8n Ingestion URL: ${tunnel.url}/api/integrations/n8n/leads`);
    console.log('======================================================\n');

    tunnel.on('close', () => {
      console.log('⚠️ Tunnel closed. Reconnecting in 3s...');
      setTimeout(start, 3000);
    });

    tunnel.on('error', (err: any) => {
      console.error('Tunnel error:', err?.message || err);
      setTimeout(start, 3000);
    });
  } catch (err: any) {
    console.error('Failed to start tunnel:', err?.message || err);
    setTimeout(start, 4000);
  }
}

start();
