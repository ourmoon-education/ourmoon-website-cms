import * as migration_20260607_193246 from './20260607_193246';
import * as migration_20260607_195941 from './20260607_195941';
import * as migration_20260607_204530 from './20260607_204530';
import * as migration_20260614_000000_cms_full_integration from './20260614_000000_cms_full_integration';
import * as migration_20260617_151014_prod_schema_sync from './20260617_151014_prod_schema_sync';

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
    up: migration_20260617_151014_prod_schema_sync.up,
    down: migration_20260617_151014_prod_schema_sync.down,
    name: '20260617_151014_prod_schema_sync'
  },
];
