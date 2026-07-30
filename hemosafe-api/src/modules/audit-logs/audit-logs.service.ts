import { Injectable } from '@nestjs/common';
import { AuditLogsRepository } from './audit-logs.repository';

@Injectable()
export class AuditLogsService {
  constructor(private readonly repo: AuditLogsRepository) {}

  findAll(page: number, limit: number, entity?: string, search?: string) {
    return this.repo.findAll(page, limit, entity, search);
  }

  distinctEntities() {
    return this.repo.distinctEntities();
  }
}
