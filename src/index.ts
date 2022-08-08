import 'isomorphic-unfetch';

import discovery from './grpc/discovery';

import WebSocketServer from './websocket';
import ControllerEndpoint from './controller';

const sockets = {};
const matches = {};

WebSocketServer(sockets, matches);
ControllerEndpoint(sockets, matches);

discovery.register('websocket-server', 'websocket-server:3000');

console.log('websocket server started');
