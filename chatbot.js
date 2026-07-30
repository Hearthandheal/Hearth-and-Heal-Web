/**
 * Olaf - Wellness Companion Chatbot
 * Hearth & Heal Organization
 * Knowledge-backed answers (phrase + keyword scoring)
 */

const chatbotHTML = `
<div id="olaf-container">
    <div id="olaf-widget">
        <div class="olaf-chat-body">
            <div class="olaf-header">
                <div class="olaf-header-info">
                    <h3>⛄ Olaf</h3>
                    <p>Wellness Companion</p>
                </div>
                <button type="button" id="close-chat" aria-label="Close Chat">&times;</button>
            </div>
            <div id="chat-log"></div>
            <div class="chat-input-area">
                <input id="chat-input" type="text" placeholder="Ask about Hearth & Heal..." autocomplete="off" />
                <button type="button" id="send-btn" aria-label="Send Message"><i data-feather="send"></i></button>
            </div>
        </div>
    </div>
    <button type="button" id="olaf-trigger" title="Chat with Olaf">
        <img src="assets/olaf_chatbot.jpg" alt="Olaf Character">
        <span class="olaf-status" aria-hidden="true"></span>
    </button>
</div>
`;

const chatbotStyles = `
<style>
  #olaf-container {
    position: fixed;
    bottom: 30px;
    right: 30px;
    z-index: 10000;
    font-family: 'Outfit', sans-serif;
  }

  #olaf-trigger {
    width: 85px;
    height: 85px;
    background: white;
    border-radius: 50%;
    box-shadow: 0 12px 30px rgba(0,0,0,0.18);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    border: 3px solid #00E676;
    position: relative;
    padding: 0;
    overflow: visible;
  }

  #olaf-trigger img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }

  #olaf-trigger:hover {
    transform: scale(1.1) rotate(5deg);
    box-shadow: 0 15px 40px rgba(0, 230, 118, 0.25);
  }

  .olaf-status {
      position: absolute;
      bottom: 5px;
      right: 5px;
      width: 18px;
      height: 18px;
      background: #00E676;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  }

  #olaf-widget {
    display: none;
    width: 380px;
    background: white;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.25);
    overflow: hidden;
    flex-direction: column;
    margin-bottom: 25px;
    border: 1px solid rgba(0, 230, 118, 0.1);
    transform-origin: bottom right;
  }

  #olaf-widget.active {
    display: flex;
    animation: olafPop 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  }

  @keyframes olafPop {
      from { opacity: 0; transform: scale(0.8) translateY(40px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
  }

  .olaf-header {
    background: linear-gradient(135deg, #00C853, #00E676);
    color: white;
    padding: 25px 20px;
    position: relative;
    display: flex;
    align-items: center;
    border-bottom: 4px solid rgba(255,255,255,0.2);
  }

  .olaf-header-info h3 { 
      margin: 0; 
      font-size: 1.4rem; 
      font-weight: 700;
      letter-spacing: 0.5px;
  }
  .olaf-header-info p { 
      margin: 2px 0 0; 
      font-size: 0.85rem; 
      opacity: 0.95;
      font-weight: 500;
  }

  #close-chat {
    background: rgba(0,0,0,0.1);
    border: none;
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    font-size: 20px;
    cursor: pointer;
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.3s;
  }

  #close-chat:hover { background: rgba(0,0,0,0.2); }

  #chat-log {
    height: 400px;
    overflow-y: auto;
    padding: 25px;
    display: flex;
    flex-direction: column;
    gap: 15px;
    background: #fdfdfd;
  }

  .chat-msg {
    max-width: 85%;
    padding: 14px 18px;
    border-radius: 20px;
    font-size: 0.95rem;
    line-height: 1.6;
    position: relative;
    word-wrap: break-word;
    box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  }

  .msg-ai {
    align-self: flex-start;
    background: white;
    color: #444;
    border-bottom-left-radius: 5px;
    border: 1px solid #f0f0f0;
  }

  .msg-ai a { color: #00C853; font-weight: 600; }

  .msg-user {
    align-self: flex-end;
    background: #00C853;
    color: white;
    border-bottom-right-radius: 5px;
    font-weight: 500;
  }

  .typing-indicator span {
      display: inline-block;
      width: 5px;
      height: 5px;
      background: #aaa;
      border-radius: 50%;
      margin: 0 1px;
      animation: olafTyping 1.4s infinite both;
  }
  .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
  .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

  @keyframes olafTyping {
      0%, 80%, 100% { opacity: 0; transform: translateY(0); }
      40% { opacity: 1; transform: translateY(-5px); }
  }

  .chat-input-area {
    padding: 20px;
    display: flex;
    gap: 12px;
    border-top: 1px solid #f0f0f0;
    background: white;
  }

  #chat-input {
    flex: 1;
    border: 1px solid #eee;
    padding: 12px 20px;
    border-radius: 30px;
    outline: none;
    font-family: inherit;
    font-size: 0.95rem;
    background: #f9f9f9;
    transition: all 0.3s;
  }

  #chat-input:focus {
      background: white;
      border-color: #00E676;
      box-shadow: 0 0 0 3px rgba(0, 230, 118, 0.1);
  }

  #send-btn {
    background: #00C853;
    color: white;
    border: none;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
    flex-shrink: 0;
  }

  #send-btn:hover {
      background: #00E676;
      transform: scale(1.05);
      box-shadow: 0 5px 15px rgba(0, 200, 83, 0.3);
  }

  #send-btn svg { width: 22px; height: 22px; }

  @media (max-width: 480px) {
    #olaf-widget { width: 90vw; max-width: 100%; }
    #olaf-container { bottom: 20px; right: 20px; }
  }
</style>
`;

function olafLink(href, text) {
  return `<a href="${href}">${text}</a>`;
}

const OLAF_GREETINGS = [
  "Hi! I'm Olaf, Hearth & Heal's wellness companion. I like warm hugs too! 🤗",
  "Hello! Ready to talk about healing, hope, and our community? ✨",
  "Hey there! Ask me anything about Hearth & Heal — mission, services, shop, donations, or the team. ☃️"
];

/**
 * Each entry: phrases (substring, higher weight), words (token overlap), reply (HTML)
 */
const OLAF_KNOWLEDGE = [
  {
    phrases: ["what is hearth", "who is hearth", "about hearth", "tell me about hearth", "hearth and heal", "hearth & heal"],
    words: ["organization", "nonprofit", "charity", "ngo", "who are you"],
    reply: `<b>Hearth & Heal</b> is a restorative community organization grounded in faith and compassion. We create safe, inclusive spaces for people facing adversity, relational strain, or marginalization — through spiritual care, creative healing, practical support, and education. Explore our ${olafLink("mission.html", "Mission")} or ${olafLink("services.html", "Services")}. 💚`
  },
  {
    phrases: ["our vision", "your vision", "what is your vision"],
    words: ["vision"],
    reply: `Our vision: <b>“To heal the world and make it habitable for every individual.”</b> We work to correct dysfunctions that keep people, families, and societies from living with wholeness and dignity as intended. 🌍 More on ${olafLink("mission.html", "Our Mission")}.`
  },
  {
    phrases: ["our mission", "your mission", "what is your mission"],
    words: ["mission"],
    reply: `Our mission: <b>Hearth & Heal exists to provide a safe, inclusive, and restorative environment for individuals navigating personal adversity, relational dysfunction and social marginalization.</b> We offer judgement-free support, dialogue, and practical guidance rooted in scripture. 📖 See ${olafLink("mission.html", "Mission")}.`
  },
  {
    phrases: ["flawless", "wholeness", "begin again", "courage to begin"],
    words: ["quote", "motto", "slogan"],
    reply: `A line we love: <i>“We don’t chase flawless outcomes – We pursue wholeness, grace, and the courage to begin again.”</i> ✨ It's on our ${olafLink("mission.html", "Mission")} page.`
  },
  {
    phrases: ["core values", "your values", "what do you stand for", "what do you believe"],
    words: ["values", "principles", "ethos"],
    reply: `Our values include: <b>Compassion over Judgement</b>, <b>Truth Rooted in God’s Word</b>, <b>Dignity for Every Individual</b>, <b>Healing Through Community</b>, and <b>Empowerment Through Self-Help</b>. 🤝 Details on ${olafLink("mission.html", "Mission")}.`
  },
  {
    phrases: ["what services", "what do you offer", "programs", "help me", "how can you help"],
    words: ["services", "programs", "offerings", "support", "care"],
    reply: `We offer <b>Spiritual Care</b>, <b>Literature & Authorship</b>, <b>Creative Healing</b>, <b>Recovery Room</b> conversations, <b>Resource Navigation</b> (needs, legal aid, outreach), and <b>Dysfunctionality Sensitization</b> (workshops, civic education, mental health awareness). Delivery includes in-person gatherings, digital soul care, podcasts, conferences, and more. Full list: ${olafLink("services.html", "Our Services")}. 🌿`
  },
  {
    phrases: ["spiritual care", "prayer circle", "grief support"],
    words: ["spiritual", "prayer", "grief", "pastoral"],
    reply: `<b>Spiritual Care</b> includes guided reflections, prayer circles, grief support, and spiritual companionship — nourishing the soul through faith-centered presence. ⚓ More: ${olafLink("services.html", "Services")}.`
  },
  {
    phrases: ["literature and", "writing workshop", "author", "books blogs"],
    words: ["literature", "writing", "read", "book club"],
    reply: `<b>Literature & Authorship</b> covers published books and articles, spiritual essays, live readings, and writing-as-healing workshops. 📚 Our CEO is also an author — see the ${olafLink("shop.html", "Shop")} for his book.`
  },
  {
    phrases: ["creative healing", "expressive arts", "music therapy", "retreat"],
    words: ["creative", "art", "dance", "music", "bonfire", "retreats"],
    reply: `<b>Creative Healing</b> includes workshops, retreats, visual storytelling, expressive arts, bonfires, dance, and musical therapy — healing through creativity and community. 🎨 ${olafLink("services.html", "Services")}`
  },
  {
    phrases: ["recovery room", "safe space", "facilitated conversation"],
    words: ["recovery", "therapy", "confession", "unpack"],
    reply: `The <b>Recovery Room</b> offers facilitated conversations, storytelling, space to unpack hard experiences, and support around guilt and confession — judgement-free. 🛋️ ${olafLink("services.html", "Services")}`
  },
  {
    phrases: ["resource navigation", "food shelter", "legal aid", "marginalized"],
    words: ["resources", "housing", "food", "legal", "outreach"],
    reply: `<b>Resource Navigation</b> helps with basic needs (food, shelter), legal aid connections, outreach to marginalized neighbors, and community programs. 🧭 ${olafLink("services.html", "Services")}`
  },
  {
    phrases: ["sensitization", "civic education", "mental health awareness", "institutional audit"],
    words: ["awareness", "workshop", "campaign", "dysfunction"],
    reply: `<b>Dysfunctionality Sensitization</b> includes awareness workshops, social campaigns, institutional audits, civic education, and mental health awareness — so communities can function with more clarity and care. 📢 ${olafLink("services.html", "Services")}`
  },
  {
    phrases: ["modes of delivery", "how are services delivered", "in person", "digital space", "podcast"],
    words: ["delivery", "online", "virtual", "conference", "broadcast"],
    reply: `We deliver care through <b>in-person gatherings</b>, <b>digital soul care</b>, literature, creative commissions, <b>podcasts</b>, live broadcasts, conferences, and referral networks. 🎙️ See ${olafLink("services.html", "Services")}.`
  },
  {
    phrases: ["john haggee", "ceo", "founder", "chief executive", "who leads"],
    words: ["john", "ouma", "leader", "founder"],
    reply: `Our <b>Founder & CEO is Mr. John Haggee Ouma</b> — he leads strategy and growth and is the author of <b>“I Chose To Let You Down.”</b> Meet the team on ${olafLink("mission.html", "Our Mission")}. 🌟`
  },
  {
    phrases: ["faith emusugut", "secretary general"],
    words: ["secretary", "faith", "administration"],
    reply: `<b>Ms. Faith Emusugut</b> is our <b>Secretary General</b>, overseeing administration, compliance, and organizational efficiency. 📋 ${olafLink("mission.html", "Team")}`
  },
  {
    phrases: ["graham ouma", "publications editor"],
    words: ["publications", "editor", "graham"],
    reply: `<b>Mr. Graham Ouma</b> is our <b>Publications Editor</b>, shaping written content for clarity and impact. ✍️ ${olafLink("mission.html", "Team")}`
  },
  {
    phrases: ["angela elijah", "events manager"],
    words: ["events", "angela", "workshops"],
    reply: `<b>Ms. Angela Elijah</b> is our <b>Events Manager</b>, coordinating gatherings and wellness workshops. 🎉 ${olafLink("mission.html", "Team")}`
  },
  {
    phrases: ["sarah gacoki", "merchandise"],
    words: ["inventory", "sarah", "shop handler"],
    reply: `<b>Ms. Sarah Gacoki</b> is our <b>Graphic Designer</b> — creating visuals and brand materials that keep Hearth & Heal looking strong. 🎨 ${olafLink("shop.html", "Shop")}`
  },
  {
    phrases: ["emmanuel letoiya", "marketing"],
    words: ["marketing", "partnerships", "emmanuel"],
    reply: `Our reach grows through <b>External Marketing</b> led by Mr. Emmanuel K. Letoiya (partnerships). 📣 ${olafLink("mission.html", "Team")}`
  },
  {
    phrases: ["who is olaf", "your job", "mascot", "wellness companion"],
    words: ["olaf", "snowman"],
    reply: `That's me! I'm <b>Olaf</b>, the team's <b>Wellness Companion</b> — here to spread a little joy and help you find information about Hearth & Heal. Ask me about donations, services, or the shop anytime! ⛄`
  },
  {
    phrases: ["team", "staff", "meet the team", "who works"],
    words: ["employees", "people", "board"],
    reply: `Meet our leadership and team — CEO John Haggee Ouma, Secretary General Faith Emusugut, Publications Editor Graham Ouma, Events Manager Angela Elijah, Graphic Designer Sarah Gacoki, marketing leads, and more — on ${olafLink("mission.html", "Our Mission")}. 👥`
  },
  {
    phrases: ["volunteer", "get involved", "join", "partner"],
    words: ["help out", "contribute time"],
    reply: `We love people who want to get involved! Reach out via ${olafLink("contact.html", "Get Involved / Contact")}, email <b>hello@hearthandheal.org</b>, or WhatsApp <b>+254 114 433 429</b>. You can also ${olafLink("donate.html", "donate")} or ${olafLink("shop.html", "shop")} to support the mission. 🤝`
  },
  {
    phrases: ["where are you located", "address", "office", "location"],
    words: ["location", "map", "visit"],
    reply: `Our contact page lists <b>123 Wellness Way, Serenity City</b> (as shown on the site), plus email and phone. For the latest details or to coordinate a visit, use ${olafLink("contact.html", "Contact")}. 📍`
  },
  {
    phrases: ["shop", "buy merch", "merchandise", "order", "hoodie", "t-shirt", "prices"],
    words: ["store", "purchase", "apparel", "clothing", "cap", "scarf"],
    reply: `Our ${olafLink("shop.html", "Shop")} supports the mission with branded items — e.g. <b>Hoodies KSH 2,500</b>, <b>Sweatshirts KSH 2,000</b>, <b>T-Shirts KSH 750</b>, <b>Polo KSH 1,000</b>, headbands, scarves, caps (often in black & white), plus the CEO's book <b>“I Chose To Let You Down”</b> around <b>KSH 1,000</b>. Open the shop for sizes, colors, and checkout. 🛍️`
  },
  {
    phrases: ["book title", "i chose to let you down", "ceo book"],
    words: ["heartbreak", "healing book"],
    reply: `Our CEO wrote <b>“I Chose To Let You Down”</b> — a journey from heartbreak toward healing (about <b>KSH 1,000</b>). Find it in the ${olafLink("shop.html", "Shop")}. 📖`
  },
  {
    phrases: ["donate", "donation", "give money", "support financially", "fund"],
    words: ["giving", "contribute", "sponsor"],
    reply: `Thank you for caring! 💖 <b>M-Pesa (Till)</b>: <b>3028117</b> — use <b>Buy Goods and Services</b>, account name <b>Hearth&Heal</b> (see ${olafLink("donate.html", "Donate")} for steps). <b>Bank</b>: <b>Equity Bank</b>, account name <b>Hearth and Heal Org</b> (account number on the donate page). Every gift helps materials, sessions, and safe spaces for community healing.`
  },
  {
    phrases: ["mpesa", "till number", "lipa na mpesa", "mobile money"],
    words: ["safaricom", "pesapal"],
    reply: `For <b>M-Pesa</b>: Till <b>3028117</b>. Go to <b>Lipa na M-Pesa → Buy Goods and Services</b>, enter the till, amount, and PIN. Account name shown on our site: <b>Hearth&Heal</b>. 📱 Full steps: ${olafLink("donate.html", "Donate")}.`
  },
  {
    phrases: ["bank transfer", "equity bank", "account number"],
    words: ["wire", "eft", "bank deposit"],
    reply: `We accept <b>bank transfers</b> to <b>Equity Bank</b>, account name <b>Hearth and Heal Org</b>. The account number is listed on ${olafLink("donate.html", "Donate")} — please double-check there before transferring. 🏦`
  },
  {
    phrases: ["contact", "email", "whatsapp", "phone", "reach you", "social media"],
    words: ["instagram", "facebook", "tiktok", "youtube", "twitter", "message"],
    reply: `Email <b>hello@hearthandheal.org</b>, WhatsApp <b>+254 114 433 429</b>, and find us on <b>TikTok @hearth.heal.org</b>, Instagram, Facebook, X (Twitter), Pinterest, and YouTube — same handles as on our pages. ${olafLink("contact.html", "Contact")} 📱`
  },
  {
    phrases: ["login", "sign up", "account", "password", "register", "member"],
    words: ["cart", "checkout", "profile"],
    reply: `Use ${olafLink("login.html", "Login")} for your account (password or email code). New here? ${olafLink("signup.html", "Create an account")}. The ${olafLink("shop.html", "Shop")} and ${olafLink("cart.html", "Cart")} use your session for orders. 🔐`
  },
  {
    phrases: ["website", "privacy", "policy"],
    words: ["site", "cookies"],
    reply: `You're on the official Hearth & Heal site. Quick links: ${olafLink("index.html", "Home")}, ${olafLink("mission.html", "Mission")}, ${olafLink("services.html", "Services")}, ${olafLink("donate.html", "Donate")}. Privacy policy link is in the footer when available. 🌐`
  }
];

function normalizeOlafQuery(raw) {
  return String(raw || "")
    .toLowerCase()
    .replace(/[\u2019']/g, "'")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function olafTokens(norm) {
  const set = new Set();
  norm.split(" ").forEach((w) => {
    if (w.length > 1) set.add(w);
  });
  return set;
}

function scoreOlafEntry(norm, tokens, entry) {
  let score = 0;
  const phrases = entry.phrases || [];
  const words = entry.words || [];

  for (let i = 0; i < phrases.length; i++) {
    const p = phrases[i];
    if (norm.includes(p)) score += 6 + Math.min(p.length, 40) * 0.08;
  }
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (w.length > 2 && norm.includes(w)) score += 2.2;
    else if (tokens.has(w)) score += 1.4;
  }
  return score;
}

function pickOlafReply(norm, tokens) {
  let best = null;
  let bestScore = 0;

  for (let i = 0; i < OLAF_KNOWLEDGE.length; i++) {
    const s = scoreOlafEntry(norm, tokens, OLAF_KNOWLEDGE[i]);
    if (s > bestScore) {
      bestScore = s;
      best = OLAF_KNOWLEDGE[i].reply;
    }
  }

  if (bestScore >= 4) return best;
  if (bestScore >= 2.5) return best;

  /* Combine top two weak hits */
  const ranked = OLAF_KNOWLEDGE.map((e) => ({
    s: scoreOlafEntry(norm, tokens, e),
    reply: e.reply
  }))
    .filter((x) => x.s >= 1.2)
    .sort((a, b) => b.s - a.s)
    .slice(0, 2);

  if (ranked.length === 2) {
    return `${ranked[0].reply}<br><br><b>Related:</b><br>${ranked[1].reply}`;
  }
  if (ranked.length === 1) return ranked[0].reply;

  return null;
}

function olafEmotional(norm) {
  if (/\b(suicid|kill myself|end my life)\b/.test(norm)) {
    return `I'm really glad you reached out. If you're in immediate danger, please contact <b>local emergency services</b> right now. You matter — and you don't have to carry this alone. Hearth & Heal cares about you; our ${olafLink("services.html", "Recovery Room")} and ${olafLink("contact.html", "Contact")} team can help you find human support too. 💙`;
  }
  if (/\b(sad|hurt|pain|lonely|depressed|cry|hopeless|anxious|anxiety)\b/.test(norm)) {
    return `I'm sorry you're going through a hard time. ❄️ You're worth showing up for. Hearth & Heal offers judgement-free spaces — especially our ${olafLink("services.html", "Recovery Room")} and spiritual care — and you can always reach us at ${olafLink("contact.html", "Contact")} or <b>hello@hearthandheal.org</b>. 💚`;
  }
  return null;
}

function olafSmallTalk(norm) {
  if (/^(hi|hello|hey|jambo|hiya|yo|good morning|good afternoon|good evening)[\s!.]*$/i.test(norm.trim())) {
    return OLAF_GREETINGS[Math.floor(Math.random() * OLAF_GREETINGS.length)];
  }
  if (/\b(thank|thanks|asante)\b/.test(norm)) {
    return "You're so welcome! Warm hug from me to you! 🤗";
  }
  if (/\b(bye|goodbye|see you|later)\b/.test(norm)) {
    return "Bye for now! Stay warm — and remember, Hearth & Heal is cheering for you! ⛄";
  }
  if (/\b(hug|warm hug)\b/.test(norm)) {
    return `I LOVE warm hugs! 🤗 Consider yourself officially hugged. If you need human support too, we're here — ${olafLink("contact.html", "contact us")} anytime. 💚`;
  }
  return null;
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("olaf-container")) return;

  document.body.insertAdjacentHTML("beforeend", chatbotHTML);
  document.head.insertAdjacentHTML("beforeend", chatbotStyles);

  const trigger = document.getElementById("olaf-trigger");
  const widget = document.getElementById("olaf-widget");
  const closeBtn = document.getElementById("close-chat");
  const chatLog = document.getElementById("chat-log");
  const chatInput = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");

  if (window.feather) feather.replace();

  trigger.onclick = () => {
    widget.classList.add("active");
    trigger.style.display = "none";
    if (window.feather) feather.replace();

    if (chatLog.children.length === 0) {
      setTimeout(() => {
        say(OLAF_GREETINGS[Math.floor(Math.random() * OLAF_GREETINGS.length)], "ai");
        setTimeout(() => {
          say(
            `Ask about ${olafLink("mission.html", "mission")}, ${olafLink("services.html", "services")}, ${olafLink("shop.html", "shop")}, ${olafLink("donate.html", "donate")}, or ${olafLink("contact.html", "contact")}. ⛄`,
            "ai"
          );
        }, 650);
      }, 300);
    }
    chatInput.focus();
  };

  closeBtn.onclick = () => {
    widget.classList.remove("active");
    trigger.style.display = "flex";
  };

  function say(text, sender) {
    const msg = document.createElement("div");
    msg.className = `chat-msg msg-${sender}`;
    msg.innerHTML = text;
    chatLog.appendChild(msg);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function showTyping() {
    const typing = document.createElement("div");
    typing.className = "chat-msg msg-ai typing-indicator";
    typing.innerHTML = "<span></span><span></span><span></span>";
    chatLog.appendChild(typing);
    chatLog.scrollTop = chatLog.scrollHeight;
    return typing;
  }

  function processInput() {
    const text = chatInput.value.trim();
    if (!text) return;

    const norm = normalizeOlafQuery(text);
    const crisis = olafEmotional(norm);
    if (crisis) {
      say(text, "user");
      chatInput.value = "";
      say(crisis, "ai");
      return;
    }

    say(text, "user");
    chatInput.value = "";

    const typingIndicator = showTyping();
    const delay = 400 + Math.min(600, text.length * 10);

    setTimeout(() => {
      typingIndicator.remove();
      say(composeOlafReply(text), "ai");
      if (window.feather) feather.replace();
    }, delay);
  }

  sendBtn.onclick = processInput;
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") processInput();
  });

  function composeOlafReply(input) {
    const norm = normalizeOlafQuery(input);
    const tokens = olafTokens(norm);
    if (!norm) {
      return `Type a question — for example “What is your mission?” or “How do I donate?” — and I'll do my best! ${olafLink("mission.html", "Mission")} · ${olafLink("donate.html", "Donate")}`;
    }

    const crisis = olafEmotional(norm);
    if (crisis) return crisis;

    const small = olafSmallTalk(norm);
    if (small && norm.length < 48 && !/\b(mission|donate|service|shop|team|mpesa|email)\b/.test(norm)) {
      return small;
    }

    const knowledge = pickOlafReply(norm, tokens);
    if (knowledge) return knowledge;

    if (/\b(summer|snowman|carrot|reindeer|sven|frozen)\b/.test(norm)) {
      if (/\b(carrot|nose)\b/.test(norm)) return "Classic Olaf: my nose is a carrot! 🥕 But my day job is answering questions about <b>Hearth & Heal</b> — try “services” or “donate.”";
      if (/\b(summer)\b/.test(norm)) return `Summer sounds amazing! ☀️ While I daydream, you can learn how we bring warmth to real people through ${olafLink("services.html", "our services")}.`;
      return "I'm Olaf the wellness bot for Hearth & Heal — I leave the movie plot to the movies. Ask me about healing, donations, or our team! ⛄";
    }

    return `I’m not sure I have a specific answer for that yet — but I know a lot about <b>Hearth & Heal</b>! Try asking about: ${olafLink("mission.html", "mission & values")}, ${olafLink("services.html", "services")}, ${olafLink("shop.html", "shop / book")}, ${olafLink("donate.html", "donating (M-Pesa 3028117)")}, ${olafLink("mission.html", "our team")}, or ${olafLink("contact.html", "contact")}. Or rephrase with a keyword like “CEO”, “volunteer”, or “Recovery Room”. ❄️`;
  }
});
