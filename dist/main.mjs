import { createRequire as __cr } from 'node:module';
import { fileURLToPath as __furl } from 'node:url';
import { dirname as __dir } from 'node:path';
const require = __cr(import.meta.url);
const __filename = __furl(import.meta.url);
const __dirname = __dir(__filename);
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
var __decorateParam = (index, decorator) => (target, key) => decorator(target, key, index);

// src/main.ts
import { NestFactory } from "@nestjs/core";
import { Logger as Logger7 } from "@nestjs/common";

// src/app.module.ts
import { Module as Module16 } from "@nestjs/common";
import { ConfigModule as ConfigModule2 } from "@nestjs/config";

// src/connectors/connectors.module.ts
import { Module as Module3 } from "@nestjs/common";

// src/connectors/telegram/host/telegram.module.ts
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

// src/connectors/telegram/host/telegram.channel.service.ts
import {
  Inject,
  Injectable,
  Logger
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Bot } from "grammy";
import { run } from "@grammyjs/runner";

// src/common/openclaw/plugin-sdk/string-coerce-runtime.ts
function normalizeNullableString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
function normalizeOptionalString(value) {
  return normalizeNullableString(value) ?? void 0;
}
function normalizeOptionalLowercaseString(value) {
  return normalizeOptionalString(value)?.toLowerCase();
}
function normalizeLowercaseStringOrEmpty(value) {
  return normalizeOptionalLowercaseString(value) ?? "";
}

// src/connectors/telegram/extension/src/bot/body-helpers.ts
function buildSenderName(msg) {
  const name = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(" ").trim() || msg.from?.username;
  return name || void 0;
}
function isBinaryContent(text) {
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code <= 31 && code !== 9 && code !== 10 && code !== 13) {
      return true;
    }
  }
  return false;
}
function resolveTelegramTextContent(text, caption) {
  const raw = typeof text === "string" ? text : typeof caption === "string" ? caption : "";
  return isBinaryContent(raw) ? "" : raw;
}
function getTelegramTextParts(msg) {
  const text = resolveTelegramTextContent(msg.text, msg.caption);
  const entities = text ? msg.entities ?? msg.caption_entities ?? [] : [];
  return { text, entities };
}

// src/connectors/telegram/host/telegram.channel.service.ts
var TelegramChannelService = class {
  constructor(config) {
    this.config = config;
  }
  id = "telegram";
  logger = new Logger("TelegramChannel");
  bot;
  runner;
  async onApplicationBootstrap() {
    await this.start();
  }
  async onModuleDestroy() {
    await this.stop();
  }
  async start() {
    const token = this.config.get("TELEGRAM_BOT_TOKEN");
    if (!token) {
      this.logger.warn(
        "TELEGRAM_BOT_TOKEN is not set; Telegram channel will not start. Add it to .env."
      );
      return;
    }
    const bot = new Bot(token);
    this.bot = bot;
    bot.on("message", (ctx) => this.handleMessage(ctx.msg));
    bot.catch((err) => this.logger.error(`bot error: ${String(err.error)}`));
    this.runner = run(bot);
    const me = await bot.api.getMe();
    this.logger.log(
      `Telegram bot @${me.username} started; listening for messages...`
    );
  }
  async stop() {
    if (this.runner?.isRunning()) {
      await this.runner.stop();
    }
    this.runner = void 0;
    this.bot = void 0;
  }
  handleMessage(msg) {
    const senderName = safe(() => buildSenderName(msg), "unknown");
    const { text } = safe(() => getTelegramTextParts(msg), {
      text: "",
      entities: []
    });
    this.logger.log(
      `new message | chat=${msg.chat.id} (${msg.chat.type}) | from=${senderName} (id=${msg.from?.id ?? "?"}) | text=${JSON.stringify(text ?? "")}`
    );
  }
};
TelegramChannelService = __decorateClass([
  Injectable(),
  __decorateParam(0, Inject(ConfigService))
], TelegramChannelService);
function safe(fn, fallback) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

// src/connectors/telegram/host/telegram.module.ts
var TelegramModule = class {
};
TelegramModule = __decorateClass([
  Module({
    imports: [ConfigModule],
    providers: [TelegramChannelService],
    exports: [TelegramChannelService]
  })
], TelegramModule);

// src/connectors/whatsapp/host/whatsapp.module.ts
import { Module as Module2 } from "@nestjs/common";

// src/connectors/whatsapp/host/whatsapp.channel.service.ts
import {
  Injectable as Injectable2,
  Logger as Logger2
} from "@nestjs/common";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState
} from "baileys";
import * as qrcode from "qrcode-terminal";

// src/connectors/whatsapp/extension/src/inbound/extract.ts
import { extractMessageContent, getContentType, normalizeMessageContent } from "baileys";

// src/common/openclaw/plugin-sdk/__stub.ts
function makeStub(label) {
  const target = function kittyStub() {
    return stub;
  };
  Object.defineProperty(target, "name", { value: label, configurable: true });
  const stub = new Proxy(target, {
    get(_t, prop) {
      if (prop === "then") return void 0;
      if (prop === "__kittyStub") return true;
      if (prop === Symbol.toPrimitive) return () => void 0;
      if (typeof prop === "symbol") return void 0;
      if (prop === "name") return label;
      return stub;
    },
    apply() {
      return stub;
    },
    construct() {
      return stub;
    }
  });
  return stub;
}

// src/common/openclaw/plugin-sdk/channel-inbound.ts
var BuildChannelInboundEventContextAsyncParams = makeStub("openclaw/plugin-sdk/channel-inbound#BuildChannelInboundEventContextAsyncParams");
var BuildMentionRegexesOptions = makeStub("openclaw/plugin-sdk/channel-inbound#BuildMentionRegexesOptions");
var BuiltChannelInboundEventContext = makeStub("openclaw/plugin-sdk/channel-inbound#BuiltChannelInboundEventContext");
var CommandTurnContext = makeStub("openclaw/plugin-sdk/channel-inbound#CommandTurnContext");
var EnvelopeFormatOptions = makeStub("openclaw/plugin-sdk/channel-inbound#EnvelopeFormatOptions");
var NormalizedLocation = makeStub("openclaw/plugin-sdk/channel-inbound#NormalizedLocation");
var buildChannelInboundEventContext = makeStub("openclaw/plugin-sdk/channel-inbound#buildChannelInboundEventContext");
var buildMentionRegexes = makeStub("openclaw/plugin-sdk/channel-inbound#buildMentionRegexes");
var classifyChannelInboundEvent = makeStub("openclaw/plugin-sdk/channel-inbound#classifyChannelInboundEvent");
var filterChannelInboundQuoteContext = makeStub("openclaw/plugin-sdk/channel-inbound#filterChannelInboundQuoteContext");
var formatInboundEnvelope = makeStub("openclaw/plugin-sdk/channel-inbound#formatInboundEnvelope");
var formatLocationText = makeStub("openclaw/plugin-sdk/channel-inbound#formatLocationText");
var hasVisibleInboundReplyDispatch = makeStub("openclaw/plugin-sdk/channel-inbound#hasVisibleInboundReplyDispatch");
var implicitMentionKindWhen = makeStub("openclaw/plugin-sdk/channel-inbound#implicitMentionKindWhen");
var isExplicitCommandTurn = makeStub("openclaw/plugin-sdk/channel-inbound#isExplicitCommandTurn");
var logInboundDrop = makeStub("openclaw/plugin-sdk/channel-inbound#logInboundDrop");
var matchesMentionWithExplicit = makeStub("openclaw/plugin-sdk/channel-inbound#matchesMentionWithExplicit");
var resolveEnvelopeFormatOptions = makeStub("openclaw/plugin-sdk/channel-inbound#resolveEnvelopeFormatOptions");
var resolveInboundMentionDecision = makeStub("openclaw/plugin-sdk/channel-inbound#resolveInboundMentionDecision");
var resolveInboundSessionEnvelopeContext = makeStub("openclaw/plugin-sdk/channel-inbound#resolveInboundSessionEnvelopeContext");
var resolveUnmentionedGroupInboundPolicy = makeStub("openclaw/plugin-sdk/channel-inbound#resolveUnmentionedGroupInboundPolicy");
var runChannelInboundEvent = makeStub("openclaw/plugin-sdk/channel-inbound#runChannelInboundEvent");
var shouldDebounceTextInbound = makeStub("openclaw/plugin-sdk/channel-inbound#shouldDebounceTextInbound");
var toInboundMediaFacts = makeStub("openclaw/plugin-sdk/channel-inbound#toInboundMediaFacts");
var toLocationContext = makeStub("openclaw/plugin-sdk/channel-inbound#toLocationContext");

// src/common/openclaw/plugin-sdk/runtime-env.ts
var BackoffPolicy = makeStub("openclaw/plugin-sdk/runtime-env#BackoffPolicy");
var RuntimeEnv = makeStub("openclaw/plugin-sdk/runtime-env#RuntimeEnv");
var computeBackoff = makeStub("openclaw/plugin-sdk/runtime-env#computeBackoff");
var createNonExitingRuntime = makeStub("openclaw/plugin-sdk/runtime-env#createNonExitingRuntime");
var createSubsystemLogger = makeStub("openclaw/plugin-sdk/runtime-env#createSubsystemLogger");
var danger = makeStub("openclaw/plugin-sdk/runtime-env#danger");
var defaultRuntime = makeStub("openclaw/plugin-sdk/runtime-env#defaultRuntime");
var formatDurationPrecise = makeStub("openclaw/plugin-sdk/runtime-env#formatDurationPrecise");
var getChildLogger = makeStub("openclaw/plugin-sdk/runtime-env#getChildLogger");
var info = makeStub("openclaw/plugin-sdk/runtime-env#info");
var isTruthyEnvValue = makeStub("openclaw/plugin-sdk/runtime-env#isTruthyEnvValue");
var isWSL2Sync = makeStub("openclaw/plugin-sdk/runtime-env#isWSL2Sync");
var logVerbose = makeStub("openclaw/plugin-sdk/runtime-env#logVerbose");
var registerUncaughtExceptionHandler = makeStub("openclaw/plugin-sdk/runtime-env#registerUncaughtExceptionHandler");
var registerUnhandledRejectionHandler = makeStub("openclaw/plugin-sdk/runtime-env#registerUnhandledRejectionHandler");
var retryAsync = makeStub("openclaw/plugin-sdk/runtime-env#retryAsync");
var shouldLogVerbose = makeStub("openclaw/plugin-sdk/runtime-env#shouldLogVerbose");
var sleepWithAbort = makeStub("openclaw/plugin-sdk/runtime-env#sleepWithAbort");
var success = makeStub("openclaw/plugin-sdk/runtime-env#success");
var toPinoLikeLogger = makeStub("openclaw/plugin-sdk/runtime-env#toPinoLikeLogger");
var waitForAbortSignal = makeStub("openclaw/plugin-sdk/runtime-env#waitForAbortSignal");
var warn = makeStub("openclaw/plugin-sdk/runtime-env#warn");

// src/common/openclaw/plugin-sdk/text-chunking.ts
var FILE_REF_EXTENSIONS_WITH_TLD = makeStub("openclaw/plugin-sdk/text-chunking#FILE_REF_EXTENSIONS_WITH_TLD");
var MarkdownIR = makeStub("openclaw/plugin-sdk/text-chunking#MarkdownIR");
var MarkdownLinkSpan = makeStub("openclaw/plugin-sdk/text-chunking#MarkdownLinkSpan");
var convertMarkdownTables = makeStub("openclaw/plugin-sdk/text-chunking#convertMarkdownTables");
var findCodeRegions = makeStub("openclaw/plugin-sdk/text-chunking#findCodeRegions");
var isAutoLinkedFileRef = makeStub("openclaw/plugin-sdk/text-chunking#isAutoLinkedFileRef");
var isInsideCode = makeStub("openclaw/plugin-sdk/text-chunking#isInsideCode");
var markdownToIR = makeStub("openclaw/plugin-sdk/text-chunking#markdownToIR");
var renderMarkdownIRChunksWithinLimit = makeStub("openclaw/plugin-sdk/text-chunking#renderMarkdownIRChunksWithinLimit");
var renderMarkdownWithMarkers = makeStub("openclaw/plugin-sdk/text-chunking#renderMarkdownWithMarkers");
var sanitizeAssistantVisibleText = makeStub("openclaw/plugin-sdk/text-chunking#sanitizeAssistantVisibleText");
var sanitizeAssistantVisibleTextWithProfile = makeStub("openclaw/plugin-sdk/text-chunking#sanitizeAssistantVisibleTextWithProfile");
var stripReasoningTagsFromText = makeStub("openclaw/plugin-sdk/text-chunking#stripReasoningTagsFromText");
var stripToolCallXmlTags = makeStub("openclaw/plugin-sdk/text-chunking#stripToolCallXmlTags");

// src/common/openclaw/plugin-sdk/text-utility-runtime.ts
var CONFIG_DIR = makeStub("openclaw/plugin-sdk/text-utility-runtime#CONFIG_DIR");
var clamp = makeStub("openclaw/plugin-sdk/text-utility-runtime#clamp");
var ensureDir = makeStub("openclaw/plugin-sdk/text-utility-runtime#ensureDir");
var escapeRegExp = makeStub("openclaw/plugin-sdk/text-utility-runtime#escapeRegExp");
var fetchWithTimeout = makeStub("openclaw/plugin-sdk/text-utility-runtime#fetchWithTimeout");
var normalizeE164 = makeStub("openclaw/plugin-sdk/text-utility-runtime#normalizeE164");
var resolveUserPath = makeStub("openclaw/plugin-sdk/text-utility-runtime#resolveUserPath");
var sleep = makeStub("openclaw/plugin-sdk/text-utility-runtime#sleep");

// src/common/openclaw/plugin-sdk/account-resolution.ts
var normalizeE1642 = makeStub("openclaw/plugin-sdk/account-resolution#normalizeE164");
var resolveUserPath2 = makeStub("openclaw/plugin-sdk/account-resolution#resolveUserPath");

// src/connectors/whatsapp/extension/src/vcard.ts
var ALLOWED_VCARD_KEYS = /* @__PURE__ */ new Set(["FN", "N", "TEL"]);
function parseVcard(vcard) {
  if (!vcard) {
    return { phones: [] };
  }
  const lines = vcard.split(/\r?\n/);
  let nameFromN;
  let nameFromFn;
  const phones = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) {
      continue;
    }
    const key = line.slice(0, colonIndex).toUpperCase();
    const rawValue = line.slice(colonIndex + 1).trim();
    if (!rawValue) {
      continue;
    }
    const baseKey = normalizeVcardKey(key);
    if (!baseKey || !ALLOWED_VCARD_KEYS.has(baseKey)) {
      continue;
    }
    const value = cleanVcardValue(rawValue);
    if (!value) {
      continue;
    }
    if (baseKey === "FN" && !nameFromFn) {
      nameFromFn = normalizeVcardName(value);
      continue;
    }
    if (baseKey === "N" && !nameFromN) {
      nameFromN = normalizeVcardName(value);
      continue;
    }
    if (baseKey === "TEL") {
      const phone = normalizeVcardPhone(value);
      if (phone) {
        phones.push(phone);
      }
    }
  }
  return { name: nameFromFn ?? nameFromN, phones };
}
function normalizeVcardKey(key) {
  const [primary] = key.split(";");
  if (!primary) {
    return void 0;
  }
  const segments = primary.split(".");
  return segments[segments.length - 1] || void 0;
}
function cleanVcardValue(value) {
  return value.replace(/\\n/gi, " ").replace(/\\,/g, ",").replace(/\\;/g, ";").trim();
}
function normalizeVcardName(value) {
  return value.replace(/;/g, " ").replace(/\s+/g, " ").trim();
}
function normalizeVcardPhone(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (normalizeLowercaseStringOrEmpty(trimmed).startsWith("tel:")) {
    return trimmed.slice(4).trim();
  }
  return trimmed;
}

// src/connectors/whatsapp/extension/src/inbound/extract.ts
var MESSAGE_WRAPPER_KEYS = [
  "botInvokeMessage",
  "ephemeralMessage",
  "viewOnceMessage",
  "viewOnceMessageV2",
  "viewOnceMessageV2Extension",
  "documentWithCaptionMessage",
  "groupMentionedMessage"
];
var MESSAGE_CONTENT_KEYS = [
  "conversation",
  "extendedTextMessage",
  "imageMessage",
  "videoMessage",
  "audioMessage",
  "documentMessage",
  "stickerMessage",
  "locationMessage",
  "liveLocationMessage",
  "contactMessage",
  "contactsArrayMessage",
  "buttonsResponseMessage",
  "listResponseMessage",
  "templateButtonReplyMessage",
  "interactiveResponseMessage",
  "buttonsMessage",
  "listMessage"
];
function fallbackNormalizeMessageContent(message) {
  let current = message;
  while (current && typeof current === "object") {
    let unwrapped = false;
    for (const key of MESSAGE_WRAPPER_KEYS) {
      const candidate = current[key];
      if (candidate && typeof candidate === "object" && "message" in candidate && candidate.message) {
        current = candidate.message;
        unwrapped = true;
        break;
      }
    }
    if (!unwrapped) {
      break;
    }
  }
  return current;
}
function normalizeMessage(message) {
  if (typeof normalizeMessageContent === "function") {
    return normalizeMessageContent(message);
  }
  return fallbackNormalizeMessageContent(message);
}
function fallbackGetContentType(message) {
  const normalized = fallbackNormalizeMessageContent(message);
  if (!normalized || typeof normalized !== "object") {
    return void 0;
  }
  for (const key of MESSAGE_CONTENT_KEYS) {
    if (normalized[key] != null) {
      return key;
    }
  }
  return void 0;
}
function getMessageContentType(message) {
  if (typeof getContentType === "function") {
    return getContentType(message);
  }
  return fallbackGetContentType(message);
}
function extractMessage(message) {
  if (typeof extractMessageContent === "function") {
    return extractMessageContent(message);
  }
  const normalized = fallbackNormalizeMessageContent(message);
  const contentType = fallbackGetContentType(normalized);
  if (!normalized || !contentType || contentType === "conversation") {
    return normalized;
  }
  const candidate = normalized[contentType];
  return candidate && typeof candidate === "object" ? candidate : normalized;
}
function getFutureProofInnerMessage(message) {
  const contentType = getMessageContentType(message);
  const candidate = contentType ? message[contentType] : void 0;
  if (candidate && typeof candidate === "object" && "message" in candidate && candidate.message && typeof candidate.message === "object") {
    const inner = normalizeMessage(candidate.message);
    if (inner) {
      const innerType = getMessageContentType(inner);
      if (innerType && innerType !== contentType) {
        return inner;
      }
    }
  }
  return void 0;
}
function buildMessageChain(message) {
  const chain = [];
  let current = normalizeMessage(message);
  while (current && chain.length < 4) {
    chain.push(current);
    current = getFutureProofInnerMessage(current);
  }
  return chain;
}
function unwrapMessage(message) {
  const chain = buildMessageChain(message);
  return chain.at(-1);
}
function extractText(rawMessage) {
  const message = unwrapMessage(rawMessage);
  if (!message) {
    return void 0;
  }
  const extracted = extractMessage(message);
  const candidates = [message, extracted && extracted !== message ? extracted : void 0];
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    if (typeof candidate.conversation === "string" && candidate.conversation.trim()) {
      return candidate.conversation.trim();
    }
    const extended = candidate.extendedTextMessage?.text;
    if (extended?.trim()) {
      return extended.trim();
    }
    const caption = candidate.imageMessage?.caption ?? candidate.videoMessage?.caption ?? candidate.documentMessage?.caption;
    if (caption?.trim()) {
      return caption.trim();
    }
  }
  const contactPlaceholder = extractContactPlaceholder(message) ?? (extracted && extracted !== message ? extractContactPlaceholder(extracted) : void 0);
  if (contactPlaceholder) {
    return contactPlaceholder;
  }
  return void 0;
}
function extractContactPlaceholder(rawMessage) {
  const contactContext = extractContactContext(rawMessage);
  if (!contactContext) {
    return void 0;
  }
  if (contactContext.kind === "contact") {
    return "<contact>";
  }
  const suffix = contactContext.total === 1 ? "contact" : "contacts";
  return `<contacts: ${contactContext.total} ${suffix}>`;
}
function extractContactContext(rawMessage) {
  const message = unwrapMessage(rawMessage);
  if (!message) {
    return void 0;
  }
  const contact = message.contactMessage ?? void 0;
  if (contact) {
    const { name, phones } = describeContact({
      displayName: contact.displayName,
      vcard: contact.vcard
    });
    return {
      kind: "contact",
      total: 1,
      contacts: [{ name, phones }]
    };
  }
  const contactsArray = message.contactsArrayMessage?.contacts ?? void 0;
  if (!contactsArray || contactsArray.length === 0) {
    return void 0;
  }
  return {
    kind: "contacts",
    total: contactsArray.length,
    contacts: contactsArray.map(
      (entry) => describeContact({ displayName: entry.displayName, vcard: entry.vcard })
    )
  };
}
function describeContact(input) {
  const displayName = (input.displayName ?? "").trim();
  const parsed = parseVcard(input.vcard ?? void 0);
  const name = displayName || parsed.name;
  return { name, phones: parsed.phones };
}

// src/connectors/whatsapp/host/whatsapp.channel.service.ts
var AUTH_DIR = ".wa-auth";
var WhatsappChannelService = class {
  id = "whatsapp";
  logger = new Logger2("WhatsappChannel");
  sock;
  stopping = false;
  async onApplicationBootstrap() {
    await this.start();
  }
  async onModuleDestroy() {
    await this.stop();
  }
  async start() {
    this.stopping = false;
    await this.connect();
  }
  async stop() {
    this.stopping = true;
    try {
      this.sock?.end(void 0);
    } catch {
    }
    this.sock = void 0;
  }
  async connect() {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const silentLogger = {
      level: "silent",
      child: () => silentLogger,
      trace() {
      },
      debug() {
      },
      info() {
      },
      warn() {
      },
      error() {
      },
      fatal() {
      }
    };
    const sock = makeWASocket({
      auth: state,
      logger: silentLogger,
      markOnlineOnConnect: false,
      browser: ["kitty-agents", "Chrome", "1.0.0"]
    });
    this.sock = sock;
    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) {
        this.logger.log("Scan this QR in WhatsApp > Linked Devices:");
        qrcode.generate(qr, { small: true });
      }
      if (connection === "open") {
        this.logger.log("WhatsApp connected; listening for messages...");
      }
      if (connection === "close") {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;
        if (loggedOut) {
          this.logger.warn(
            `Logged out. Delete the ${AUTH_DIR}/ folder and restart to re-pair.`
          );
        } else if (!this.stopping) {
          this.logger.warn("Connection closed; reconnecting...");
          void this.connect();
        }
      }
    });
    sock.ev.on("messages.upsert", ({ messages, type }) => {
      if (type !== "notify") return;
      for (const m of messages) {
        if (!m.message || m.key.fromMe) continue;
        this.handleMessage(m);
      }
    });
  }
  handleMessage(m) {
    const chatId = m.key.remoteJid ?? "unknown";
    const isGroup = chatId.endsWith("@g.us");
    const senderName = m.pushName ?? "unknown";
    const senderId = (isGroup ? m.key.participant : m.key.remoteJid) ?? "?";
    const text = safe2(() => extractText(m.message), void 0);
    this.logger.log(
      `new message | chat=${chatId}${isGroup ? " (group)" : ""} | from=${senderName} (id=${senderId}) | text=${JSON.stringify(text ?? "")}`
    );
  }
};
WhatsappChannelService = __decorateClass([
  Injectable2()
], WhatsappChannelService);
function safe2(fn, fallback) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

// src/connectors/whatsapp/host/whatsapp.module.ts
var WhatsappModule = class {
};
WhatsappModule = __decorateClass([
  Module2({
    providers: [WhatsappChannelService],
    exports: [WhatsappChannelService]
  })
], WhatsappModule);

// src/connectors/connectors.module.ts
var ConnectorsModule = class {
};
ConnectorsModule = __decorateClass([
  Module3({
    imports: [TelegramModule, WhatsappModule]
  })
], ConnectorsModule);

// src/core/core.module.ts
import { Module as Module15 } from "@nestjs/common";

// src/core/approvals/approvals.module.ts
import { Module as Module4 } from "@nestjs/common";

// src/core/kernel/tokens.ts
var SECRETS_PORT = Symbol("SECRETS_PORT");
var INBOUND_PORT = Symbol("INBOUND_PORT");
var ROUTING_PORT = Symbol("ROUTING_PORT");
var SESSION_STORE_PORT = Symbol("SESSION_STORE_PORT");
var AGENT_RUNTIME_PORT = Symbol("AGENT_RUNTIME_PORT");
var APPROVAL_PORT = Symbol("APPROVAL_PORT");
var DELIVERY_PORT = Symbol("DELIVERY_PORT");
var MEDIA_PORT = Symbol("MEDIA_PORT");
var COMMANDS_PORT = Symbol("COMMANDS_PORT");
var STATE_STORE_PORT = Symbol("STATE_STORE_PORT");
var MESSAGE_ENGINE_PORT = Symbol("MESSAGE_ENGINE_PORT");

// src/core/approvals/approvals.service.ts
import { Injectable as Injectable3, Logger as Logger3 } from "@nestjs/common";
var ApprovalsService = class {
  logger = new Logger3("Approvals");
  async request(req) {
    this.logger.warn(
      `auto-approving "${req.action}" (stub) for ${req.sessionKey}`
    );
    return { approved: true, by: "stub-auto-approver" };
  }
};
ApprovalsService = __decorateClass([
  Injectable3()
], ApprovalsService);

// src/core/approvals/approvals.module.ts
var ApprovalsModule = class {
};
ApprovalsModule = __decorateClass([
  Module4({
    providers: [{ provide: APPROVAL_PORT, useClass: ApprovalsService }],
    exports: [APPROVAL_PORT]
  })
], ApprovalsModule);

// src/core/config/config.module.ts
import { Module as Module5 } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";

// src/core/config/secrets.service.ts
import { Inject as Inject2, Injectable as Injectable4 } from "@nestjs/common";
import { ConfigService as ConfigService2 } from "@nestjs/config";
var SecretsService = class {
  constructor(config) {
    this.config = config;
  }
  async get(key) {
    return this.config.get(key);
  }
};
SecretsService = __decorateClass([
  Injectable4(),
  __decorateParam(0, Inject2(ConfigService2))
], SecretsService);

// src/core/config/config.module.ts
var CoreConfigModule = class {
};
CoreConfigModule = __decorateClass([
  Module5({
    imports: [NestConfigModule],
    providers: [{ provide: SECRETS_PORT, useClass: SecretsService }],
    exports: [SECRETS_PORT]
  })
], CoreConfigModule);

// src/core/engine/engine.module.ts
import { Module as Module13 } from "@nestjs/common";

// src/core/agent-runtime/agent-runtime.module.ts
import { Module as Module6 } from "@nestjs/common";

// src/core/agent-runtime/agent-runtime.service.ts
import { Injectable as Injectable5, Logger as Logger4 } from "@nestjs/common";
var AgentRuntimeService = class {
  logger = new Logger4("AgentRuntime");
  async runTurn(input) {
    this.logger.warn(
      `runTurn is a stub; returning placeholder reply for ${input.route.sessionKey}`
    );
    const echo = input.message.text ?? "";
    return {
      replies: [
        { text: `[stub agent:${input.route.agentId}] received: ${echo}` }
      ]
    };
  }
};
AgentRuntimeService = __decorateClass([
  Injectable5()
], AgentRuntimeService);

// src/core/agent-runtime/agent-runtime.module.ts
var AgentRuntimeModule = class {
};
AgentRuntimeModule = __decorateClass([
  Module6({
    providers: [{ provide: AGENT_RUNTIME_PORT, useClass: AgentRuntimeService }],
    exports: [AGENT_RUNTIME_PORT]
  })
], AgentRuntimeModule);

// src/core/commands/commands.module.ts
import { Module as Module7 } from "@nestjs/common";

// src/core/commands/commands.service.ts
import { Injectable as Injectable6 } from "@nestjs/common";
var CommandsService = class {
  async tryHandle(_message) {
    return false;
  }
};
CommandsService = __decorateClass([
  Injectable6()
], CommandsService);

// src/core/commands/commands.module.ts
var CommandsModule = class {
};
CommandsModule = __decorateClass([
  Module7({
    providers: [{ provide: COMMANDS_PORT, useClass: CommandsService }],
    exports: [COMMANDS_PORT]
  })
], CommandsModule);

// src/core/delivery/delivery.module.ts
import { Module as Module8 } from "@nestjs/common";

// src/core/delivery/delivery.service.ts
import { Injectable as Injectable7, Logger as Logger5 } from "@nestjs/common";
var DeliveryService = class {
  logger = new Logger5("Delivery");
  async deliver(target, reply) {
    this.logger.log(
      `(stub delivery) -> ${target.sessionKey}: ${JSON.stringify(reply.text ?? reply.media ?? "")}`
    );
  }
};
DeliveryService = __decorateClass([
  Injectable7()
], DeliveryService);

// src/core/delivery/delivery.module.ts
var DeliveryModule = class {
};
DeliveryModule = __decorateClass([
  Module8({
    providers: [{ provide: DELIVERY_PORT, useClass: DeliveryService }],
    exports: [DELIVERY_PORT]
  })
], DeliveryModule);

// src/core/inbound/inbound.module.ts
import { Module as Module9 } from "@nestjs/common";

// src/core/inbound/inbound.service.ts
import { Injectable as Injectable8 } from "@nestjs/common";
var InboundService = class {
  async classify(message) {
    const text = message.text?.trim() ?? "";
    if (text.startsWith("/")) {
      return { kind: "command", reason: "slash-prefixed text" };
    }
    return { kind: "respond" };
  }
};
InboundService = __decorateClass([
  Injectable8()
], InboundService);

// src/core/inbound/inbound.module.ts
var InboundModule = class {
};
InboundModule = __decorateClass([
  Module9({
    providers: [{ provide: INBOUND_PORT, useClass: InboundService }],
    exports: [INBOUND_PORT]
  })
], InboundModule);

// src/core/media/media.module.ts
import { Module as Module10 } from "@nestjs/common";

// src/core/media/media.service.ts
import { Injectable as Injectable9 } from "@nestjs/common";
var MediaService = class {
  async resolveInbound(_message) {
    return null;
  }
  async prepareOutbound(reply) {
    return reply;
  }
};
MediaService = __decorateClass([
  Injectable9()
], MediaService);

// src/core/media/media.module.ts
var MediaModule = class {
};
MediaModule = __decorateClass([
  Module10({
    providers: [{ provide: MEDIA_PORT, useClass: MediaService }],
    exports: [MEDIA_PORT]
  })
], MediaModule);

// src/core/routing/routing.module.ts
import { Module as Module11 } from "@nestjs/common";

// src/core/routing/routing.service.ts
import { Injectable as Injectable10 } from "@nestjs/common";
var DEFAULT_AGENT_ID = "main";
var RoutingService = class {
  async resolve(message) {
    const agentId = DEFAULT_AGENT_ID;
    return {
      agentId,
      sessionKey: `agent:${agentId}:${message.channel}:${message.chatId}`,
      targetKind: "agent"
    };
  }
};
RoutingService = __decorateClass([
  Injectable10()
], RoutingService);

// src/core/routing/routing.module.ts
var RoutingModule = class {
};
RoutingModule = __decorateClass([
  Module11({
    providers: [{ provide: ROUTING_PORT, useClass: RoutingService }],
    exports: [ROUTING_PORT]
  })
], RoutingModule);

// src/core/sessions/sessions.module.ts
import { Module as Module12 } from "@nestjs/common";

// src/core/sessions/sessions.service.ts
import { Inject as Inject3, Injectable as Injectable11 } from "@nestjs/common";
var SESSIONS_NAMESPACE = "sessions";
var SessionsService = class {
  constructor(state) {
    this.state = state;
  }
  async load(sessionKey) {
    return this.state.get(SESSIONS_NAMESPACE, sessionKey);
  }
  async save(stateToSave) {
    await this.state.set(SESSIONS_NAMESPACE, stateToSave.sessionKey, {
      ...stateToSave,
      updatedAt: Date.now()
    });
  }
};
SessionsService = __decorateClass([
  Injectable11(),
  __decorateParam(0, Inject3(STATE_STORE_PORT))
], SessionsService);

// src/core/sessions/sessions.module.ts
var SessionsModule = class {
};
SessionsModule = __decorateClass([
  Module12({
    providers: [{ provide: SESSION_STORE_PORT, useClass: SessionsService }],
    exports: [SESSION_STORE_PORT]
  })
], SessionsModule);

// src/core/engine/engine.service.ts
import { Inject as Inject4, Injectable as Injectable12, Logger as Logger6 } from "@nestjs/common";
var EngineService = class {
  constructor(commands, inbound, routing, sessions, agent, media, delivery) {
    this.commands = commands;
    this.inbound = inbound;
    this.routing = routing;
    this.sessions = sessions;
    this.agent = agent;
    this.media = media;
    this.delivery = delivery;
  }
  logger = new Logger6("Engine");
  async handleInbound(message) {
    if (await this.commands.tryHandle(message)) {
      return;
    }
    const decision = await this.inbound.classify(message);
    if (decision.kind === "ignore") {
      this.logger.debug(`ignored: ${decision.reason ?? "no reason"}`);
      return;
    }
    const route = await this.routing.resolve(message);
    const session = await this.sessions.load(
      route.sessionKey
    );
    await this.media.resolveInbound(message);
    const result = await this.agent.runTurn({ route, message, session });
    for (const reply of result.replies) {
      const prepared = await this.media.prepareOutbound(reply);
      await this.delivery.deliver(route, prepared);
    }
    await this.sessions.save({
      sessionKey: route.sessionKey,
      data: session?.data ?? {},
      updatedAt: Date.now()
    });
  }
};
EngineService = __decorateClass([
  Injectable12(),
  __decorateParam(0, Inject4(COMMANDS_PORT)),
  __decorateParam(1, Inject4(INBOUND_PORT)),
  __decorateParam(2, Inject4(ROUTING_PORT)),
  __decorateParam(3, Inject4(SESSION_STORE_PORT)),
  __decorateParam(4, Inject4(AGENT_RUNTIME_PORT)),
  __decorateParam(5, Inject4(MEDIA_PORT)),
  __decorateParam(6, Inject4(DELIVERY_PORT))
], EngineService);

// src/core/engine/engine.module.ts
var EngineModule = class {
};
EngineModule = __decorateClass([
  Module13({
    imports: [
      CommandsModule,
      InboundModule,
      RoutingModule,
      SessionsModule,
      AgentRuntimeModule,
      MediaModule,
      DeliveryModule
    ],
    providers: [{ provide: MESSAGE_ENGINE_PORT, useClass: EngineService }],
    exports: [MESSAGE_ENGINE_PORT]
  })
], EngineModule);

// src/core/infra/infra.module.ts
import { Global, Module as Module14 } from "@nestjs/common";

// src/core/infra/state-store.service.ts
import { Injectable as Injectable13 } from "@nestjs/common";
var StateStoreService = class {
  store = /* @__PURE__ */ new Map();
  compositeKey(namespace, key) {
    return `${namespace}\0${key}`;
  }
  async get(namespace, key) {
    return this.store.get(this.compositeKey(namespace, key)) ?? null;
  }
  async set(namespace, key, value) {
    this.store.set(this.compositeKey(namespace, key), value);
  }
  async delete(namespace, key) {
    this.store.delete(this.compositeKey(namespace, key));
  }
};
StateStoreService = __decorateClass([
  Injectable13()
], StateStoreService);

// src/core/infra/infra.module.ts
var InfraModule = class {
};
InfraModule = __decorateClass([
  Global(),
  Module14({
    providers: [{ provide: STATE_STORE_PORT, useClass: StateStoreService }],
    exports: [STATE_STORE_PORT]
  })
], InfraModule);

// src/core/core.module.ts
var CoreModule = class {
};
CoreModule = __decorateClass([
  Module15({
    imports: [InfraModule, CoreConfigModule, ApprovalsModule, EngineModule],
    exports: [EngineModule, ApprovalsModule, CoreConfigModule]
  })
], CoreModule);

// src/app.module.ts
var AppModule = class {
};
AppModule = __decorateClass([
  Module16({
    imports: [
      ConfigModule2.forRoot({
        isGlobal: true,
        envFilePath: [".env"]
      }),
      CoreModule,
      ConnectorsModule
    ]
  })
], AppModule);

// src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  const port = process.env.PORT ?? 3e3;
  await app.listen(port);
  new Logger7("Bootstrap").log(`kitty-agents listening on port ${port}`);
}
bootstrap();
//# sourceMappingURL=main.mjs.map
