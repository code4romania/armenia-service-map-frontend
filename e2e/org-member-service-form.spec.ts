import { CREDENTIALS } from './helpers';
import { serviceFormSuite } from './shared/service-form-suite';

// ORG_MEMBER, via the /org routes. Org members can manage their own org's services
// (create / edit / publish / delete), same as org admins.
serviceFormSuite({
  label: 'Org member',
  createRoute: '/org/services/new',
  createSubmitLabel: 'Create service',
  showsOrg: false,
  editRoutePrefix: '/org/services/',
  serviceBasePath: '/org/services',
  apiServicesPath: '/org/services',
  credentials: CREDENTIALS.member,
});
