import * as migration_20260607_193246 from './20260607_193246';
import * as migration_20260607_195941 from './20260607_195941';
import * as migration_20260607_204530 from './20260607_204530';

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
    name: '20260607_204530'
  },
];
