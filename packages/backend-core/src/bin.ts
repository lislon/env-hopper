import { runServer, FilterPlugin } from './server';

class DefaultPlugin implements FilterPlugin {
  name = 'DefaultPlugin';
}

runServer(new DefaultPlugin()).catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
}); 