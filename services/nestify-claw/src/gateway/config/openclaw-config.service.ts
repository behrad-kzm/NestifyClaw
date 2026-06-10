import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SessionConfigService } from './session-config.service';
import { buildOpenClawConfigFromEnv } from './openclaw-config.factory';
import type { OpenClawConfig } from './openclaw-config.types';

@Injectable()
export class OpenClawConfigService implements OnModuleInit {
  private readonly logger = new Logger(OpenClawConfigService.name);
  private config?: OpenClawConfig;

  constructor(
    @Inject(SessionConfigService)
    private readonly sessionConfig: SessionConfigService,
  ) {}

  onModuleInit(): void {
    try {
      this.config = buildOpenClawConfigFromEnv(
        process.env,
        this.sessionConfig.getConfig(),
      );
      const primary = this.config.agents.defaults.model.primary;
      const models = this.config.models.providers.ollama.models.map(
        (m) => m.id,
      );
      this.logger.log(
        `OpenClaw config loaded: provider=ollama primary=${primary} models=[${models.join(', ')}]`,
      );
    } catch (error) {
      this.logger.warn(
        `OpenClaw config not loaded (${error instanceof Error ? error.message : String(error)}); agent turns will fail until OLLAMA_BASE_URL is set`,
      );
    }
  }

  getConfig(): OpenClawConfig {
    if (!this.config) {
      throw new Error(
        'OpenClaw config is not loaded. Set OLLAMA_BASE_URL and OLLAMA_PRIMARY_MODEL in .env',
      );
    }
    return this.config;
  }

  isReady(): boolean {
    return Boolean(this.config);
  }
}
