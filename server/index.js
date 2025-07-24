import { createServer } from 'http';
import handler from './server.js';

const server = createServer();

handler(server);

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});