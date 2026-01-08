
/* ===== Supabase ===== */
const u = 'https://frenqgaxsezwukljnwqe.supabase.co';
const k = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyZW5xZ2F4c2V6d3VrbGpud3FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MDU5NzUsImV4cCI6MjA4MzE4MTk3NX0.yTEWdNtl-vtr3o6mJZ1eEd8Ut2qo_pGlE1LjxybRLk8';
const sb = supabase.createClient(u, k);

let myId = localStorage.getItem('m_id'), roomCode = null, isST = false, players = [], myNotes = JSON.parse(localStorage.getItem('m_notes') || '{}'), activeTarget = null, activeChatId = null, unreadMessages = {}, syncInterval = null, lastSyncData = null, currentGameState = null;
let globalMessages = [];
let isRevealing = false;
let voteInFlight = false;
let endInFlight = false;

/* ===== (Len tikanie) Minimal AudioContext pre tick zvuk ===== */
let tickAudioCtx = null;
function ensureTickAudio() {
    if (!tickAudioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        tickAudioCtx = new Ctx();
    }
    // iOS: resume ak bolo suspendnuté
    if (tickAudioCtx.state === 'suspended') {
        tickAudioCtx.resume().catch(()=>{});
    }
}
function playTick() {
    try {
        ensureTickAudio();
        const osc = tickAudioCtx.createOscillator();
        const gain = tickAudioCtx.createGain();
        osc.type = 'square';
        osc.frequency.value = 900;
        gain.gain.value = 0.0;

        osc.connect(gain); gain.connect(tickAudioCtx.destination);
        const t = tickAudioCtx.currentTime;
        osc.start(t);
        gain.gain.setTargetAtTime(0.23, t, 0.001);
        gain.gain.setTargetAtTime(0.0001, t + 0.08, 0.01);
        osc.stop(t + 0.12);
    } catch(e) {
        // bezpečne ignoruj (napr. ak prehliadač blokne audio)
        console.warn('Tick sound failed:', e);
    }
}

/* ===== Hra – logika + timer ===== */

const ROLES_DATA = {
    DEMON: { "MIGMIGMAN": "Každú noc musí zabiť jedného hráča, ale môže aj streliť do mŕtvoly." },
    POMOCNICI: { 
        "TRÁVIČ": "Každú noc môže otráviť jedného hráča. Otrávenému hráčovi schopnosť danú noc a deň nefunguje.",
        "ŠARLOTOVÁ DÁMA": "Akonáhle bude Démon popravený tak sa ŠD stane Démonom.",
        "ŠPIÓN": "Každú noc dostane info o roli jedného vybraného hráča.",
        "MIGAL": "Ak je v hre, 1 z dedinčanov sa stáva opilcom. Migal o tom vie, ale opilec netuší, že je opitý."
    },
    PODIVINI: { 
        "OPILEC": "myslí si, že má inú rolu, než v skutočnosti má. To znamená, že jeho schopnosť nefunguje správne.",
        "ANDEL": "Ak bude Anjel popravený počas dňa, dobro okamžite prehrá.",
        "NEŠIKA": "keď zomrieš, musíš vybrať hráča; ak je zlý, dobro prehrá.",
        "ŠAŠO": "Pre všetky schopnosti Dedinčanov sa javí ako ZLO.",
        "BABIČKA": "Vie kto je jej VNUK a ma na starosti ho chrániť.(Ked je v hre babička je tam aj vnuk, no vnuk sa neberie ako Podivín)",
        "VNUK": "Ked zomrieš , zomiera aj tvoja BABIČKA (O tom, že je VNUK hráč nevie a má normálne priradenú rolu od Dedinčanov)."
    },
    DEDINCANIA: { 
        "VOJAK": "Nemôže byť zabitý Démonom v noci.",
        "DETEKTÍV": "Každú noc vyberie 2 hráčov a zistí, či je aspoň 1 zlý",
        "OCHRANCA": "Každú noc vyberie hráča na ochranu. Ak tento hráč zomrie, Ochranca zomrie miesto neho.",
        "HROBNÍK": "Ak je niekto popravený ( Nie zabitý Démonom) , následnú noc zisti ako rola bol.",
        "LOVEC": "Raz za hru počas dňa môže vystreliť na hráča, pokiaľ to bol Démon tak zomrie.",
        "VEŠTKYŇA": "Každú noc vyberie 2 hráčov a zistí, či je jeden z nich Démon.",
        "DRBNA": "Na začiatku hry dostane info o tom, že 1 z 2 hráčov je nejaká rola.",
        "HAVRAN": "Ak je HAVRAN v noci zabitý, dostane info o roli hráča, ktorého si ešte v tu noc vyberie.",
        "GEMBLÉR": "Každú noc môže vybrať jedného hráča, ak to je zlý tak to zistí, ak ale bol dobrý, GEMBLÉR zomiera.",
        "STAROSTA": "Pokiaľ je živý jeho hlas ma hodnotu za 2 ľudí, akonáhle zomrie je z neho obyčajný dedinčan ."
    }
};

const SETUP = { 5:[1,1,1,2], 6:[1,1,1,3], 7:[1,1,2,3], 8:[1,1,3,3], 9:[1,2,2,4], 10:[1,2,2,5], 11:[1,2,3,5], 12:[1,3,2,6] };
const ROLE_CATEGORIES = {
    villagers: new Set(Object.keys(ROLES_DATA.DEDINCANIA)),
    outsiders: new Set(Object.keys(ROLES_DATA.PODIVINI)),
    evil: new Set([...Object.keys(ROLES_DATA.DEMON), ...Object.keys(ROLES_DATA.POMOCNICI)])
};

function getRoleTextColor(roleName) {
    if (!roleName) return "text-gray-500";
    if (ROLE_CATEGORIES.villagers.has(roleName)) return "text-green-400";
    if (ROLE_CATEGORIES.outsiders.has(roleName)) return "text-orange-400";
    return "text-red-400";
}
function getRoleColorClass(roleName) {
    if (!roleName) return "";
    if (ROLE_CATEGORIES.villagers.has(roleName)) return "border-villager";
    if (ROLE_CATEGORIES.outsiders.has(roleName)) return "border-outsider";
    return "border-evil"; 
}

async function enterGame(asST) {
    try {
        isST = asST; 
        roomCode = document.getElementById('joinRoom').value.trim().toUpperCase();
        if(!roomCode) { alert('Prosím, zadaj kód miestnosti.'); return; }

        if (isST) { 
            myId = 'st_' + roomCode; 
            const { error } = await sb.from('game_state').upsert({ room_code: roomCode, is_night: false, timer_running: false }); 
            if (error) { console.error(error); alert('Nepodarilo sa inicializovať miestnosť. Pozri konzolu.'); return; }
        } else { 
            const n = document.getElementById('joinName').value.trim(); 
            if(!n) { alert('Prosím, zadaj svoje meno.'); return; }
            myId = 'p_' + Date.now(); 
            const { error } = await sb.from('players').insert([{ id_custom: myId, name: n, room_code: roomCode, position: Date.now() }]); 
            if (error) { console.error(error); alert('Nepodarilo sa pridať hráča. Pozri konzolu.'); return; }
        }
        localStorage.setItem('m_id', myId);
        document.getElementById('lobby').classList.add('hidden'); document.getElementById('gameRoot').classList.remove('hidden');
        await sync();
        if (!syncInterval) syncInterval = setInterval(sync, 1000);
    } catch (e) {
        console.error('enterGame fatal:', e);
        alert('Nepodarilo sa pripojiť do hry. Pozri konzolu.');
    }
}

async function sync() {
    try {
        const [playersRes, gameStateRes, msgsRes] = await Promise.all([
            sb.from('players').select('*').eq('room_code', roomCode).order('id', { ascending: true }),
            sb.from('game_state').select('*').eq('room_code', roomCode).maybeSingle(),
            sb.from('messages').select('*').eq('room_code', roomCode).order('created_at')
        ]);

        if(msgsRes.data) { globalMessages = msgsRes.data; }

        const newData = JSON.stringify({ players: playersRes.data, gameState: gameStateRes.data });
        if (newData !== lastSyncData) {
            lastSyncData = newData;

            players = playersRes.data || [];
            players.sort((a, b) => a.position - b.position);
            currentGameState = gameStateRes.data;

            const aliveCount = players.filter(p => !p.is_dead).length;
            document.getElementById('aliveCounter').innerText = `Živí: ${aliveCount} / ${players.length}`;

            if(gameStateRes.data) {
                const b = document.getElementById('curTime'), h = document.getElementById('mainHeader');
                const body = document.body;
                const isNight = !!gameStateRes.data.is_night;

                if (isNight) { 
                    b.textContent = '🌙 NOC'; 
                    b.className = 'time-badge badge-night'; 
                    h.className = 'col-span-3 flex items-center justify-between px-8 is-night'; 
                    body.classList.add('night-mode');
                } else { 
                    b.textContent = '☀️ DEŇ'; 
                    b.className = 'time-badge badge-day'; 
                    h.className = 'col-span-3 flex items-center justify-between px-8 is-day'; 
                    body.classList.remove('night-mode');
                }
            }

            // Voting logic
            if (currentGameState && currentGameState.voting_active) {
                const votingButtons = document.getElementById('votingButtons');

                if (isST && !currentGameState.votes_revealed) {
                    renderVoting(currentGameState);
                } else {
                    document.getElementById('votingModal').classList.add('hidden');
                }

                if (!isST) {
                    const alreadyVoted = !!(currentGameState.votes && currentGameState.votes[myId]);
                    const shouldShowVoteButtons = currentGameState.voting_active && !currentGameState.votes_revealed && !alreadyVoted;
                    votingButtons.classList.toggle('hidden', !shouldShowVoteButtons);
                    if (!shouldShowVoteButtons) votingButtons.innerHTML = `
                        <button id="voteYesBtn" class="vote-btn vote-yes">ÁNO</button>
                        <button id="voteNoBtn" class="vote-btn vote-no">NIE</button>`;
                } else {
                    votingButtons.innerHTML = '<button onclick="endVoting()" class="bg-red-600 hover:bg-red-700 text-white p-4 rounded-lg font-bold uppercase">Ukončiť hlasovanie</button>';
                    votingButtons.classList.toggle('hidden', !currentGameState.votes_revealed);
                }

                if (currentGameState.votes_revealed && !isRevealing) {
                    isRevealing = true;
                    startRevealAnimation();
                }
            } else {
                document.getElementById('votingModal').classList.add('hidden');
                document.getElementById('votingButtons').classList.add('hidden');
                const hand = document.getElementById('clockHand');
                if (hand) hand.remove();
                document.querySelectorAll('.vote-token').forEach(t => t.remove());
                isRevealing = false;
            }

            const me = players.find(p => p.id_custom === myId);
            if(!isST && me) {
                const roleColor = getRoleTextColor(me.role);
                document.getElementById('myInfo').innerHTML = `${me.name} | <b class="${roleColor} uppercase font-black">${me.role || 'ČAKÁ SA NA ROLU'}</b>`;
            } else if(isST) { 
                document.getElementById('stControls').classList.remove('hidden'); 
                document.getElementById('myInfo').textContent = "STORYTELLER"; 
            }

            renderTable(); 
            renderGrimoire();
        }

        // Timer render vždy
        currentGameState = gameStateRes.data;
        renderTimer();

        // UI pre nomináciu/hlasovanie
        renderNominationBanner();
        renderNominationHand();
        renderStVotingBar();

        renderChats(); 

        // ST_FORCE_HIDE_VOTE_BTNS
        if (isST) {
            const vb = document.getElementById('votingButtons');
            if (vb) vb.classList.add('hidden');
        }

        // napojenie tlačidiel ÁNO/NIE po re-rendere
        const yes = document.getElementById('voteYesBtn');
        const no  = document.getElementById('voteNoBtn');
        if (yes && !yes.dataset.bound) { yes.addEventListener('click', () => vote('yes')); yes.dataset.bound = '1'; }
        if (no  && !no.dataset.bound)  { no.addEventListener('click',  () => vote('no'));  no.dataset.bound  = '1'; }

    } catch (error) {
        console.error('Sync error:', error);
    }
}

function renderGrimoire() {
    const list = document.getElementById('roleList');
    const COLORS = { DEDINCANIA: 'text-green-400', PODIVINI: 'text-orange-400', DEMON: 'text-red-400', POMOCNICI: 'text-red-400' };
    const fragments = [];

    if (isST) {
        fragments.push('<h3 class="section-header text-[9px] font-black text-red-500 mb-2 border-b border-gray-800 uppercase text-center pb-1 tracking-widest">ST PREHĽAD</h3>');
        fragments.push('<table class="st-table mb-4"><thead><tr><th>Hráč</th><th>Rola</th></tr></thead><tbody>');

        players.forEach(p => {
            const roleColor = getRoleTextColor(p.role);
            let statuses = '';
            if(p.status_drunk) statuses += '🍺';
            if(p.status_poisoned) statuses += '🧪';
            if(p.status_protected) statuses += '🛡️';
            if(p.status_grandchild) statuses += '👶';

            fragments.push(`
                <tr>
                    <td class="text-white font-bold">${p.name} ${p.is_dead ? '💀' : ''}</td>
                    <td class="${roleColor} font-bold">${p.role || '?'} ${statuses}</td>
                </tr>
            `);
        });

        fragments.push('</tbody></table><div class="my-3 border-t border-red-900/30"></div>');
    }

    fragments.push('<h3 class="section-header text-[9px] font-black text-gray-500 mb-2 border-b border-gray-800 uppercase text-center pb-1">Grimoár</h3>');

    Object.entries(ROLES_DATA).forEach(([cat, roles]) => { 
        fragments.push(`<h4 class="${COLORS[cat]} font-black mt-4 border-b border-gray-800 uppercase pb-1.5 tracking-widest text-xs" style="font-family: 'Cinzel', serif;">${cat}</h4>`); 
        Object.entries(roles).forEach(([r, d]) => { 
            fragments.push(`<div class="mb-3 leading-relaxed"><b class="text-white font-black text-sm">${r}</b><br><span class="text-gray-300 text-xs font-semibold">${d}</span></div>`); 
        }); 
    });

    list.innerHTML = fragments.join('');
}

function renderTable() {
    const container = document.getElementById('tableCircle');
    const cw = container.offsetWidth || container.clientWidth;
    const ch = container.offsetHeight || container.clientHeight;
    if (!cw || !ch || players.length === 0) return;

    const radius = Math.min(cw, ch) / 2.8;
    const fragment = document.createDocumentFragment();

    const hasNomination = players.some(p => p.is_nominated);
    document.querySelector('.grid-layout').classList.toggle('has-nomination', hasNomination);

    players.forEach((p, i) => {
        let card = document.getElementById(`card-${p.id_custom}`);
        const isNew = !card;

        if(isNew) { 
            card = document.createElement('div'); 
            card.id = `card-${p.id_custom}`; 
            card.className = 'player-card'; 
        }

        let classes = `player-card ${p.is_dead ? 'dead' : ''}`;
        if (p.is_nominated) classes += ' nominated';
        card.className = classes;

        const angle = (i * 2 * Math.PI) / players.length;
        card.style.left = (cw/2 + radius * Math.cos(angle)) + 'px'; 
        card.style.top = (ch/2 + radius * Math.sin(angle)) + 'px';

        const roleToColor = isST ? p.role : myNotes[p.id_custom];
        const colorClass = getRoleColorClass(roleToColor);
        const label = isST ? (p.role || '?') : (p.id_custom === myId ? 'TY' : '👤');

        let statusIcon = "";
        if (isST) {
            if (p.status_drunk)     statusIcon += "🍺";
            if (p.status_poisoned)  statusIcon += "🧪";
            if (p.status_protected) statusIcon += "🛡️";
            if (p.status_grandchild)statusIcon += "👶";
        }

        card.innerHTML = `
            ${p.is_nominated ? '<div class="nomination-arrow">🔻</div>' : ''}
            ${p.has_voted ? '<div class="paprcka">🖐️</div>' : ''}
            <div class="token ${colorClass}" onclick="handleTokenClick('${p.id_custom}')">
                <span class="text-[10px] text-gray-400 font-bold uppercase">${label}</span>
                ${statusIcon ? `<div class="status-badge">${statusIcon}</div>` : ''}
                ${myNotes[p.id_custom] ? `<div class="player-note">${myNotes[p.id_custom]}</div>` : ''}
            </div>
            <div class="text-xs font-black text-white uppercase truncate px-1" style="font-family: 'Cinzel', serif; letter-spacing: 1px;">${p.name}</div>`;

        if(isNew) fragment.appendChild(card);
    });

    if(fragment.hasChildNodes()) container.appendChild(fragment);

    const hand = document.getElementById('clockHand');
    if (currentGameState && currentGameState.voting_active && !currentGameState.votes_revealed) {
        // bez ručičky počas zberu
    } else {
        if (hand) hand.remove();
    }
}

async function stAction(field) { 
    if(!activeTarget) return; 

    if(field === 'is_nominated') {
        await sb.from('game_state').update({ 
            voting_active: true, 
            nominated_player: activeTarget.id_custom, 
            votes: {},
            votes_revealed: false
        }).eq('room_code', roomCode);
        closeSt();
        return;
    }

    const newValue = !activeTarget[field]; 
    await sb.from('players').update({ [field]: newValue }).eq('id_custom', activeTarget.id_custom); 
    sync(); 
}

function handleTokenClick(tid) { 
    const p = players.find(x => x.id_custom === tid); 
    if(isST) { 
        activeTarget = p; 
        document.getElementById('targetName').innerText = p.name; 
        document.getElementById('stModal').classList.remove('hidden'); 
    } else if(tid === myId) {
        toggleVote(); 
    } else {
        openNoteModal(p); 
    }
}

async function toggleVote() { 
    const me = players.find(p => p.id_custom === myId); 
    await sb.from('players').update({ has_voted: !me.has_voted }).eq('id_custom', myId); 
}

async function vote(choice) {
    if (voteInFlight) return;
    voteInFlight = true;

    // OPTIMISTIC UI: hneď skry tlačidlá, aby hráč necítil lag
    const votingButtons = document.getElementById('votingButtons');
    if (votingButtons && !isST) votingButtons.classList.add('hidden');

    // lokálny update
    currentGameState = currentGameState || {};
    currentGameState.votes = currentGameState.votes || {};
    currentGameState.votes[myId] = choice;

    try {
        // 1 request (bez SELECT): pošli merge hlasov
        const mergedVotes = { ...(currentGameState.votes || {}), [myId]: choice };
        await sb.from('game_state').update({ votes: mergedVotes }).eq('room_code', roomCode);
        setTimeout(sync, 50);
    } catch (e) {
        console.error('vote failed:', e);
        if (votingButtons && !isST) votingButtons.classList.remove('hidden');
    } finally {
        voteInFlight = false;
    }
}

async function revealVotes() {
    await sb.from('game_state').update({ votes_revealed: true }).eq('room_code', roomCode);
    document.getElementById('votingModal').classList.add('hidden');

    setTimeout(sync, 50);
}


function startRevealAnimation() {
  document.querySelectorAll('.vote-token').forEach(t => t.remove());
  renderNominationHand();

  const allIndices = players.map((p, i) => i);
  const nominatedPlayerIndex = players.findIndex(p => p.id_custom === currentGameState.nominated_player);
  let yesCount = 0;

  const container = document.getElementById('tableCircle');
  const cw = container.offsetWidth || container.clientWidth;
  const ch = container.offsetHeight || container.clientHeight;
  const radius = Math.min(cw, ch) / 2.8;
  const angleDeg = (nominatedPlayerIndex * 360) / players.length;

  let hand = document.getElementById('nominationHand');
  if (!hand) {
    hand = document.createElement('div');
    hand.id = 'nominationHand';
    hand.style.position = 'absolute';
    hand.style.left = '50%';
    hand.style.top = '50%';
    hand.style.width = '8px';
    hand.style.height = (radius * 0.6) + 'px';
    hand.style.background = 'linear-gradient(180deg, rgba(255,230,180,1) 0%, rgba(255,0,0,1) 100%)';
    hand.style.transformOrigin = 'bottom center';
    hand.style.zIndex = '9';
    hand.style.borderRadius = '4px';
    hand.style.boxShadow = '0 0 10px rgba(255, 255, 0, 0.8)';
    container.appendChild(hand);
  }

  hand.style.transform = `translate(-50%, -100%) rotate(${angleDeg}deg)`;
  hand.style.animation = 'rotate 0.75s linear infinite';

  let tokenIndex = 0;
  const interval = setInterval(() => {
    if (tokenIndex < allIndices.length) {
      const playerIndex = allIndices[tokenIndex];
      const p = players[playerIndex];
      const vote = currentGameState.votes ? currentGameState.votes[p.id_custom] : null;

      let tokenHtml = '';
      if (vote === 'yes') {
        yesCount++;
        tokenHtml = `<div class="vote-token yes-token">${yesCount}</div>`;
      } else if (vote === 'no') {
        tokenHtml = `<div class="vote-token no-token">❌</div>`;
      } else {
        tokenHtml = `<div class="vote-token no-token">?</div>`;
      }

      const card = document.getElementById(`card-${p.id_custom}`);
      if (card) {
        card.insertAdjacentHTML('beforeend', tokenHtml);
      }

      tokenIndex++;
    } else {
      clearInterval(interval);
      isRevealing = false;
      const votingButtons = document.getElementById('votingButtons');
      if (isST) {
        votingButtons.classList.remove('hidden');
      }
    }
  }, 1000);
}


async function cancelVoting() {
    // zrušenie = ukončenie
    return endVoting();
}

async function endVoting() {
    if (endInFlight) return;
    endInFlight = true;

    // OPTIMISTIC UI: hneď ukonči hlasovanie lokálne
    if (currentGameState) {
        currentGameState.voting_active = false;
        currentGameState.nominated_player = null;
        currentGameState.votes = {};
        currentGameState.votes_revealed = false;
    }

    document.getElementById('votingModal')?.classList.add('hidden');
    document.querySelectorAll('.vote-token').forEach(t => t.remove());
    document.getElementById('clockHand')?.remove();
    document.getElementById('nominationHand')?.remove();
    document.getElementById('votingButtons')?.classList.add('hidden');
    isRevealing = false;

    try {
        await sb.from('game_state').update({
            voting_active: false,
            nominated_player: null,
            votes: {},
            votes_revealed: false
        }).eq('room_code', roomCode);
        setTimeout(sync, 50);
    } catch (e) {
        console.error('endVoting failed:', e);
    } finally {
        endInFlight = false;
    }
}


function renderVoting(gameState) {
  const modal = document.getElementById('votingModal');
  const title = document.getElementById('votingTitle');
  const cards = document.getElementById('votingCards');
  const controls = document.getElementById('votingControls');

  const nominated = players.find(p => p.id_custom === gameState.nominated_player);
  if (!nominated) return;

  const votePlayers = players.map(p => ({ ...p, isDead: !!p.is_dead }));
  const alivePlayers = votePlayers.filter(p => !p.isDead);
  const majority = Math.floor(alivePlayers.length / 2) + 1;

  title.innerText = `Hlasovanie pre ${nominated.name} — Potrebná väčšina: ${majority}`;

  const votes = gameState.votes || {};
  const fragments = votePlayers.map(p => {
    const vote = votes[p.id_custom];
    let cardClass = 'voting-card';
    let voteDisplay = '';

    if (vote === 'yes') {
      cardClass += ' voted-yes';
      voteDisplay = '✅ Áno';
    } else if (vote === 'no') {
      cardClass += ' voted-no';
      voteDisplay = '❌ Nie';
    } else {
      voteDisplay = 'Čaká sa na hlas...';
    }

    const deadMark = p.isDead ? ' 💀' : '';

    return `
      <div class="${cardClass}">
        <div class="font-bold text-lg mb-2">${p.name}${deadMark}</div>
        <div class="text-sm">${voteDisplay}</div>
      </div>
    `;
  });

  cards.innerHTML = fragments.join('');

  if (isST) {
    const allVotedAlive = alivePlayers.every(p => votes[p.id_custom]);
    controls.innerHTML = allVotedAlive
      ? '<button onclick="revealVotes()" class="bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 p-4 rounded-lg text-white font-bold uppercase shadow-lg transition">Zobraziť hlasy</button>' +
        '<button onclick="endVoting()" class="bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 p-4 rounded-lg text-white font-bold uppercase shadow-lg transition">Ukončiť hlasovanie</button>'
      : '<button onclick="cancelVoting()" class="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 p-4 rounded-lg text-white font-bold uppercase shadow-lg transition">Zrušiť hlasovanie</button>';
  } else {
    controls.innerHTML = '';
  }

  modal.classList.remove('hidden');
}


async function distributeRoles() {
    const count = players.length; if(!SETUP[count]) return alert("Potrebujete 5-12 hráčov!");
    const [dCount, pCount, subCount, villCount] = SETUP[count];
    let pool = []; 
    pool.push(...shuffle(Object.keys(ROLES_DATA.DEMON)).slice(0, dCount)); 
    pool.push(...shuffle(Object.keys(ROLES_DATA.POMOCNICI)).slice(0, pCount)); 
    pool.push(...shuffle(Object.keys(ROLES_DATA.PODIVINI).filter(r=>r!=='OPILEC'&&r!=='VNUK')).slice(0, subCount)); 
    pool.push(...shuffle(Object.keys(ROLES_DATA.DEDINCANIA)).slice(0, villCount));
    pool = shuffle(pool);

    for(let i=0; i < players.length; i++) { 
        await sb.from('players').update({ 
            role: pool[i], 
            is_dead: false, 
            has_voted: false, 
            is_nominated: false,
            status_drunk: false,
            status_poisoned: false,
            status_protected: false,
            status_grandchild: false
        }).eq('id_custom', players[i].id_custom); 
    }
    alert("Role rozdané!"); sync();
}

async function shufflePlayers() {
  if (!isST) return;

  if (!players || players.length < 2) {
    alert("Nie je koho miešať 🙂");
    return;
  }

  try {
    const shuffled = shuffle([...players]);

    // malé čísla (funguje aj keď je position INTEGER)
    const results = await Promise.all(
      shuffled.map((p, idx) =>
        sb.from('players')
          .update({ position: idx })
          .eq('id_custom', p.id_custom)
      )
    );

    const err = results.find(r => r && r.error)?.error;
    if (err) {
      console.error(err);
      alert('Nepodarilo sa zamiešať hráčov. Pozri konzolu.');
      return;
    }

    await sync();
    alert('Hráči zamiešaní! 🔀');
  } catch (e) {
    console.error('shufflePlayers fatal:', e);
    alert('Nepodarilo sa zamiešať hráčov. Pozri konzolu.');
  }
}


function openNoteModal(p) { 
    activeTarget = p; document.getElementById('noteTargetName').innerText = p.name; const l = document.getElementById('noteRoleList'); l.innerHTML = `<button onclick="setNote('')" class="bg-gradient-to-r from-red-900 to-red-800 p-3 rounded-lg uppercase col-span-2 text-white shadow-lg hover:from-red-800 hover:to-red-700 transition">Zmazať</button>`; 
    Object.entries(ROLES_DATA).forEach(([cat, roles]) => {
        let color = cat === 'DEDINCANIA' ? 'from-green-700 to-green-800 hover:from-green-600 hover:to-green-700' : (cat === 'PODIVINI') ? 'from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600' : 'from-red-700 to-red-800 hover:from-red-600 hover:to-red-700';
        Object.keys(roles).forEach(role => { l.innerHTML += `<button onclick="setNote('${role}')" class="bg-gradient-to-r ${color} p-3 rounded-lg uppercase text-white shadow-lg transition">${role}</button>`; });
    });
    document.getElementById('noteModal').classList.remove('hidden'); 
}

function setNote(role) { myNotes[activeTarget.id_custom] = role; localStorage.setItem('m_notes', JSON.stringify(myNotes)); renderTable(); closeNote(); }
function closeNote() { document.getElementById('noteModal').classList.add('hidden'); }
function closeSt() { document.getElementById('stModal').classList.add('hidden'); }

async function toggleTime() { 
    const { data: gs } = await sb.from('game_state').select('*').eq('room_code', roomCode).single(); 
    await sb.from('game_state').update({ is_night: !gs.is_night }).eq('room_code', roomCode); 
}

function renderChats() {
    const container = document.getElementById('allChats');
    const contactsContainer = document.getElementById('chatContacts');
    let targets = [];

    if(!isST) {
        contactsContainer.classList.add('hidden');
        container.classList.remove('hidden');

        targets.push({ id: 'st_' + roomCode, name: 'Storyteller' }); 
        const myIdx = players.findIndex(p => p.id_custom === myId);
        if(myIdx !== -1 && players.length > 1) {
            const l = players[(myIdx + players.length - 1) % players.length], r = players[(myIdx + 1) % players.length];
            if(l && l.id_custom !== myId) targets.push({ id: l.id_custom, name: "⬅ " + l.name }); 
            if(r && r.id_custom !== myId && r.id_custom !== l.id_custom) targets.push({ id: r.id_custom, name: "➡ " + r.name });
        }

        container.querySelectorAll('[data-chat-id]').forEach(div => { 
            if(!targets.find(t => t.id === div.getAttribute('data-chat-id'))) div.remove(); 
        });

        targets.forEach(t => {
            if(!container.querySelector(`[data-chat-id="${t.id}"]`)) {
                const div = document.createElement('div'); 
                div.setAttribute('data-chat-id', t.id);
                div.innerHTML = `<div class="section-header text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">${t.name}</div><div id="box-${t.id}" class="chat-box"></div><div class="flex gap-2 mt-2"><input id="in-${t.id}" onkeydown="if(event.key==='Enter') send('${t.id}')" class="flex-1 bg-black border-2 border-gray-800 text-xs p-3 text-white outline-none rounded-lg focus:border-red-600 transition"><button onclick="send('${t.id}')" class="bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 px-4 rounded-lg text-white font-bold shadow-lg transition">></button></div>`;
                container.appendChild(div);
            }
            updateChatContent(t.id);
        });
    } else {
        players.forEach(p => targets.push({ id: p.id_custom, name: p.name }));

        if(activeChatId) {
            contactsContainer.classList.add('hidden');
            container.classList.remove('hidden');
        } else {
            contactsContainer.classList.remove('hidden');
            container.classList.add('hidden');
        }

        targets.forEach(t => {
            const myMsgs = globalMessages.filter(m => 
                (m.sender_id === t.id && m.receiver_id === myId) || 
                (m.sender_id === myId && m.receiver_id === t.id)
            );

            const storedLen = parseInt(sessionStorage.getItem(`len_${t.id}`) || '0');
            const currentLen = myMsgs.length;

            if (currentLen > storedLen && activeChatId !== t.id) {
                 unreadMessages[t.id] = (unreadMessages[t.id] || 0) + (currentLen - storedLen);
                 sessionStorage.setItem(`len_${t.id}`, currentLen); 
            } else if (activeChatId === t.id) {
                 unreadMessages[t.id] = 0;
                 sessionStorage.setItem(`len_${t.id}`, currentLen);
            }
        });

        contactsContainer.innerHTML = '';
        targets.forEach(t => {
            const contactDiv = document.createElement('div');
            contactDiv.className = `chat-contact ${activeChatId === t.id ? 'active' : ''}`;
            contactDiv.onclick = () => openChat(t.id);

            const unreadCount = unreadMessages[t.id] || 0;
            const badge = unreadCount > 0 ? `<div class="unread-badge">${unreadCount}</div>` : '';

            contactDiv.innerHTML = `
                <div class="font-bold text-white text-[10px] uppercase" style="font-family: 'Cinzel', serif;">${t.name}</div>
                ${badge}
            `;
            contactsContainer.appendChild(contactDiv);

            if(!container.querySelector(`[data-chat-view="${t.id}"]`)) {
                const chatView = document.createElement('div');
                chatView.className = 'chat-view';
                chatView.setAttribute('data-chat-view', t.id);
                chatView.innerHTML = `
                    <div class="flex justify-between items-center border-b border-gray-800 mb-2 pb-1">
                        <div class="section-header text-xs font-bold text-white uppercase tracking-wider">${t.name}</div>
                        <button onclick="closeChat()" class="text-gray-500 hover:text-red-500 transition font-bold text-sm px-2">❌</button>
                    </div>
                    <div id="box-${t.id}" class="chat-box flex-1 mb-2" style="height: auto; max-height: 60vh;"></div>
                    <div class="flex gap-2">
                        <input id="in-${t.id}" onkeydown="if(event.key==='Enter') send('${t.id}')" class="flex-1 bg-black border-2 border-gray-800 text-xs p-2 text-white outline-none rounded-lg focus:border-red-600 transition">
                        <button onclick="send('${t.id}')" class="bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 px-3 rounded-lg text-white font-bold shadow-lg transition text-xs">></button>
                    </div>
                `;
                container.appendChild(chatView);
            }

            updateChatContent(t.id);
        });

        if(activeChatId) {
            container.querySelectorAll('.chat-view').forEach(view => {
                view.classList.toggle('active', view.getAttribute('data-chat-view') === activeChatId);
            });
        }
    }
}

function openChat(chatId) {
    activeChatId = chatId;
    unreadMessages[chatId] = 0;
    const msgs = globalMessages.filter(m => (m.sender_id === chatId && m.receiver_id === myId) || (m.sender_id === myId && m.receiver_id === chatId));
    sessionStorage.setItem(`len_${chatId}`, msgs.length);
    renderChats();
}
function closeChat() { activeChatId = null; renderChats(); }

function updateChatContent(tid) { 
    const ms = globalMessages.filter(m => 
        (m.sender_id === myId && m.receiver_id === tid) || 
        (m.sender_id === tid && m.receiver_id === myId)
    );

    const box = document.getElementById(`box-${tid}`); 
    if(box) {
        const newHTML = ms.map(m => `<div class="msg ${m.sender_id === myId ? 'msg-me' : 'msg-them'}">${m.text}</div>`).join('');
        if (box.children.length !== ms.length) {
            box.innerHTML = newHTML; 
            box.scrollTop = box.scrollHeight;
        }
    } 
}

async function send(tid) { 
    const inp = document.getElementById(`in-${tid}`); 
    if(!inp.value.trim()) return; 

    const optimisticMsg = { sender_id: myId, receiver_id: tid, text: inp.value, room_code: roomCode, created_at: new Date().toISOString() };
    globalMessages.push(optimisticMsg);
    updateChatContent(tid);

    await sb.from('messages').insert([{ sender_id: myId, receiver_id: tid, text: inp.value, room_code: roomCode }]); 
    inp.value = ''; 
    sync(); 
}

async function hardReset() { 
    if(confirm("Zmazať hru?")) { 
        await sb.from('players').delete().eq('room_code', roomCode); 
        await sb.from('messages').delete().eq('room_code', roomCode); 
        await sb.from('game_state').delete().eq('room_code', roomCode);
        location.reload(); 
    } 
}

function shuffle(a) { 
    // Fisher–Yates
    for (let i=a.length-1; i>0; i--) {
        const j = Math.floor(Math.random()*(i+1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Voting buttons – prvé napojenie (zopakuje sa v sync po rerendere)


// SPACE_HAND_TOGGLE: Zdvihnutie ruky (toggleVote) na kláves SPACE
// Neaktivuj, keď používateľ píše do input/textarea alebo má otvorený prvok s contenteditable.
document.addEventListener('keydown', (e) => {
  if (e.code !== 'Space' && e.key !== ' ') return;
  if (e.repeat) return;
  if (!roomCode || !myId || isST) return;

  const gameRoot = document.getElementById('gameRoot');
  if (gameRoot && gameRoot.classList.contains('hidden')) return;

  const ae = document.activeElement;
  const tag = ae ? ae.tagName : '';
  const isTyping = ae && (
    tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' ||
    ae.isContentEditable ||
    (ae.getAttribute && ae.getAttribute('contenteditable') === 'true')
  );
  if (isTyping) return;

  e.preventDefault();
  toggleVote();
});

document.addEventListener('DOMContentLoaded', () => {
    const yesBtn = document.getElementById('voteYesBtn');
    const noBtn = document.getElementById('voteNoBtn');
    if (yesBtn) yesBtn.addEventListener('click', () => vote('yes'));
    if (noBtn) noBtn.addEventListener('click', () => vote('no'));
});

/* ===== TIMER – shared cez game_state ===== */
let timerTickInterval = null;
let lastTickSecond = null;

document.getElementById('roundTable').addEventListener('click', async (e) => {
    const isButton = e.target.closest('button');
    if (isButton) return;
    if (!isST) return;
    openTimerModal();
});

function openTimerModal(){ document.getElementById('timerModal').classList.remove('hidden'); }
function closeTimerModal(){ document.getElementById('timerModal').classList.add('hidden'); }

async function startTimerFromModal(){
    const minutes = parseInt(document.getElementById('timerMinutes').value, 10) || 10;
    lastTickSecond = null;
    await startTimer(minutes);
    closeTimerModal();
}

async function startTimer(minutes) {
    const total = Math.max(1, Math.min(180, minutes)) * 60;
    const endIso = new Date(Date.now() + total*1000).toISOString();
    await sb.from('game_state').update({
        timer_total_seconds: total,
        timer_end: endIso,
        timer_running: true,
        timer_remaining_seconds: total
    }).eq('room_code', roomCode);
    sync();
}

async function pauseTimer() {
    if (!currentGameState || !currentGameState.timer_running) return;
    const remaining = Math.max(0, Math.floor((new Date(currentGameState.timer_end).getTime() - Date.now())/1000));
    await sb.from('game_state').update({
        timer_running: false,
        timer_remaining_seconds: remaining,
        timer_end: null
    }).eq('room_code', roomCode);
    sync();
}

async function resumeTimer() {
    if (!currentGameState) return;
    const remaining = currentGameState.timer_remaining_seconds ?? 0;
    if (remaining <= 0) return;
    const endIso = new Date(Date.now() + remaining*1000).toISOString();
    await sb.from('game_state').update({
        timer_running: true,
        timer_end: endIso
    }).eq('room_code', roomCode);
    sync();
}

async function resetTimer() {
    await sb.from('game_state').update({
        timer_running: false,
        timer_end: null,
        timer_total_seconds: null,
        timer_remaining_seconds: null
    }).eq('room_code', roomCode);
    sync();
}

function renderTimer() {
    const overlay = document.getElementById('timerOverlay');
    if (!currentGameState) { overlay.classList.add('hidden'); stopTimerTick(); return; }
    const running = !!currentGameState.timer_running;
    const total = currentGameState.timer_total_seconds || 0;
    let remaining = 0;
    if (running && currentGameState.timer_end) {
        remaining = Math.max(0, Math.floor((new Date(currentGameState.timer_end).getTime() - Date.now())/1000));
    } else {
        remaining = Math.max(0, currentGameState.timer_remaining_seconds || 0);
    }
    if (total <= 0 && remaining <= 0) {
        overlay.classList.add('hidden');
        stopTimerTick();
        return;
    }

    overlay.classList.remove('hidden');

    const pct = total > 0 ? Math.floor(((total - remaining) / total) * 100) : 0;
    overlay.querySelector('.timer-ring').style.setProperty('--pct', pct + '%');
    const mm = String(Math.floor(remaining / 60)).padStart(2,'0');
    const ss = String(remaining % 60).padStart(2,'0');
    document.getElementById('timerText').textContent = `${mm}:${ss}`;
    document.getElementById('timerMini').textContent = running ? 'Beží...' : 'Pozastavené';

    if (running) {
        startTimerTick();
        if (remaining <= 5 && remaining >= 1) {
            if (lastTickSecond !== remaining) {
                lastTickSecond = remaining;
                playTick(); // ponechané tikanie
            }
        }
        if (remaining === 0) {
            stopTimerTick();
            const rt = document.getElementById('roundTable');
            rt.classList.add('table-flash');
            setTimeout(()=>rt.classList.remove('table-flash'), 1800);
            if (isST) {
                sb.from('game_state').update({
                    timer_running: false,
                    timer_end: null,
                    timer_remaining_seconds: 0
                }).eq('room_code', roomCode);
            }
        }
    } else {
        stopTimerTick();
    }
}

function startTimerTick() { if (timerTickInterval) return; timerTickInterval = setInterval(renderTimer, 250); }
function stopTimerTick() { if (timerTickInterval) { clearInterval(timerTickInterval); timerTickInterval = null; } }

// ===== NOMINATION BANNER (mimo stola) =====

function renderNominationBanner() {
  const box = document.getElementById('nominationBanner');
  const nameEl = document.getElementById('nominationName');
  if (!box || !nameEl) return;

  if (!currentGameState || !currentGameState.voting_active || !currentGameState.nominated_player) {
    box.classList.add('hidden');
    nameEl.textContent = '—';
    return;
  }

  const nominee = players.find(p => p.id_custom === currentGameState.nominated_player);
  const aliveCount = players.filter(p => !p.is_dead).length;
  const majority = Math.floor(aliveCount / 2) + 1;

  nameEl.textContent = nominee ? `${nominee.name} · Potrebná väčšina: ${majority}` : '—';
  box.classList.remove('hidden');
}


// ===== NOMINATION HAND (SPLAŠENÉ HODINY) =====
// Beží stále až do ukončenia hlasovania (voting_active=false), aj počas revealu.
// Neprekrýva ÁNO/NIE: je pod nimi (z-index 9 vs z-10).
function renderNominationHand() {
    const container = document.getElementById('tableCircle');
    if (!container) return;

    const shouldShow = !!(currentGameState && currentGameState.voting_active && currentGameState.nominated_player);
    let hand = document.getElementById('nominationHand');

    if (!shouldShow) {
        if (hand) hand.remove();
        return;
    }

    const nominatedPlayerIndex = players.findIndex(p => p.id_custom === currentGameState.nominated_player);
    if (nominatedPlayerIndex < 0 || players.length === 0) return;

    const cw = container.offsetWidth || container.clientWidth;
    const ch = container.offsetHeight || container.clientHeight;
    const radius = Math.min(cw, ch) / 2.8;
    const angleDeg = (nominatedPlayerIndex * 360) / players.length;

    if (!hand) {
        hand = document.createElement('div');
        hand.id = 'nominationHand';
        hand.style.position = 'absolute';
        hand.style.left = '50%';
        hand.style.top = '50%';
        hand.style.width = '8px';
        hand.style.background = 'linear-gradient(180deg, rgba(255,230,180,1) 0%, rgba(255,0,0,1) 100%)';
        hand.style.transformOrigin = 'bottom center';
        hand.style.zIndex = '9';
        hand.style.borderRadius = '6px';
        hand.style.boxShadow = '0 0 14px rgba(255,255,0,0.85), 0 0 24px rgba(255,0,0,0.45)';
        hand.style.pointerEvents = 'none';
        container.appendChild(hand);
    }

    hand.style.height = (radius * 0.62) + 'px';
    hand.style.transform = `translate(-50%, -100%) rotate(${angleDeg}deg)`;
    hand.style.animation = 'rotate 0.75s linear infinite';
}

// ===== ST BAR visibility =====
function renderStVotingBar() {
    const bar = document.getElementById('stVotingBar');
    if (!bar) return;
    const show = !!(isST && currentGameState && currentGameState.voting_active);
    bar.classList.toggle('hidden', !show);
}

// Re-render kruhu pri resize
window.addEventListener('resize', () => { renderTable(); renderNominationHand(); });
