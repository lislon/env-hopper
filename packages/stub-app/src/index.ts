import { runServer } from '@env-hopper/backend';
import type { FilterPlugin } from '@env-hopper/types';

class MyPlugin implements FilterPlugin {
  name = 'MyPlugin';
}

runServer(new MyPlugin()).catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
