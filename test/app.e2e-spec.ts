import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import {
  GATEWAY_PORT,
  STATE_STORE_PORT,
  type GatewayPort,
  type IncomingChannelMessage,
  type SessionState,
  type StateStorePort,
} from '../src/common/types';

describe('AppModule (e2e)', () => {
  let app: INestApplication;
  let gateway: GatewayPort;
  let state: StateStorePort;

  const originalTelegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const originalWhatsappEnabled = process.env.WHATSAPP_ENABLED;

  beforeAll(() => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    process.env.WHATSAPP_ENABLED = 'false';
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
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    gateway = app.get(GATEWAY_PORT);
    state = app.get(STATE_STORE_PORT);
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
      text: 'hello e2e',
      raw: {},
    };

    await gateway.handleInbound(message);

    const session = await state.get<SessionState>(
      'sessions',
      'agent:main:telegram:e2e-chat',
    );
    expect(session).toEqual(
      expect.objectContaining({
        sessionKey: 'agent:main:telegram:e2e-chat',
        data: {},
      }),
    );
    expect(session?.updatedAt).toEqual(expect.any(Number));
  });
});
