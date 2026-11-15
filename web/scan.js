const scanForm = element('scanForm');
const scanInput = element('siteUrl');
const scanButton = element('scanButton');
const scanStatus = element('scanStatus');
const scanOutput = element('scanOutput');
const simulation = element('simulation');

const knownGuides = {
 'meet.google.com': {
  ids:['camera','microphone'], url:'https://support.google.com/meet/answer/7317473',
  evidence:'Google Meet can ask for this access when you join a video meeting.'
 },
 'www.google.com': {
  path:/^\/maps(?:\/|$)/, ids:['location'], url:'https://support.google.com/maps/answer/2839911',
  evidence:'Google Maps uses location access when you choose My location.'
 },
 'zoom.us': {
  path:/^\/test\/?$/, ids:['camera','microphone'], url:'https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0078476',
  evidence:'If you join the test meeting in the Zoom Web App, it can ask for access.'
 },
 'mail.google.com': {
  ids:['notifications'], url:'https://support.google.com/mail/answer/1075549',
  evidence:'Gmail can request desktop notifications after you sign in and enable them.'
 },
 'www.youtube.com': {
  ids:['notifications'], url:'https://support.google.com/youtube/answer/9334950',
  evidence:'YouTube offers browser notifications in your signed-in notification settings.'
 }
};

function knownFindings(page) {
 const guide = Object.hasOwn(knownGuides, page.hostname) ? knownGuides[page.hostname] : null;
 if (!guide || (guide.path && !guide.path.test(page.pathname))) return [];
 return guide.ids.map(id => ({id, source:'Official help', sourceUrl:guide.url, evidence:guide.evidence, kind:'Documented flow'}));
}

function detectedPermissions(findings) {
 const requests = new Map();
 for (const item of findings) {
  if (!['Source match','Documented flow'].includes(item.kind)) continue;
  const entry = catalog.find(candidate => candidate.id === item.id);
  if (!entry || !['Prompt', 'Picker'].includes(entry.type)) continue;
  if (!requests.has(entry)) requests.set(entry, []);
  requests.get(entry).push(item);
 }
 return requests;
}

function showFindings(result) {
 site = new URL(result.url);
 const requests = detectedPermissions([...result.findings, ...result.guides]);
 const sourceCount = [...requests.values()].filter(items => items.some(item => item.kind === 'Source match')).length;
 const documentedCount = requests.size - sourceCount;
 const counts = [];
 if (sourceCount) counts.push(sourceCount + ' from scanned source');
 if (documentedCount) counts.push(documentedCount + ' from help pages');
 scanStatus.textContent = requests.size
  ? site.hostname + ' · ' + counts.join(' · ')
  : 'No permission options found. Requests after sign-in or interaction may not appear in public source.';
 const findings = element('scanFindings');
 findings.replaceChildren(...Array.from(requests, ([entry, evidence]) => {
  const row = document.createElement('li');
  const details = document.createElement('div');
  const title = document.createElement('strong');
  title.textContent = entry.name;
  details.append(title);
  for (const item of evidence) {
   const source = document.createElement('p');
   const snippet = document.createElement('code');
   if (item.sourceUrl) {
    const link = document.createElement('a');
    link.href = item.sourceUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = item.source;
    source.append('Documented flow · ', link, ' · ', item.evidence);
   } else {
    source.textContent = 'Source match · ' + item.source + ' ';
    snippet.textContent = item.evidence;
    source.append(snippet);
   }
   details.append(source);
  }
  const simulate = document.createElement('button');
  simulate.type = 'button';
  simulate.textContent = 'Simulate ' + entry.name.toLowerCase();
  simulate.onclick = () => {
   select(entry);
   for (const button of findings.querySelectorAll('button')) button.setAttribute('aria-pressed', String(button === simulate));
   element('permissionName').focus();
  };
  row.append(details, simulate);
  return row;
 }));
 for (const [index, button] of Array.from(findings.querySelectorAll('button')).entries()) {
  button.setAttribute('aria-pressed', String(index === 0));
 }
 element('permissionHeading').hidden = !requests.size;
 findings.hidden = !requests.size;
 const {scannedScripts, failedScripts, skippedExternal, skippedLimit, truncatedScripts, truncatedHtml, truncatedFindings} = result.coverage;
 const notes = [result.scanError || scannedScripts + ' same-site script(s) scanned'];
 if (result.guideError) notes.push(result.guideError);
 if (skippedExternal) notes.push(skippedExternal + ' cross-site script(s) skipped');
 if (skippedLimit) notes.push(skippedLimit + ' same-site script(s) beyond the scan limit');
 if (failedScripts) notes.push(failedScripts + ' script(s) unavailable');
 if (truncatedScripts || truncatedHtml || truncatedFindings) notes.push('some source or findings exceeded size limits');
 if (result.findings.some(item => item.kind === 'Unresolved call')) notes.push('some media requests did not specify camera or microphone in readable code');
 element('scanCoverage').textContent = notes.join(' · ') + '.';
 element('visitSite').href = result.url;
 scanOutput.hidden = false;
 if (requests.size) {
  select(requests.keys().next().value);
  simulation.hidden = false;
 }
}

async function requestScan(input) {
 const response = await fetch('/api/scan', {
  method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(input)
 });
 const result = await response.json();
 if (!response.ok) throw Error(result.error || 'The scan could not be completed.');
 return result;
}

scanForm.onsubmit = async event => {
 event.preventDefault();
 if (scanButton.disabled) return;
 scanButton.disabled = true;
 scanOutput.hidden = true;
 simulation.hidden = true;
 stop();
 scanStatus.textContent = 'Reading public page source…';
 try {
  const rawUrl = scanInput.value.trim();
  const entered = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(rawUrl) ? rawUrl : 'https://' + rawUrl);
  if (entered.protocol !== 'https:' || entered.username || entered.password || entered.port) throw Error('Enter a public HTTPS website URL.');
  const guide = element('guideUrl').value.trim();
  const [scan, help] = await Promise.allSettled([requestScan({url:rawUrl}), guide ? requestScan({guide}) : Promise.resolve({findings:[]})]);
  const result = scan.status === 'fulfilled' ? scan.value : {url:entered.href, findings:[], coverage:{}, scanError:scan.reason.message};
  const official = knownFindings(entered);
  const guides = [...(official.length ? official : knownFindings(new URL(result.url))), ...(help.status === 'fulfilled' ? help.value.findings : [])];
  if (scan.status === 'rejected' && !guides.length && !guide) throw scan.reason;
  result.guides = guides;
  if (guide && help.status === 'rejected') result.guideError = 'Help page: ' + help.reason.message;
  else if (guide && !help.value.findings.length) result.guideError = 'No explicit browser access instructions found on the help page.';
  showFindings(result);
 } catch (error) {
  scanStatus.textContent = error instanceof SyntaxError ? 'The scan service returned an unexpected response.' : error.message;
 } finally { scanButton.disabled = false; }
};
