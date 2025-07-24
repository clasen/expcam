import { createServer } from 'http';
import 'dotenv/config';

const server = createServer();

import('./server/server.js').then((module) => {
    return module.default(server);
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});