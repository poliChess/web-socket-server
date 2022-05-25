import 'isomorphic-unfetch';
import WebSocketServer from './websocket';
import ControllerEndpoint from './controller';

const sockets = {};
const matches = {};

WebSocketServer(sockets, matches);
ControllerEndpoint(sockets, matches);

console.log('websocket server started');

setInterval(_ => console.log(`sockets: ${Object.keys(sockets)}`), 2000);
setInterval(_ => console.log(`matches: ${Object.keys(matches)}`), 2000);
