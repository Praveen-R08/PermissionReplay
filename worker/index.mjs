const definitions = [
 ['location', /\bgeolocation\s*\.\s*(?:getCurrentPosition|watchPosition)\s*\(/g],
 ['screen-sharing', /\bgetDisplayMedia\s*\(/g],
 ['notifications', /\bNotification\s*\.\s*requestPermission\s*\(/g],
 ['push-messages', /\bpushManager\s*\.\s*subscribe\s*\(/g],
 ['clipboard-read', /\bclipboard\s*\.\s*read(?:Text)?\s*\(/g],
 ['clipboard-write', /\bclipboard\s*\.\s*write(?:Text)?\s*\(/g],
 ['bluetooth', /\bbluetooth\s*\.\s*requestDevice\s*\(/g],
 ['usb', /\busb\s*\.\s*requestDevice\s*\(/g],
 ['serial-port', /\bserial\s*\.\s*requestPort\s*\(/g],
 ['hid-device', /\bhid\s*\.\s*requestDevice\s*\(/g],
 ['midi', /\brequestMIDIAccess\s*\(/g],
 ['midi-system-exclusive', /\brequestMIDIAccess\s*\(\s*\{[^{}]{0,300}\bsysex\s*:\s*true/g],
 ['file-system-read', /\bshowOpenFilePicker\s*\(/g],
 ['file-system-write', /\bshowSaveFilePicker\s*\(/g],
 ['directory-access', /\bshowDirectoryPicker\s*\(/g],
 ['contacts', /\bcontacts\s*\.\s*select\s*\(/g],
 ['persistent-storage', /\bstorage\s*\.\s*persist\s*\(/g],
 ['embedded-storage-access', /\bdocument\s*\.\s*requestStorageAccess\s*\(/g],
 ['top-level-storage-access', /\bdocument\s*\.\s*requestStorageAccessFor\s*\(/g],
 ['local-fonts', /\bqueryLocalFonts\s*\(/g],
 ['window-management', /\bgetScreenDetails\s*\(/g],
 ['idle-detection', /\bIdleDetector\s*\.\s*requestPermission\s*\(/g],
 ['nfc', /\bnew\s+NDEFReader\s*\(/g],
 ['speaker-selection', /\bselectAudioOutput\s*\(/g],
 ['screen-wake-lock', /\bwakeLock\s*\.\s*request\s*\(/g],
 ['payment-request', /\bnew\s+PaymentRequest\s*\(/g],
 ['protocol-handlers', /\bregisterProtocolHandler\s*\(/g],
 ['fullscreen', /\brequestFullscreen\s*\(/g],
 ['pointer-lock', /\brequestPointerLock\s*\(/g],
 ['keyboard-lock', /\bkeyboard\s*\.\s*lock\s*\(/g],
 ['picture-in-picture', /\brequestPictureInPicture\s*\(/g],
 ['virtual-reality', /\bxr\s*\.\s*requestSession\s*\(\s*['"]immersive-vr['"]/g],
 ['augmented-reality', /\bxr\s*\.\s*requestSession\s*\(\s*['"]immersive-ar['"]/g],
 ['device-motion-and-orientation', /\bDevice(?:Motion|Orientation)Event\s*\.\s*requestPermission\s*\(/g],
 ['web-share', /\bnavigator\s*\.\s*share\s*\(/g],
 ['web-printing', /\bwindow\s*\.\s*print\s*\(/g],
 ['vibration', /\bnavigator\s*\.\s*vibrate\s*\(/g]
];
const policyIds = {
 geolocation:'location', camera:'camera', microphone:'microphone',
 'display-capture':'screen-sharing', 'clipboard-read':'clipboard-read', 'clipboard-write':'clipboard-write',
 bluetooth:'bluetooth', usb:'usb', serial:'serial-port', hid:'hid-device', midi:'midi',
 fullscreen:'fullscreen', 'picture-in-picture':'picture-in-picture', 'local-fonts':'local-fonts',
 'window-management':'window-management', 'screen-wake-lock':'screen-wake-lock',
 'speaker-selection':'speaker-selection', 'storage-access':'embedded-storage-access',
 payment:'payment-request', 'web-share':'web-share', accelerometer:'accelerometer',
 gyroscope:'gyroscope', magnetometer:'magnetometer', 'ambient-light-sensor':'ambient-light',
 'compute-pressure':'compute-pressure', 'local-network':'local-network', 'loopback-network':'loopback-network'
};

class ScanError extends Error {
 constructor(code, message, status = 422) {
  super(message);
  this.code = code;
  this.status = status;
 }
}

function address(value) {
 if (typeof value !== 'string' || value.length > 1800) throw Error('Enter a public website URL.');
 const trimmed = value.trim();
 let url;
 try {
  url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : 'https://' + trimmed);
 } catch { throw new ScanError('invalid-url', 'Enter a valid public HTTPS URL.', 400); }
 if (url.protocol !== 'https:' || url.port || url.username || url.password ||
     !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z][a-z0-9-]+$/i.test(url.hostname) ||
     /\.(?:local|localhost|internal|test|invalid|example|onion|home|lan)$/i.test(url.hostname)) {
  throw new ScanError('invalid-url', 'Use a public HTTPS hostname with the default port.', 400);
 }
 url.hash = '';
 return url;
}

function publicIp(ip) {
 if (ip.includes(':')) return /^[23][a-f\d]{3}:/i.test(ip) && !/^2001:(?:0|db8):/i.test(ip) && !/^2002:/i.test(ip);
 const [a,b,c] = ip.split('.').map(Number);
 return a > 0 && a < 224 && a !== 10 && a !== 127 &&
  !(a === 100 && b >= 64 && b <= 127) && !(a === 169 && b === 254) &&
  !(a === 172 && b >= 16 && b <= 31) && !(a === 192 && (b === 168 || b === 0 || (b === 88 && c === 99))) &&
  !(a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) && !(a === 203 && b === 0 && c === 113);
}

async function dnsRecords(endpoint, host, type, signal) {
 const dns = new URL(endpoint);
 dns.search = new URLSearchParams({name:host, type});
 const response = await fetch(dns.href, {
  headers:{accept:'application/dns-json'}, redirect:'manual', signal
 });
 if (!response.ok) {
  response.body?.cancel().catch(() => {});
  throw Error('Resolver HTTP ' + response.status);
 }
 const reply = await response.json();
 if (reply.Status === 3) throw new ScanError('hostname-not-found', 'The hostname could not be resolved. Check its spelling.');
 if (reply.Status !== 0 || reply.TC) throw Error('Resolver returned an incomplete DNS answer.');
 return (reply.Answer || []).filter(record => record.type === 1 || record.type === 28).map(record => record.data);
}

async function verifyHost(host, signal) {
 for (const endpoint of ['https://cloudflare-dns.com/dns-query', 'https://dns.google/resolve']) {
  try {
   const replies = await Promise.all(['A','AAAA'].map(type => dnsRecords(endpoint, host, type, signal)));
   const ips = replies.flat();
   if (!ips.length) throw new ScanError('hostname-not-found', 'The hostname has no public address.');
   if (!ips.every(publicIp)) throw new ScanError('nonpublic-address', 'The hostname does not resolve exclusively to public addresses.');
   return;
  } catch (error) {
   if (error instanceof ScanError || signal.aborted) throw error;
   console.warn('Permission Replay DNS resolver failed', new URL(endpoint).hostname, error.message);
  }
 }
 throw new ScanError('dns-unavailable', 'The scanner could not verify the hostname through public DNS. Try again shortly.', 502);
}

async function readLimited(response, limit) {
 const reader = response.body?.getReader();
 if (!reader) return {text:'', truncated:false};
 const decoder = new TextDecoder();
 let text = '', total = 0;
 try {
  for (;;) {
   const {value, done} = await reader.read();
   if (done) return {text:text + decoder.decode(), truncated:false};
   const remaining = limit - total;
   text += decoder.decode(value.subarray(0, remaining), {stream:true});
   total += value.length;
   if (total >= limit) return {text:text + decoder.decode(), truncated:true};
  }
 } finally { reader.cancel().catch(() => {}); }
}

function collect(text, source, signals) {
 for (const [id, pattern] of definitions) {
  const match = text.matchAll(pattern).next().value;
  if (match) signals.push({id, source, evidence:match[0].replace(/\s+/g, ' ').slice(0, 90), kind:'Source match'});
 }
 const calls = text.matchAll(/\bgetUserMedia\s*\(\s*/g);
 const mediaIds = new Set();
 let unresolved = false;
 for (const call of calls) {
  const constraints = /^\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\}){0,600}\}/.exec(text.slice(call.index + call[0].length, call.index + call[0].length + 1200));
  if (!constraints) { unresolved = true; continue; }
  for (const [key, id] of [['audio','microphone'],['video','camera']]) {
   const field = new RegExp('(?:^|[,{}])\\s*[\'" ]*' + key + '[\'" ]*\\s*:\\s*(true\\b|\\{)').exec(constraints[0]);
   if (field && !mediaIds.has(id)) {
    mediaIds.add(id);
    signals.push({id, source, evidence:'getUserMedia({ ' + key + ': ' + (field[1] === '{' ? '{ … }' : 'true') + ' })', kind:'Source match'});
   }
  }
 }
 if (unresolved) signals.push({id:null, source, evidence:'getUserMedia( … ) — camera or microphone arguments could not be determined', kind:'Unresolved call'});
}

async function scan(input, signal) {
 let page = address(input);
 let response;
 for (let count = 0; count <= 4; count++) {
  await verifyHost(page.hostname, signal);
  try {
   response = await fetch(page.href, {redirect:'manual', signal, headers:{accept:'text/html, application/xhtml+xml'}});
  } catch (error) {
   if (signal.aborted) throw error;
   console.warn('Permission Replay page connection failed', error.message);
   throw new ScanError('page-unreachable', 'The scanner could not connect to the website over HTTPS.', 502);
  }
  if (![301,302,303,307,308].includes(response.status)) break;
  const next = response.headers.get('location');
  response.body?.cancel().catch(() => {});
  if (!next || count === 4) throw Error('The website returned too many redirects.');
  page = address(new URL(next, page).href);
 }
 if (!response.ok) throw Error('The website returned HTTP ' + response.status + '. Some sites block automated previews.');
 if (!/html/i.test(response.headers.get('content-type') || '')) throw Error('The URL did not return an HTML page.');
 const policy = response.headers.get('permissions-policy') || '';
 const html = await readLimited(response, 500000);
 const signals = [];
 for (const part of policy.split(',')) {
  const [name] = part.trim().split('=');
  if (Object.hasOwn(policyIds, name)) signals.push({id:policyIds[name], source:'HTTP response header', evidence:part.trim().slice(0, 110), kind:'Policy only'});
 }
 const sameOrigin = new Set();
 let skippedExternal = 0;
 const markup = html.text.replace(/<!--[\s\S]*?-->/g, '');
 const scripts = markup.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi);
 for (const [, attrs, body] of scripts) {
  const src = attrs.match(/\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  if (!src) { collect(body, 'Inline page script', signals); continue; }
  let url;
  try { url = new URL(src[1] ?? src[2] ?? src[3], page); } catch { continue; }
  if (url.origin !== page.origin || url.username || url.password) { skippedExternal++; continue; }
  url.hash = '';
  sameOrigin.add(url.href);
 }
 if (/<input\b[^>]*\btype\s*=\s*(?:"file"|'file'|file(?=[\s/>]))/i.test(markup)) {
  signals.push({id:'file-upload', source:'Page HTML', evidence:'<input type="file">', kind:'HTML control'});
 }
 let scannedScripts = 0, truncatedScripts = 0, failedScripts = 0;
 await Promise.all([...sameOrigin].slice(0,8).map(async href => {
  try {
   const script = await fetch(href, {redirect:'manual', signal, headers:{accept:'application/javascript, text/javascript, */*;q=0.1'}});
   if (!script.ok) { await script.body?.cancel(); failedScripts++; return; }
   const body = await readLimited(script, 375000);
   scannedScripts++;
   if (body.truncated) truncatedScripts++;
   const path = new URL(href).pathname;
   collect(body.text, 'Script ' + path.slice(0, 140), signals);
  } catch { failedScripts++; }
 }));
 const unique = new Map(signals.map(item => [JSON.stringify(item), item]));
 return {url:page.href, findings:[...unique.values()].sort((a,b) => a.kind.localeCompare(b.kind) || a.source.localeCompare(b.source)).slice(0,100),
  coverage:{scannedScripts, failedScripts, skippedExternal, skippedLimit:Math.max(0,sameOrigin.size - 8), truncatedScripts, truncatedHtml:html.truncated, truncatedFindings:unique.size > 100}};
}

function json(value, status = 200) {
 return Response.json(value, {status, headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}

export default {
 async fetch(request) {
  const url = new URL(request.url);
  if (url.pathname === '/api/scan' && request.method === 'POST') {
   if (request.headers.get('origin') !== url.origin || !request.headers.get('content-type')?.startsWith('application/json')) return json({error:'Use the scan form on this site.'},403);
   const controller = new AbortController();
   const timer = setTimeout(() => controller.abort(), 12000);
   try {
    const body = await readLimited(request, 4096);
    if (body.truncated) throw Error('The URL is too long.');
    return json(await scan(JSON.parse(body.text).url, controller.signal));
   } catch (error) {
    if (controller.signal.aborted) return json({error:'The scan took too long to finish.', code:'timeout'}, 504);
    if (error instanceof ScanError) return json({error:error.message, code:error.code}, error.status);
    if (error instanceof SyntaxError) return json({error:'Submit a valid website URL.', code:'invalid-request'}, 400);
    if (error instanceof TypeError) {
     console.warn('Permission Replay scan runtime failure', error.message);
     return json({error:'The scanner could not read the response. Try again shortly.', code:'scan-runtime'}, 502);
    }
    return json({error:error.message}, 422);
   } finally {
    clearTimeout(timer);
   }
  }
  const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  if (request.method !== 'GET' || !Object.hasOwn(assets,file)) return new Response('Page not found', {status:404});
  return new Response(assets[file], {headers:{
   'Content-Type': file.endsWith('.html') ? 'text/html; charset=utf-8' : 'text/javascript; charset=utf-8',
   'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'none'; form-action 'self'",
   'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'no-referrer'
  }});
 }
};
