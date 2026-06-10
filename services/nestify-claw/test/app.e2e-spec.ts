import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import {
  GATEWAY_PORT,
  SESSION_STORE_PORT,
  type GatewayPort,
  type IncomingChannelMessage,
  type SessionStorePort,
} from '../src/common/types';

describe('AppModule (e2e)', () => {
  let app: INestApplication;
  let gateway: GatewayPort;
  let sessions: SessionStorePort;

  const originalTelegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const originalWhatsappEnabled = process.env.WHATSAPP_ENABLED;
  const originalDmScope = process.env.SESSION_DM_SCOPE;
  const originalOllamaBaseUrl = process.env.OLLAMA_BASE_URL;
  const originalStateDir = process.env.NESTIFY_STATE_DIR;

  beforeAll(() => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.OLLAMA_BASE_URL;
    process.env.WHATSAPP_ENABLED = 'false';
    process.env.SESSION_DM_SCOPE = 'per-channel-peer';
    process.env.NESTIFY_STATE_DIR = `/tmp/nestify-claw-e2e-${process.pid}`;
  });

  afterAll(() => {
    if (originalTelegramToken === undefined) {
      delete process.env.TELEGRAM_BOT_TOKEN;
    } else {
      process.env.TELEGRAM_BOT_TOKEN = originalTelegramToken;
    }
    if (originalWhatsappEnabled === undefined) {
      delete process.env.WHATSAPP_ENABLED;
    } else {
      process.env.WHATSAPP_ENABLED = originalWhatsappEnabled;
    }
    if (originalDmScope === undefined) {
      delete process.env.SESSION_DM_SCOPE;
    } else {
      process.env.SESSION_DM_SCOPE = originalDmScope;
    }
    if (originalOllamaBaseUrl === undefined) {
      delete process.env.OLLAMA_BASE_URL;
    } else {
      process.env.OLLAMA_BASE_URL = originalOllamaBaseUrl;
    }
    if (originalStateDir === undefined) {
      delete process.env.NESTIFY_STATE_DIR;
    } else {
      process.env.NESTIFY_STATE_DIR = originalStateDir;
    }
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    gateway = app.get(GATEWAY_PORT);
    sessions = app.get(SESSION_STORE_PORT);
  });

  afterEach(async () => {
    await app.close();
  });

  it('bootstraps without connector credentials', () => {
    expect(app).toBeDefined();
    expect(gateway).toBeDefined();
  });

  it('runs an inbound message through the gateway pipeline', async () => {
    const message: IncomingChannelMessage = {
      channel: 'telegram',
      chatId: 'e2e-chat',
      chatType: 'direct',
      peerId: 'e2e-chat',
      text: 'hello e2e',
      raw: {},
    };

    await gateway.handleInbound(message);

    const session = await sessions.load('agent:main:telegram:direct:e2e-chat');
    expect(session).toEqual(
      expect.objectContaining({
        sessionKey: 'agent:main:telegram:direct:e2e-chat',
      }),
    );
    expect(session?.updatedAt).toEqual(expect.any(Number));
  });
});
