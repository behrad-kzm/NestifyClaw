"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TelegramChannelService", {
    enumerable: true,
    get: function() {
        return TelegramChannelService;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _grammy = require("grammy");
const _runner = require("@grammyjs/runner");
const _bodyhelpers = require("../openclaw/telegram/src/bot/body-helpers");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let TelegramChannelService = class TelegramChannelService {
    constructor(config){
        this.config = config;
        this.id = 'telegram';
        this.logger = new _common.Logger('TelegramChannel');
    }
    async onApplicationBootstrap() {
        await this.start();
    }
    async onModuleDestroy() {
        await this.stop();
    }
    async start() {
        const token = this.config.get('TELEGRAM_BOT_TOKEN');
        if (!token) {
            this.logger.warn('TELEGRAM_BOT_TOKEN is not set; Telegram channel will not start. Add it to .env.');
            return;
        }
        const bot = new _grammy.Bot(token);
        this.bot = bot;
        bot.on('message', (ctx)=>this.handleMessage(ctx.msg));
        bot.catch((err)=>this.logger.error(`bot error: ${String(err.error)}`));
        // run() long-polls in the background and returns immediately.
        this.runner = (0, _runner.run)(bot);
        const me = await bot.api.getMe();
        this.logger.log(`Telegram bot @${me.username} started; listening for messages...`);
    }
    async stop() {
        if (this.runner?.isRunning()) {
            await this.runner.stop();
        }
        this.runner = undefined;
        this.bot = undefined;
    }
    handleMessage(msg) {
        const senderName = safe(()=>(0, _bodyhelpers.buildSenderName)(msg), 'unknown');
        const { text } = safe(()=>(0, _bodyhelpers.getTelegramTextParts)(msg), {
            text: '',
            entities: []
        });
        this.logger.log(`new message | chat=${msg.chat.id} (${msg.chat.type}) | from=${senderName} (id=${msg.from?.id ?? '?'}) | text=${JSON.stringify(text ?? '')}`);
    }
};
TelegramChannelService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_config.ConfigService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], TelegramChannelService);
function safe(fn, fallback) {
    try {
        return fn();
    } catch  {
        return fallback;
    }
}

//# sourceMappingURL=telegram.channel.service.js.map