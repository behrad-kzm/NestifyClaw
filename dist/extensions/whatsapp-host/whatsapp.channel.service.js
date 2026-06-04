"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "WhatsappChannelService", {
    enumerable: true,
    get: function() {
        return WhatsappChannelService;
    }
});
const _common = require("@nestjs/common");
const _baileys = /*#__PURE__*/ _interop_require_wildcard(require("baileys"));
const _qrcodeterminal = /*#__PURE__*/ _interop_require_wildcard(require("qrcode-terminal"));
const _extract = require("../openclaw/whatsapp/src/inbound/extract");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
const AUTH_DIR = '.wa-auth';
let WhatsappChannelService = class WhatsappChannelService {
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
            this.sock?.end(undefined);
        } catch  {
        // ignore teardown errors
        }
        this.sock = undefined;
    }
    async connect() {
        const { state, saveCreds } = await (0, _baileys.useMultiFileAuthState)(AUTH_DIR);
        // baileys expects a pino-like logger; a silent one keeps our console clean.
        const silentLogger = {
            level: 'silent',
            child: ()=>silentLogger,
            trace () {},
            debug () {},
            info () {},
            warn () {},
            error () {},
            fatal () {}
        };
        const sock = (0, _baileys.default)({
            auth: state,
            logger: silentLogger,
            markOnlineOnConnect: false,
            browser: [
                'kitty-agents',
                'Chrome',
                '1.0.0'
            ]
        });
        this.sock = sock;
        sock.ev.on('creds.update', saveCreds);
        sock.ev.on('connection.update', (update)=>{
            const { connection, lastDisconnect, qr } = update;
            if (qr) {
                this.logger.log('Scan this QR in WhatsApp > Linked Devices:');
                _qrcodeterminal.generate(qr, {
                    small: true
                });
            }
            if (connection === 'open') {
                this.logger.log('WhatsApp connected; listening for messages...');
            }
            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const loggedOut = statusCode === _baileys.DisconnectReason.loggedOut;
                if (loggedOut) {
                    this.logger.warn(`Logged out. Delete the ${AUTH_DIR}/ folder and restart to re-pair.`);
                } else if (!this.stopping) {
                    this.logger.warn('Connection closed; reconnecting...');
                    void this.connect();
                }
            }
        });
        sock.ev.on('messages.upsert', ({ messages, type })=>{
            if (type !== 'notify') return; // only fresh inbound messages
            for (const m of messages){
                if (!m.message || m.key.fromMe) continue;
                this.handleMessage(m);
            }
        });
    }
    handleMessage(m) {
        const chatId = m.key.remoteJid ?? 'unknown';
        const isGroup = chatId.endsWith('@g.us');
        const senderName = m.pushName ?? 'unknown';
        const senderId = (isGroup ? m.key.participant : m.key.remoteJid) ?? '?';
        const text = safe(()=>(0, _extract.extractText)(m.message), undefined);
        this.logger.log(`new message | chat=${chatId}${isGroup ? ' (group)' : ''} | from=${senderName} (id=${senderId}) | text=${JSON.stringify(text ?? '')}`);
    }
    constructor(){
        this.id = 'whatsapp';
        this.logger = new _common.Logger('WhatsappChannel');
        this.stopping = false;
    }
};
WhatsappChannelService = _ts_decorate([
    (0, _common.Injectable)()
], WhatsappChannelService);
function safe(fn, fallback) {
    try {
        return fn();
    } catch  {
        return fallback;
    }
}

//# sourceMappingURL=whatsapp.channel.service.js.map