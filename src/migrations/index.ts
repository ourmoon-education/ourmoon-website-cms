import * as migration_20260607_193246 from './20260607_193246';
import * as migration_20260607_195941 from './20260607_195941';
import * as migration_20260607_204530 from './20260607_204530';
import * as migration_20260614_000000_cms_full_integration from './20260614_000000_cms_full_integration';
import * as migration_20260617_120000_add_globals_and_missing_events_fields from './20260617_120000_add_globals_and_missing_events_fields';
import * as migration_20260617_142108 from './20260617_142108';
import * as migration_20260617_143446_drop_scheduled_dates_and_add_favicon from './20260617_143446_drop_scheduled_dates_and_add_favicon';

export const migrations = [
  {
    up: migration_20260607_193246.up,
    down: migration_20260607_193246.down,
    name: '20260607_193246',
  },
  {
    up: migration_20260607_195941.up,
    down: migration_20260607_195941.down,
    name: '20260607_195941',
  },
  {
    up: migration_20260607_204530.up,
    down: migration_20260607_204530.down,
    name: '20260607_204530',
  },
  {
    up: migration_20260614_000000_cms_full_integration.up,
    down: migration_20260614_000000_cms_full_integration.down,
    name: '20260614_000000_cms_full_integration',
  },
  {
    up: migration_20260617_120000_add_globals_and_missing_events_fields.up,
    down: migration_20260617_120000_add_globals_and_missing_events_fields.down,
    name: '20260617_120000_add_globals_and_missing_events_fields',
  },
  {
    up: migration_20260617_142108.up,
    down: migration_20260617_142108.down,
    name: '20260617_142108',
  },
  {
    up: migration_20260617_143446_drop_scheduled_dates_and_add_favicon.up,
    down: migration_20260617_143446_drop_scheduled_dates_and_add_favicon.down,
    name: '20260617_143446_drop_scheduled_dates_and_add_favicon'
  },
];
