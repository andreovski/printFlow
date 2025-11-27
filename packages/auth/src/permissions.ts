import { AbilityBuilder, CreateAbility, createMongoAbility, MongoAbility } from '@casl/ability';
import { AppSubject } from './subjects';
import { Role } from './roles';
import { User } from './subjects';

export type AppAbility = MongoAbility<[string, AppSubject]>;

export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>;

export function defineAbilityFor(user: User) {
  const { can, cannot, build } = new AbilityBuilder(createAppAbility);

  switch (user.role) {
    case Role.MASTER:
      can('manage', 'all');
      break;

    case Role.ADMIN:
      can('manage', 'Organization', { id: user.organizationId });
      can('manage', 'User', { organizationId: user.organizationId });
      can('manage', 'Client', { organizationId: user.organizationId });
      can('manage', 'Product', { organizationId: user.organizationId });
      can('manage', 'Billing', { organizationId: user.organizationId });
      break;

    case Role.EMPLOYEE:
      can('read', 'Organization', { id: user.organizationId });
      can('read', 'User', { organizationId: user.organizationId });
      can('read', 'Client', { organizationId: user.organizationId });
      can('read', 'Product', { organizationId: user.organizationId });

      can('create', 'Client', { organizationId: user.organizationId });
      can('create', 'Product', { organizationId: user.organizationId });

      can('update', 'Client', { organizationId: user.organizationId });
      can('update', 'Product', { organizationId: user.organizationId });
      break;

    default:
      // No permissions for unknown roles
      break;
  }

  return build({
    detectSubjectType: (item) => {
      return (item as any).__typename;
    },
  });
}
