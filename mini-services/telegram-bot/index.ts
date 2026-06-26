import { Bot, InlineKeyboard, Context } from "grammy";

// ─── Config ───────────────────────────────────────────────────────────────────
const BOT_TOKEN = process.env.BOT_TOKEN || "5822475046:AAFTqfeVk76LDdl-9NhaL-sLztfWNBnILrU";
const PORT = Number(process.env.PORT) || 3001;
const WEBAPP_URL = process.env.WEBAPP_URL || "https://t.me/OneMath_bot/app";
const API_BASE = "http://localhost:3000";
const API_TIMEOUT = 30_000;

// ─── State ────────────────────────────────────────────────────────────────────
interface HistoryEntry {
  query: string;
  type: "solve" | "calc" | "calculus" | "image";
  result: string;
  timestamp: number;
}
const userHistory = new Map<number, HistoryEntry[]>();

function addToHistory(ctx: Context, entry: HistoryEntry) {
  const userId = ctx.from!.id;
  const history = userHistory.get(userId) || [];
  history.unshift(entry);
  if (history.length > 5) history.length = 5;
  userHistory.set(userId, history);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MATH_REGEX = /[\d+\-*/^=().]|sin|cos|tan|log|ln|sqrt|abs|pi|e\b|det|lim|deriv|integ|∫|∑|∏|x|y|z/i;

function isMathText(text: string): boolean {
  return MATH_REGEX.test(text) && text.trim().length > 1;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);
  try {
    const url = `${API_BASE}${path}`;
    console.log(`[API] GET ${url}`);
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) {
      throw new Error(`API returned ${res.status}`);
    }
    const data = await res.text();
    console.log(`[API] Response length: ${data.length}`);
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

const ERROR_MSG = "⚠️ <b>Service temporarily unavailable.</b> Try again later.";

// ─── Bot Setup ────────────────────────────────────────────────────────────────
const bot = new Bot(BOT_TOKEN);

console.log(`[Bot] Starting OneMath Telegram Bot...`);
console.log(`[Bot] Web App URL: ${WEBAPP_URL}`);
console.log(`[Bot] API Base: ${API_BASE}`);

// ─── Commands ─────────────────────────────────────────────────────────────────

// /start
bot.command("start", async (ctx) => {
  console.log(`[CMD] /start from user ${ctx.from?.id}`);
  const keyboard = new InlineKeyboard()
    .url("🧮 Open OneMath Web App", WEBAPP_URL)
    .row()
    .text("📖 Help", "help");

  await ctx.reply(
    `<b>Welcome to OneMath ✨</b>\n\n` +
    `Your AI‑powered math assistant right inside Telegram.\n\n` +
    `📐 <b>Solve equations</b> — algebra, trig, and more\n` +
    `🔢 <b>Quick calculations</b> — instant results\n` +
    `📊 <b>Graph equations</b> — visualize functions\n` +
    `∫ <b>Calculus</b> — derivatives, integrals, limits\n` +
    `📖 <b>Formula reference</b> — search any topic\n` +
    `📷 <b>Photo solving</b> — send a photo of a math problem\n\n` +
    `Just type a math problem or use the commands below 👇`,
    { parse_mode: "HTML", reply_markup: keyboard },
  );
});

// /solve <equation>
bot.command("solve", async (ctx) => {
  const equation = ctx.message?.text?.replace(/^\/solve\s*/i, "").trim();
  if (!equation) {
    await ctx.reply("⚠️ Please provide an equation.\n\nUsage: <code>/solve x² + 5x + 6 = 0</code>", { parse_mode: "HTML" });
    return;
  }
  console.log(`[CMD] /solve from user ${ctx.from?.id}: ${equation}`);
  const statusMsg = await ctx.reply("🔄 Solving your equation...");
  try {
    const encoded = encodeURIComponent(equation);
    const result = await apiFetch(`/api/solve?XTransformPort=3000&equation=${encoded}`);
    addToHistory(ctx, { query: equation, type: "solve", result, timestamp: Date.now() });
    await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
    await ctx.reply(
      `<b>🧮 Solve:</b> <code>${escapeHtml(equation)}</code>\n\n` +
      `<b>Result:</b>\n${escapeHtml(result)}`,
      { parse_mode: "HTML" },
    );
  } catch (err) {
    console.error(`[ERR] /solve failed:`, err);
    await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
    await ctx.reply(ERROR_MSG, { parse_mode: "HTML" });
  }
});

// /calc <expression>
bot.command("calc", async (ctx) => {
  const expression = ctx.message?.text?.replace(/^\/calc\s*/i, "").trim();
  if (!expression) {
    await ctx.reply("⚠️ Please provide an expression.\n\nUsage: <code>/calc 2^10 + sqrt(144)</code>", { parse_mode: "HTML" });
    return;
  }
  console.log(`[CMD] /calc from user ${ctx.from?.id}: ${expression}`);
  const statusMsg = await ctx.reply("🔄 Calculating...");
  try {
    const encoded = encodeURIComponent(expression);
    const result = await apiFetch(`/api/compute?XTransformPort=3000&expression=${encoded}`);
    addToHistory(ctx, { query: expression, type: "calc", result, timestamp: Date.now() });
    await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
    await ctx.reply(
      `<b>🔢 Calc:</b> <code>${escapeHtml(expression)}</code>\n\n` +
      `<b>= ${escapeHtml(result)}</b>`,
      { parse_mode: "HTML" },
    );
  } catch (err) {
    console.error(`[ERR] /calc failed:`, err);
    await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
    await ctx.reply(ERROR_MSG, { parse_mode: "HTML" });
  }
});

// /graph <equation>
bot.command("graph", async (ctx) => {
  const equation = ctx.message?.text?.replace(/^\/graph\s*/i, "").trim();
  if (!equation) {
    await ctx.reply("⚠️ Please provide an equation.\n\nUsage: <code>/graph y = x² - 4</code>", { parse_mode: "HTML" });
    return;
  }
  console.log(`[CMD] /graph from user ${ctx.from?.id}: ${equation}`);
  addToHistory(ctx, { query: equation, type: "solve", result: "(graph)", timestamp: Date.now() });
  const keyboard = new InlineKeyboard()
    .url("📊 Open OneMath Web App", WEBAPP_URL);
  await ctx.reply(
    `📊 <b>Open Web App to view the graph of:</b>\n\n<code>${escapeHtml(equation)}</code>`,
    { parse_mode: "HTML", reply_markup: keyboard },
  );
});

// /formula <topic>
bot.command("formula", async (ctx) => {
  const topic = ctx.message?.text?.replace(/^\/formula\s*/i, "").trim();
  if (!topic) {
    await ctx.reply("⚠️ Please provide a topic.\n\nUsage: <code>/formula quadratic</code>", { parse_mode: "HTML" });
    return;
  }
  console.log(`[CMD] /formula from user ${ctx.from?.id}: ${topic}`);
  const statusMsg = await ctx.reply("🔄 Searching formulas...");
  try {
    const encoded = encodeURIComponent(topic);
    const result = await apiFetch(`/api/formulas?XTransformPort=3000&search=${encoded}`);
    await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
    await ctx.reply(
      `<b>📖 Formulas for "<code>${escapeHtml(topic)}</code>":</b>\n\n${escapeHtml(result)}`,
      { parse_mode: "HTML" },
    );
  } catch (err) {
    console.error(`[ERR] /formula failed:`, err);
    await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
    await ctx.reply(ERROR_MSG, { parse_mode: "HTML" });
  }
});

// /calculus <expression>
bot.command("calculus", async (ctx) => {
  const expression = ctx.message?.text?.replace(/^\/calculus\s*/i, "").trim();
  if (!expression) {
    await ctx.reply("⚠️ Please provide an expression.\n\nUsage: <code>/calculus derivative of x³ + 2x</code>", { parse_mode: "HTML" });
    return;
  }
  console.log(`[CMD] /calculus from user ${ctx.from?.id}: ${expression}`);
  const statusMsg = await ctx.reply("🔄 Solving calculus problem...");
  try {
    const encoded = encodeURIComponent(`Calculus: ${expression}`);
    const result = await apiFetch(`/api/solve?XTransformPort=3000&equation=${encoded}`);
    addToHistory(ctx, { query: expression, type: "calculus", result, timestamp: Date.now() });
    await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
    await ctx.reply(
      `<b>∫ Calculus:</b> <code>${escapeHtml(expression)}</code>\n\n` +
      `<b>Step-by-step solution:</b>\n${escapeHtml(result)}`,
      { parse_mode: "HTML" },
    );
  } catch (err) {
    console.error(`[ERR] /calculus failed:`, err);
    await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
    await ctx.reply(ERROR_MSG, { parse_mode: "HTML" });
  }
});

// /history
bot.command("history", async (ctx) => {
  const userId = ctx.from!.id;
  const history = userHistory.get(userId);
  console.log(`[CMD] /history from user ${userId}`);

  if (!history || history.length === 0) {
    await ctx.reply("📝 <b>No history yet.</b>\n\nSolve some problems and they'll appear here!", { parse_mode: "HTML" });
    return;
  }

  const keyboard = new InlineKeyboard();
  history.forEach((entry, i) => {
    const label = `${i + 1}. ${entry.query.length > 30 ? entry.query.slice(0, 30) + "…" : entry.query}`;
    keyboard.text(label, `history_${i}`).row();
  });
  keyboard.text("🔙 Back to menu", "back");

  const entries = history
    .map((h, i) => `<b>${i + 1}.</b> [${h.type}] <code>${escapeHtml(h.query.length > 40 ? h.query.slice(0, 40) + "…" : h.query)}</code>`)
    .join("\n");

  await ctx.reply(
    `📝 <b>Your Recent Problems:</b>\n\n${entries}\n\nTap a problem to see the full solution 👇`,
    { parse_mode: "HTML", reply_markup: keyboard },
  );
});

// /help
bot.command("help", async (ctx) => {
  console.log(`[CMD] /help from user ${ctx.from?.id}`);
  await sendHelp(ctx);
});

// ─── Callback Queries ─────────────────────────────────────────────────────────

bot.callbackQuery("help", async (ctx) => {
  await ctx.answerCallbackQuery();
  await sendHelp(ctx);
});

bot.callbackQuery("back", async (ctx) => {
  await ctx.answerCallbackQuery();
  const keyboard = new InlineKeyboard()
    .url("🧮 Open OneMath Web App", WEBAPP_URL)
    .row()
    .text("📖 Help", "help");

  await ctx.editMessageText(
    `<b>Welcome to OneMath ✨</b>\n\n` +
    `Your AI‑powered math assistant right inside Telegram.\n\n` +
    `📐 <b>Solve equations</b> — algebra, trig, and more\n` +
    `🔢 <b>Quick calculations</b> — instant results\n` +
    `📊 <b>Graph equations</b> — visualize functions\n` +
    `∫ <b>Calculus</b> — derivatives, integrals, limits\n` +
    `📖 <b>Formula reference</b> — search any topic\n` +
    `📷 <b>Photo solving</b> — send a photo of a math problem\n\n` +
    `Just type a math problem or use the commands below 👇`,
    { parse_mode: "HTML", reply_markup: keyboard },
  );
});

bot.callbackQuery(/^feature_(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const feature = ctx.match![1];
  const featureInfo: Record<string, string> = {
    solve: "🧮 <b>Equation Solver</b>\n\nSolve any math equation — algebraic, trigonometric, exponential, and more.\n\nUsage: <code>/solve x² + 5x + 6 = 0</code>",
    calc: "🔢 <b>Quick Calculator</b>\n\nGet instant results for any mathematical expression.\n\nUsage: <code>/calc 2^10 + sqrt(144)</code>",
    calculus: "∫ <b>Calculus Solver</b>\n\nStep-by-step solutions for derivatives, integrals, and limits.\n\nUsage: <code>/calculus derivative of x³ + 2x</code>",
    graph: "📊 <b>Graph Plotter</b>\n\nVisualize equations and functions interactively.\n\nUsage: <code>/graph y = sin(x)</code>",
    formula: "📖 <b>Formula Dictionary</b>\n\nSearch through hundreds of math formulas by topic.\n\nUsage: <code>/formula quadratic</code>",
    image: "📷 <b>Photo Solver</b>\n\nSend a photo of any math problem and get the solution.\n\nJust send an image to this chat!",
  };

  const info = featureInfo[feature] || "❓ Unknown feature";
  const keyboard = new InlineKeyboard()
    .url("🧮 Open in Web App", WEBAPP_URL)
    .row()
    .text("🔙 Back to Help", "help");

  await ctx.editMessageText(`${info}\n\nOr open the web app for the full experience 👇`, {
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
});

bot.callbackQuery(/^history_(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from!.id;
  const history = userHistory.get(userId);
  if (!history) return;

  const idx = parseInt(ctx.match![1], 10);
  const entry = history[idx];
  if (!entry) return;

  const keyboard = new InlineKeyboard()
    .text("📝 Show History", "help")
    .text("🔙 Back to Menu", "back");

  await ctx.editMessageText(
    `<b>📝 Problem #${idx + 1}:</b>\n` +
    `<b>Type:</b> ${entry.type}\n` +
    `<b>Query:</b> <code>${escapeHtml(entry.query)}</code>\n\n` +
    `<b>Solution:</b>\n${escapeHtml(entry.result)}`,
    { parse_mode: "HTML", reply_markup: keyboard },
  );
});

// ─── Photo Handler ────────────────────────────────────────────────────────────
bot.on(":photo", async (ctx) => {
  console.log(`[PHOTO] Received photo from user ${ctx.from?.id}`);
  const statusMsg = await ctx.reply("📷 Analyzing your image...");

  try {
    // Get the highest resolution photo
    const photos = ctx.message!.photo!;
    const photo = photos[photos.length - 1];
    const fileId = photo.file_id;

    // Get file info
    const file = await ctx.api.getFile(fileId);
    if (!file.file_path) {
      await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
      await ctx.reply("⚠️ Could not retrieve the image. Please try again.", { parse_mode: "HTML" });
      return;
    }

    // Download file
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
    console.log(`[PHOTO] Downloading from: ${fileUrl}`);
    const imageRes = await fetch(fileUrl);
    if (!imageRes.ok) throw new Error("Failed to download image");
    const arrayBuffer = await imageRes.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    console.log(`[PHOTO] Image size: ${base64.length} chars (base64)`);

    // Send to solve-image API
    const result = await apiFetch("/api/solve-image?XTransformPort=3000", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64 }),
    });

    addToHistory(ctx, { query: "(image)", type: "image", result, timestamp: Date.now() });

    await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
    await ctx.reply(
      `<b>📷 Image Solution:</b>\n\n${escapeHtml(result)}`,
      { parse_mode: "HTML" },
    );
  } catch (err) {
    console.error(`[ERR] Photo handling failed:`, err);
    await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
    await ctx.reply(ERROR_MSG, { parse_mode: "HTML" });
  }
});

// ─── Default Text Handler (auto-solve) ───────────────────────────────────────
bot.on("message:text", async (ctx) => {
  const text = ctx.message!.text!.trim();

  // Skip if it's a command (already handled above)
  if (text.startsWith("/")) return;

  console.log(`[MSG] Text from user ${ctx.from?.id}: ${text.slice(0, 80)}`);

  if (isMathText(text)) {
    const statusMsg = await ctx.reply("🔄 Solving...");
    try {
      const encoded = encodeURIComponent(text);
      const result = await apiFetch(`/api/solve?XTransformPort=3000&equation=${encoded}`);
      addToHistory(ctx, { query: text, type: "solve", result, timestamp: Date.now() });
      await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
      await ctx.reply(
        `<b>🧮 Result:</b>\n${escapeHtml(result)}`,
        { parse_mode: "HTML" },
      );
    } catch (err) {
      console.error(`[ERR] Auto-solve failed:`, err);
      await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
      await ctx.reply(ERROR_MSG, { parse_mode: "HTML" });
    }
  } else {
    await ctx.reply(
      "👋 <b>Hi!</b> Send me a math problem and I'll solve it for you!\n\n" +
      "You can also use <code>/help</code> to see all available commands.",
      { parse_mode: "HTML" },
    );
  }
});

// ─── Help Message Helper ──────────────────────────────────────────────────────
async function sendHelp(ctx: Context) {
  const keyboard = new InlineKeyboard()
    // Solving
    .text("🧮 /solve", "feature_solve")
    .text("🔢 /calc", "feature_calc")
    .row()
    // Advanced
    .text("∫ /calculus", "feature_calculus")
    .text("📊 /graph", "feature_graph")
    .row()
    // Reference
    .text("📖 /formula", "feature_formula")
    .row()
    // Other
    .text("📝 /history", "help")
    .text("🚀 /start", "back")
    .row()
    .url("🧮 Open OneMath Web App", WEBAPP_URL);

  await ctx.reply(
    `<b>📖 OneMath Help Menu</b>\n\n` +
    `<b>📐 Solving</b>\n` +
    `  /solve — Solve equations step by step\n` +
    `  /calc — Quick calculator\n\n` +
    `<b>⚡ Advanced</b>\n` +
    `  /calculus — Derivatives, integrals, limits\n` +
    `  /graph — Plot equations visually\n\n` +
    `<b>📖 Reference</b>\n` +
    `  /formula — Search formula library\n\n` +
    `<b>🤖 Other</b>\n` +
    `  /help — Show this menu\n` +
    `  /start — Welcome message\n` +
    `  /history — Recent problems\n\n` +
    `<b>💡 Tip:</b> Just type any math problem to auto-solve it!\n` +
    `<b>📷 Tip:</b> Send a photo of a math problem to solve it!`,
    { parse_mode: "HTML", reply_markup: keyboard },
  );
}

// ─── Error Handling ───────────────────────────────────────────────────────────
bot.catch((err) => {
  console.error(`[BOT ERROR] ${err.name}: ${err.message}`);
});

// ─── Start ────────────────────────────────────────────────────────────────────
async function main() {
  // Start health check HTTP server on PORT (non-blocking)
  Bun.serve({
    port: PORT,
    fetch(req) {
      const url = new URL(req.url);
      if (url.pathname === "/health") {
        return new Response(JSON.stringify({ status: "ok", service: "onemath-telegram-bot" }), {
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("OneMath Telegram Bot Service", { status: 200 });
    },
  });
  console.log(`[Server] HTTP health check on port ${PORT}`);

  // Start long polling (blocks)
  await bot.start({
    onStart: (info) => {
      console.log(`[Bot] ✅ Started as @${info.username}`);
      console.log(`[Bot] 🚀 Long polling active`);
    },
  });
}

main().catch((err) => {
  console.error("[FATAL] Failed to start bot:", err);
  process.exit(1);
});