import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SecretsPort } from '../../common/types';

/**
 * Secrets access (bucket B), backed by Nest's ConfigService (env / .env).
 *
 * Replace/extend with the openclaw `secret-input` / `provider-auth` flow when
 * real credential resolution is needed — the SecretsPort contract stays stable.
 */
@Injectable()
export class SecretsService implements SecretsPort {
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  async get(key: string): Promise<string | undefined> {
    return this.config.get<string>(key);
  }
}
