import { AbilityBuilder, CreateAbility, createMongoAbility, MongoAbility } from '@casl/ability';
import { AppSubject, NavigationSubject } from './subjects';
import { Role } from './roles';
import { User } from './subjects';

export type AppAbility = MongoAbility<[string, AppSubject]>;

export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>;

/**
 * Define navigation permissions for a role
 * This is separated to allow for future custom role configurations
 */
function defineNavigationPermissions(can: AbilityBuilder<AppAbility>['can'], role: string) {
  switch (role) {
    case Role.MASTER:
    case Role.ADMIN:
      // Master and Admin have access to all navigation modules
      can('access', NavigationSubject.Dashboard);
      can('access', NavigationSubject.RegisterClients);
      can('access', NavigationSubject.RegisterProducts);
      can('access', NavigationSubject.RegisterAccesses);
      can('access', NavigationSubject.FinanceBudgets);
      can('access', NavigationSubject.FinanceSalesMovement);
      can('access', NavigationSubject.ProductionBoards);
      can('access', NavigationSubject.SettingsCompany);
      can('access', NavigationSubject.SettingsTags);
      can('access', NavigationSubject.SettingsTemplates);
      break;

    case Role.EMPLOYEE:
      // Employee has limited access based on permission.us.md
      can('access', NavigationSubject.Dashboard);
      can('access', NavigationSubject.RegisterClients);
      can('access', NavigationSubject.RegisterProducts);
      // No access: RegisterAccesses
      can('access', NavigationSubject.FinanceBudgets);
      // No access: FinanceSalesMovement (restricted to ADM/MASTER)
      can('access', NavigationSubject.ProductionBoards);
      // No access: SettingsCompany
      can('access', NavigationSubject.SettingsTags);
      can('access', NavigationSubject.SettingsTemplates);
      break;

    default:
      // Unknown roles get no navigation access
      break;
  }
}

export function defineAbilityFor(user: User) {
  const { can, cannot, build } = new AbilityBuilder(createAppAbility);

  // Define navigation permissions
  defineNavigationPermissions(can, user.role);

  // Define resource permissions
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
