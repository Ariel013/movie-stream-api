import { SetMetadata } from '@nestjs/common';

export const AUDIT_ENTITY_KEY = 'audit_entity';

/**
 * Marks the handler with the entity name that should appear in audit_logs.
 * @example @AuditEntity('blood_bags')
 */
export const AuditEntity = (entity: string) =>
  SetMetadata(AUDIT_ENTITY_KEY, entity);
