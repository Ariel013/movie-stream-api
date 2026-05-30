import { Injectable } from '@nestjs/common';
import { AuditLogsRepository } from './audit-logs.repository';

@Injectable()
export class AuditLogsService {
  constructor(private readonly repo: AuditLogsRepository) {}

  findAll(limit = 100, skip = 0) {
    return this.repo.findAll(limit, skip);
  }
}
