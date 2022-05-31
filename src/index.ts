import 'isomorphic-unfetch';
import WebSocketServer from './websocket';
import ControllerEndpoint from './controller';

const sockets = {};
const matches = {};

WebSocketServer(sockets, matches);
ControllerEndpoint(sockets, matches);

console.log('websocket server started');
