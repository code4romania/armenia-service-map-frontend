import { CREDENTIALS } from './helpers';
import { serviceFormSuite } from './shared/service-form-suite';

// SUPER_ADMIN, via the /admin routes (storage state from auth.setup.ts, English locale).
serviceFormSuite({
  label: 'Super admin',
  createRoute: '/admin/services/new',
  createSubmitLabel: 'Save changes',
  showsOrg: true,
  editRoutePrefix: '/admin/services/',
  serviceBasePath: '/admin/services',
  apiServicesPath: '/admin/services',
  credentials: CREDENTIALS.admin,
});
