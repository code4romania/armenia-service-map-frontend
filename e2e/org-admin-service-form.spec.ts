import { CREDENTIALS } from './helpers';
import { serviceFormSuite } from './shared/service-form-suite';

// ORG_ADMIN, via the /org routes (storage state from auth.setup.ts, English locale).
serviceFormSuite({
  label: 'Org admin',
  createRoute: '/org/services/new',
  createSubmitLabel: 'Create service',
  showsOrg: false,
  editRoutePrefix: '/org/services/',
  serviceBasePath: '/org/services',
  apiServicesPath: '/org/services',
  credentials: CREDENTIALS.org,
});
