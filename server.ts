/**
 * Combined server for Azure deployment
 * Runs both Next.js frontend and Socket.IO backend on the same port
 */

import next from 'next';
import { httpServer, app as expressApp } from './server/index';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

// Create Next.js app
const nextApp = next({ dev, hostname, port });
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  // Integrate Next.js with Express
  // Socket.IO handles /socket.io routes automatically
  // All other routes go to Next.js
  expressApp.all('*', (req, res) => {
    return handle(req, res);
  });

  // Start the combined server on the specified port
  httpServer.listen(port, hostname, () => {
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║   🚀 Combined Server Started         ║');
    console.log(`║   Port: ${port}                           ║`);
    console.log(`║   Host: ${hostname}                      ║`);
    console.log(`║   Environment: ${dev ? 'Development' : 'Production'}  ║`);
    console.log('╚═══════════════════════════════════════╝\n');
  });
}).catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});

