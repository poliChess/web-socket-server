import WebSocket from 'ws';
import jwt from './jwt';

import { validateMove, suggestMove } from './services/gameEngineService';
import { updateMatch, endMatch } from './services/matchmakingService';

function WebSocketServer(sockets, matches) {
  const wss = new WebSocket.Server({ port: 8080 });

  wss.on('connection', (socket, req) => {
    const token = jwt.getToken(req.url);
    if (!token)
      return socket.close();

    const identity = jwt.verify(token);
    if (!identity)
      return socket.close();

    console.log(`--> ${identity.id} connected!`);
    sockets[identity.id] = socket;

    socket.on('message', async (bytes) => {
      const msg = bytes.toString();
      if (msg.startsWith('move')) {
        const move = msg.substring(5, 9);
        console.log(`>> ${identity.id} moving ${move}`);

        const match = matches[identity.id];

        const player = identity.id;
        let opponent = null;
        
        if (match.player1ID === player) {
          opponent = match.player2ID;
          if (match.toMove)
            return socket.send('not your turn');
        }

        if (match.player2ID === player) {
          opponent = match.player1ID;
          if (!match.toMove)
            return socket.send('not your turn');
        }

        // this is bad
        if (!opponent) 
          return socket.close();

        if (opponent === 'computer') {
          const res1 = await validateMove({ fen: match.state, move });
          if (!res1.success)
            return socket.send('bad move');

          // TODO: send move to matchmaking

          if (res1.result !== null) {
            const result = `result ${res1.result.replace('_', ' ').toLowerCase()}`;
            socket.send(result);

            delete matches[identity.id];
            await endMatch({ id: match.matchID, result: res1.result })
            return socket.close();
          }

          const res2 = await suggestMove({ fen: res1.newFen });
          match.state = res2.newFen;
          socket.send(`move ${res2.move}`);

          // TODO: send move to matchmaking

          if (res2.result !== null) {
            const result = `result ${res2.result.replace('_', ' ').toLowerCase()}`;
            socket.send(result);

            delete matches[identity.id];
            await endMatch({ id: match.matchID, result: res2.result })
            return socket.close();
          }

        } else {
          const res = await validateMove({ fen: match.state, move });
          if (!res.success)
            return socket.send('bad move');

          // TODO: send move to matchmaking
          
          match.state = res.newFen;
          sockets[opponent].send(`move ${move}`);

          if (res.result !== null) {
            const result = `result ${res.result.replace('_', ' ').toLowerCase()}`;
            socket.send(result);
            sockets[opponent].send(result);

            delete matches[identity.id];
            delete matches[opponent];
            await endMatch({ id: match.matchID, result: res.result })
            socket.close();
            sockets[opponent].close();
            return;
          }

          match.toMove = !match.toMove;
        }

      }
    });

    socket.on('close', async _ => {
      console.log(`==> ${identity.id} disconnected!`);
      delete sockets[identity.id];

      // TODO: invalidate queue if game not started
      // TODO: invalidate match if started
    });
  });
}

export default WebSocketServer;
