(() => {
  const admin = document.querySelector('#admin .adminwrap');
  if (!admin) return;
  const fixedWhatsAppUrl = 'https://wa.me/message/DJ3HTYS4GPDIC1';
  // Hidden owner shortcut: tap the brand logo five times within 2 seconds.
  let logoTaps = 0;
  let logoTapTimer;
  document.querySelector('.brand')?.addEventListener('click', event => {
    logoTaps += 1;
    clearTimeout(logoTapTimer);
    logoTapTimer = setTimeout(() => { logoTaps = 0; }, 2000);
    if (logoTaps >= 5) {
      event.preventDefault();
      event.stopPropagation();
      logoTaps = 0;
      document.querySelector('[data-page="admin"]')?.click();
    }
  }, true);
  const configured = window.LOVA_SUPABASE_URL && window.LOVA_SUPABASE_KEY &&
    !String(window.LOVA_SUPABASE_URL).includes('YOUR_') &&
    !String(window.LOVA_SUPABASE_KEY).includes('YOUR_');

  const loginBox = document.createElement('div');
  loginBox.className = 'adminbox';
  loginBox.id = 'sharedLogin';
  loginBox.innerHTML = '<h2>بەڕێوەبردنی هاوبەش</h2><p class="hint" id="sharedStatus"></p>' +
    '<div class="formgrid" id="loginFields"><input class="field" id="ownerEmail" type="email" autocomplete="username" placeholder="ئیمەیڵی بەڕێوەبەر">' +
    '<input class="field" id="ownerPassword" type="password" autocomplete="current-password" placeholder="وشەی نهێنی بەڕێوەبەر">' +
    '<button class="btn solid" id="ownerLogin">چوونەژوورەوە</button></div>' +
    '<button class="btn" id="ownerLogout" style="display:none">چوونەدەرەوە</button>';
  admin.querySelector('.pagehead').after(loginBox);
  const homeBox = document.createElement('div');
  homeBox.className = 'adminbox';
  homeBox.innerHTML = '<h2>✦ دەستکاریکردنی پەڕەی سەرەکی</h2><p class="hint">سەردێڕ، وەسف، دوگمە و وێنەی گەورەی سەرەتا بگۆڕە؛ پاشان پاشەکەوتی بکە بۆ ئەوەی لە ماڵپەڕی خەڵکیش نوێ ببێتەوە.</p><div class="formgrid"><input class="field" id="homeEyebrow" placeholder="دەقی بچوکی سەرەوە"><input class="field" id="homeTitleFirst" placeholder="ڕیزی یەکەمی سەردێڕ"><input class="field" id="homeTitleAccent" placeholder="ڕیزی دووەمی سەردێڕ"><input class="field" id="homeBadgeOne" placeholder="بەشی بچوکی سەر وێنە"><input class="field" id="homeBadgeTwo" placeholder="بەشی بچوکی خوار وێنە"><input class="field" id="homeButtonWork" placeholder="دەقی دوگمەی کارەکان"><input class="field" id="homeButtonContact" placeholder="دەقی دوگمەی پەیوەندی"><input class="field" id="homeImageUrl" placeholder="لینکی وێنەی سەرەکی (ئارەزوومەندانە)"><textarea class="field" id="homeDescription" placeholder="وەسفی پەڕەی سەرەکی"></textarea><input class="field upload-field" id="homeImageFile" type="file" accept="image/*" aria-label="هەڵبژاردنی وێنەی سەرەکی"><button class="btn solid" id="saveHome">پاشەکەوتکردنی پەڕەی سەرەکی</button></div>';
  loginBox.after(homeBox);
  admin.querySelector('.pagehead .sub').textContent = 'لە بەڕێوەبردنەوە ناوەڕۆکی پەڕەی سەرەکی، نموونەکان و پلاتفۆرمەکان بگۆڕە؛ پاشەکەوتەکان لە Supabase هەڵدەگیرێن و لە ماڵپەڕی گشتی نوێ دەبنەوە.';
  const oldLocalHint = [...admin.querySelectorAll('.hint')].find(element => element.textContent.includes('پاراستنی خۆجێییە'));
  if (oldLocalHint) oldLocalHint.textContent = 'ناوەڕۆکەکان لە Supabase پاشەکەوت دەکرێن و لە هەموو ئامێرێکەوە بەڕێوە دەبرێن.';
  document.getElementById('pUrl')?.insertAdjacentHTML('afterend', '<input class="field upload-field" id="pImageFile" type="file" accept="image/*" aria-label="بارکردنی وێنەی پلاتفۆرم">');
  const status = document.getElementById('sharedStatus');
  const loginFields = document.getElementById('loginFields');
  const loginButton = document.getElementById('ownerLogin');
  const protectedBoxes = [...admin.querySelectorAll('.adminbox')].filter(box => box !== loginBox);
  let db = null;
  let ownerSignedIn = false;
  let contentLoaded = false;

  function setAccess() {
    protectedBoxes.forEach(box => box.style.display = ownerSignedIn ? '' : 'none');
    loginFields.style.display = ownerSignedIn ? 'none' : 'grid';
    document.getElementById('ownerLogout').style.display = ownerSignedIn ? '' : 'none';
  }
  function refreshLists(cats) {
    ownerCategories = cats || { graphics: [], sites: [] };
    graphicLists = [...new Set([...graphicBase, ...(ownerCategories.graphics || [])])];
    websiteLists = [...new Set([...allowedWebsiteTypes, ...(ownerCategories.sites || [])])];
    refreshOwnerControls();
    document.getElementById('graphicListTags').innerHTML = graphicLists.map(x => `<span class="list-tag">${safe(x)}</span>`).join('');
    document.getElementById('siteListTags').innerHTML = websiteLists.map(x => `<span class="list-tag">${safe(x)}</span>`).join('');
  }
  async function loadContent() {
    const { data: row, error } = await db.from('lova_site_content').select('content').eq('id', 'main').single();
    if (error) throw error;
    const value = row.content || {};
    data.graphics = Array.isArray(value.graphics) ? value.graphics : [];
    data.sites = Array.isArray(value.sites) ? value.sites : [];
    data.platforms = Array.isArray(value.platforms) ? value.platforms : [];
    data.home = { ...homeDefaults, ...(value.home || {}) };
    const whatsApp = data.platforms.find(item => /whatsapp|واتسئاپ|واتساپ/i.test(item.name || '') || /wa\.me/i.test(item.url || ''));
    if (whatsApp) { whatsApp.name = 'WhatsApp'; whatsApp.url = fixedWhatsAppUrl; }
    else data.platforms.unshift({ name: 'WhatsApp', url: fixedWhatsAppUrl });
    refreshLists(value.categories);
    contentLoaded = true;
    fillHomeForm();
    render();
  }
  function fillHomeForm() {
    const h = data.home || homeDefaults;
    [['homeEyebrow','eyebrow'],['homeTitleFirst','titleFirst'],['homeTitleAccent','titleAccent'],['homeDescription','description'],['homeImageUrl','image'],['homeBadgeOne','badgeOne'],['homeBadgeTwo','badgeTwo'],['homeButtonWork','buttonWork'],['homeButtonContact','buttonContact']].forEach(([id,key]) => { const input = document.getElementById(id); if (input) input.value = h[key] || ''; });
  }
  async function uploadImages(items, group) {
    for (const item of items) {
      if (!item.image || !item.image.startsWith('data:image/')) continue;
      const blob = await (await fetch(item.image)).blob();
      if (blob.size > 5 * 1024 * 1024) throw new Error('وێنەکە گەورەیە؛ وێنەی بچووکتر هەڵبژێرە.');
      const ext = (blob.type.split('/')[1] || 'png').replace('jpeg', 'jpg').replace(/[^a-z0-9]/gi, '');
      const unique = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const path = `${group}/${unique}.${ext}`;
      const { error } = await db.storage.from('lova-images').upload(path, blob, { contentType: blob.type, upsert: false });
      if (error) throw error;
      item.image = db.storage.from('lova-images').getPublicUrl(path).data.publicUrl;
    }
  }
  async function publish() {
    if (!ownerSignedIn) throw new Error('owner sign in required');
    if (!contentLoaded) throw new Error('Supabase content has not loaded; refusing to overwrite shared content.');
    await uploadImages(data.graphics, 'graphics');
    await uploadImages(data.sites, 'websites');
    await uploadImages(data.platforms, 'platforms');
    if (data.home?.image?.startsWith('data:image/')) await uploadImages([data.home], 'home');
    const content = {
      graphics: data.graphics,
      sites: data.sites,
      platforms: data.platforms,
      home: data.home,
      categories: ownerCategories
    };
    const { data: updated, error } = await db.from('lova_site_content')
      .update({ content, updated_at: new Date().toISOString() }).eq('id', 'main').select('id');
    if (error) throw error;
    if (!updated?.length) throw new Error('ڕێگەی نووسینی داتا پێشتر ڕێکنەخراوە.');
    render();
    toast('گۆڕانکارییەکان بۆ هەموو سەردانکەران پاشەکەوت کران.');
  }

  // All add/edit/delete controls use this shared save path, including contact platforms.
  save = function () {
    if (!ownerSignedIn) return toast('سەرەتا بە ئیمەیڵ و وشەی نهێنی بچۆ ژوورەوە.');
    publish().catch(error => {
      console.error(error);
      const detail = String(error?.message || error?.details || error?.hint || 'هەڵەی نەناسراو').replace(/\s+/g, ' ').slice(0, 150);
      toast(`پاشەکەوت نەکرا: ${detail}`);
    });
  };
  adminRows = function (kind, id) {
    document.getElementById(id).innerHTML = data[kind].map((item, i) =>
      `<div class="adminrow"><span>${item.image ? `<img src="${safe(item.image)}" alt="" style="width:42px;height:42px;object-fit:cover;border-radius:8px;vertical-align:middle;margin-inline-end:8px">` : ''}${safe(item.title || item.name)} <span class="hint">${safe(item.category || item.url || '')}</span></span><span><button class="btn" data-edit="${kind}" data-index="${i}">دەستکاری</button> <button class="delete" data-remove="${kind}" data-index="${i}">لابردن</button></span></div>`
    ).join('') || '<span class="hint">هیچ دانەیەک نییە.</span>';
  };
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-edit]');
    if (!button || !ownerSignedIn) return;
    const kind = button.dataset.edit, item = data[kind]?.[Number(button.dataset.index)];
    if (!item) return;
    const titleKey = kind === 'platforms' ? 'name' : 'title';
    const title = prompt('ناو:', item[titleKey] || ''); if (title === null) return;
    const category = kind === 'platforms' ? item.category : prompt('جۆر/لیست:', item.category || '');
    if (kind !== 'platforms' && category === null) return;
    const link = kind === 'platforms' ? prompt('بەستەری پلاتفۆرم:', item.url || '') : item.url;
    if (kind === 'platforms' && link === null) return;
    const desc = kind === 'platforms' ? item.desc : prompt('کورتەی نموونە:', item.desc || '');
    if (kind !== 'platforms' && desc === null) return;
    const image = prompt('لینکی وێنە (بەتاڵ بهێڵە بۆ وێنەی پێشوو):', item.image || '');
    if (image === null) return;
    item[titleKey] = title.trim();
    if (kind === 'platforms') item.url = link.trim();
    else { item.category = category.trim(); item.desc = desc.trim(); }
    if (image.trim()) item.image = image.trim();
    save(kind);
  });
  document.getElementById('addPlatform').onclick = () => {
    const name = document.getElementById('pName').value.trim();
    let url = document.getElementById('pUrl').value.trim();
    if (!name || !url) return toast('ناو و لینکی پلاتفۆرم بنووسە.');
    if (/whatsapp|واتسئاپ|واتساپ/i.test(name) && /^\+?[\d\s()-]{7,}$/.test(url)) url = 'https://wa.me/' + url.replace(/\D/g, '');
    else if (!/^(https?:|mailto:|tel:)/i.test(url)) url = 'https://' + url;
    const file = document.getElementById('pImageFile').files?.[0];
    const add = image => {
      data.platforms.unshift({ name, url, image });
      save('platforms');
      document.getElementById('pName').value = document.getElementById('pUrl').value = '';
      document.getElementById('pImageFile').value = '';
    };
    if (!file) return add('');
    if (!file.type.startsWith('image/')) return toast('تەنها فایلێکی وێنە هەڵبژێرە.');
    if (file.size > 5 * 1024 * 1024) return toast('وێنەکە گەورەیە؛ وێنەی بچووکتر هەڵبژێرە.');
    const reader = new FileReader(); reader.onload = () => add(String(reader.result)); reader.onerror = () => toast('خوێندنەوەی وێنەکە سەرکەوتوو نەبوو.'); reader.readAsDataURL(file);
  };
  document.getElementById('saveHome').onclick = () => {
    const h = data.home || (data.home = { ...homeDefaults });
    h.eyebrow = document.getElementById('homeEyebrow').value.trim();
    h.titleFirst = document.getElementById('homeTitleFirst').value.trim();
    h.titleAccent = document.getElementById('homeTitleAccent').value.trim();
    h.description = document.getElementById('homeDescription').value.trim();
    h.badgeOne = document.getElementById('homeBadgeOne').value.trim();
    h.badgeTwo = document.getElementById('homeBadgeTwo').value.trim();
    h.buttonWork = document.getElementById('homeButtonWork').value.trim();
    h.buttonContact = document.getElementById('homeButtonContact').value.trim();
    h.image = document.getElementById('homeImageUrl').value.trim() || h.image || 'logo.png';
    const file = document.getElementById('homeImageFile').files?.[0];
    const finish = () => publish().then(() => { document.getElementById('homeImageFile').value = ''; fillHomeForm(); }).catch(error => toast(`پاشەکەوت نەکرا: ${String(error?.message || 'هەڵەی نەناسراو').slice(0,120)}`));
    if (!file) return finish();
    if (!file.type.startsWith('image/')) return toast('تەنها فایلێکی وێنە هەڵبژێرە.');
    if (file.size > 5 * 1024 * 1024) return toast('وێنەکە گەورەیە؛ وێنەی بچووکتر هەڵبژێرە.');
    const reader = new FileReader(); reader.onload = () => { h.image = String(reader.result); finish(); }; reader.onerror = () => toast('خوێندنەوەی وێنەکە سەرکەوتوو نەبوو.'); reader.readAsDataURL(file);
  };
  const originalRender = render;
  render = function () {
    originalRender();
    document.querySelectorAll('#contactPlatforms .platform').forEach((element, i) => {
      const platform = data.platforms[i];
      if (platform?.image) element.innerHTML = `<img src="${safe(platform.image)}" alt="" style="width:26px;height:26px;object-fit:cover;border-radius:7px;vertical-align:middle;margin-inline-end:7px">${safe(platform.name)}`;
    });
  };
  ['makeGraphicList', 'makeSiteList'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => setTimeout(() => {
      if (ownerSignedIn) publish().catch(() => toast('لیستەکە پاشەکەوت نەکرا.'));
    }, 0));
  });

  if (!configured || !window.supabase?.createClient) {
    status.textContent = 'پڕۆژەی Supabase پەیوەست نییە. بۆ چالاککردنی بەڕێوەبردن، settings لە supabase-config.js دابنێ.';
    setAccess();
    return;
  }
  db = window.supabase.createClient(window.LOVA_SUPABASE_URL, window.LOVA_SUPABASE_KEY);
  setAccess();
  loginButton.disabled = true;
  status.textContent = 'داتاکان لە Supabase بار دەکرێن...';

  loginButton.addEventListener('click', async () => {
    if (!contentLoaded) return toast('تکایە چاوەڕێ بکە داتاکان بار ببن.');
    const email = document.getElementById('ownerEmail').value.trim();
    const password = document.getElementById('ownerPassword').value;
    if (!email || !password) return toast('ئیمەیڵ و وشەی نهێنی بنووسە.');
    const button = document.getElementById('ownerLogin');
    button.disabled = true;
    const { error } = await db.auth.signInWithPassword({ email, password });
    button.disabled = false;
    if (error) return toast('ئیمەیڵ یان وشەی نهێنی دروست نییە.');
    document.getElementById('ownerPassword').value = '';
  });
  document.getElementById('ownerLogout').addEventListener('click', async () => {
    await db.auth.signOut();
  });

  (async () => {
    try {
      await loadContent();
      loginButton.disabled = false;
      const { data: { session } } = await db.auth.getSession();
      ownerSignedIn = !!session;
      setAccess();
      status.textContent = ownerSignedIn
        ? 'چوویتە ژوورەوە؛ دەتوانیت نموونە، وێنە، لیست و پلاتفۆرمەکان بەڕێوە ببەیت.'
        : 'نموونەکان بۆ هەمووان دەردەکەون. بۆ دەستکاری بە ئیمەیڵ و وشەی نهێنی بچۆ ژوورەوە.';
      db.auth.onAuthStateChange((_event, session) => {
        ownerSignedIn = !!session;
        setAccess();
        status.textContent = ownerSignedIn
          ? 'چوویتە ژوورەوە؛ گۆڕانکارییەکان بۆ هەمووان پاشەکەوت دەبن.'
          : 'چوویتە دەرەوە؛ نموونە هاوبەشەکان بۆ خەڵک دەمێننەوە.';
      });
    } catch (error) {
      console.error(error);
      loginButton.disabled = true;
      status.textContent = 'Supabase پەیوەست بوو، بەڵام داتابەیس/SQL ئامادە نییە یان URL و key هەڵەن.';
      setAccess();
    }
  })();
})();
