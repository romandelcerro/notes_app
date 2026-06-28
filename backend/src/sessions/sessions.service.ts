import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, IsNull } from 'typeorm';
import { createHash, randomUUID } from 'node:crypto';
import { SessionEntity } from '../entities/session.entity.js';
import { CacheService } from '../common/cache.service.js';
import type { SessionResponse } from '@notes-app/shared';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class SessionsService {
  private readonly _logger = new Logger(SessionsService.name);

  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepo: Repository<SessionEntity>,
    private readonly cache: CacheService,
  ) {}

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async create(userId: string, deviceInfo?: string, ipAddress?: string) {
    const raw = randomUUID() + randomUUID();
    const hash = this.hashToken(raw);
    const session = this.sessionRepo.create({
      userId,
      refreshTokenHash: hash,
      deviceInfo: deviceInfo ?? null,
      ipAddress: ipAddress ?? null,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    });
    await this.sessionRepo.save(session);
    await this.cache.delByPrefix(`sessions:${userId}:`);
    this._logger.log(`Session created: ${session.id} for user ${userId}`);
    return { session, rawToken: raw };
  }

  async findByRefreshToken(rawToken: string) {
    const hash = this.hashToken(rawToken);
    return this.sessionRepo.findOne({
      where: {
        refreshTokenHash: hash,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });
  }

  async rotate(session: SessionEntity) {
    session.revokedAt = new Date();
    await this.sessionRepo.save(session);
    return this.create(session.userId);
  }

  async revoke(sessionId: string) {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (session) {
      session.revokedAt = new Date();
      await this.sessionRepo.save(session);
      await this.cache.delByPrefix(`sessions:${session.userId}:`);
      this._logger.log(`Session revoked: ${sessionId}`);
    }
  }

  async revokeAllForUser(userId: string) {
    await this.sessionRepo.update({ userId, revokedAt: IsNull() }, { revokedAt: new Date() });
    await this.cache.delByPrefix(`sessions:${userId}:`);
    this._logger.log(`All sessions revoked for user ${userId}`);
  }

  async findActiveByUser(userId: string): Promise<SessionResponse[]> {
    const sessions = await this.sessionRepo.find({
      where: { userId, revokedAt: IsNull(), expiresAt: MoreThan(new Date()) },
      order: { createdAt: 'DESC' },
    });
    return sessions.map((s) => this._toSessionResponse(s));
  }

  private _toSessionResponse(s: SessionEntity): SessionResponse {
    return {
      id: s.id,
      deviceInfo: s.deviceInfo,
      ipAddress: s.ipAddress,
      expiresAt: s.expiresAt.toISOString(),
      lastUsedAt: s.lastUsedAt?.toISOString() ?? null,
      createdAt: s.createdAt.toISOString(),
    };
  }

  async cleanupExpired() {
    const result = await this.sessionRepo.delete({
      expiresAt: LessThan(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
    });
    if (result.affected && result.affected > 0) {
      this._logger.log(`Cleaned ${result.affected} expired sessions`);
    }
  }
}
