// Cloudflare Worker: принимает анкету с сайта и пересылает её в Telegram.
// Токен бота хранится только здесь, в секретах Cloudflare, и никогда не попадает на сайт.
//
// Переменные (Settings → Variables and Secrets):
//   TELEGRAM_BOT_TOKEN  — секрет: токен бота от @BotFather
//   TELEGRAM_CHAT_ID    — id чата Ольги с ботом (число)
//   ALLOWED_ORIGINS     — адреса сайта через запятую, например https://sokolovpashawork-dev.github.io

const MAX_BODY = 20000;   // байт
const MAX_TEXT = 3800;    // знаков (лимит Telegram 4096, часть уходит на заголовок)
const MIN_TEXT = 30;

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean);
    const originOk = !allowed.length || allowed.includes(origin);
    const cors = {
      'Access-Control-Allow-Origin': originOk && origin ? origin : (allowed[0] || '*'),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    };
    const reply = (status, body) =>
      new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' } });

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return reply(405, { ok: false, error: 'method' });
    if (!originOk) return reply(403, { ok: false, error: 'origin' });
    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return reply(500, { ok: false, error: 'not-configured' });

    const len = Number(request.headers.get('Content-Length') || 0);
    if (len > MAX_BODY) return reply(413, { ok: false, error: 'too-large' });

    let data;
    try { data = JSON.parse(await request.text()); } catch (e) { return reply(400, { ok: false, error: 'json' }); }
    if (!data || typeof data !== 'object') return reply(400, { ok: false, error: 'json' });

    // Поле-ловушка: человек его не видит, а спам-бот заполняет. Отвечаем «успехом», но ничего не отправляем.
    if (typeof data.website === 'string' && data.website.trim() !== '') return reply(200, { ok: true });

    const text = typeof data.text === 'string' ? data.text.trim() : '';
    if (text.length < MIN_TEXT || text.length > MAX_TEXT) return reply(400, { ok: false, error: 'text' });

    const tg = await fetch('https://api.telegram.org/bot' + env.TELEGRAM_BOT_TOKEN + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text: '🆕 Новая анкета с сайта\n\n' + text,
        disable_web_page_preview: true,
      }),
    }).catch(() => null);

    if (!tg || !tg.ok) return reply(502, { ok: false, error: 'telegram' });
    return reply(200, { ok: true });
  },
};
