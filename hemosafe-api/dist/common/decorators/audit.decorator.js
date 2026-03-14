"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditEntity = exports.AUDIT_ENTITY_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.AUDIT_ENTITY_KEY = 'audit_entity';
const AuditEntity = (entity) => (0, common_1.SetMetadata)(exports.AUDIT_ENTITY_KEY, entity);
exports.AuditEntity = AuditEntity;
//# sourceMappingURL=audit.decorator.js.map