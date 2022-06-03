import WebSocket from 'ws';
import jwt from './jwt';

import { validateMove, suggestMove } from './services/gameEngineService';
import { updateMatch, endMatch, leaveQueue } from './services/matchmakingService';
import { updateUsers } from './services/userService';

async function verifyAndRegisterMove(args: { matchID: string, state: string, move: string }) {
  const res1 = await validateMove({ fen: args.state, move: args.move });
  if (!res1.success)
    return res1;

  const res2 = await updateMatch({ id: args.matchID, state: res1.newFen, move: args.move });
  if (!res2.success)
    return res2;

  return {
    ...res1,
    result: res1.result || res2.result
  }
}

async function suggestAndRegisterMove(args: { matchID: string, state: string }) {
  const res1 = await suggestMove({ fen: args.state });
  if (!res1.success)
    return res1;

  const res2 = await updateMatch({ id: args.matchID, state: res1.newFen, move: res1.move });
  if (!res2.success)
    return res2;

  return {
    ...res1,
    result: res1.result || res2.result
  }
}

function WebSocketServer(sockets: any, matches: any) {
  const wss = new WebSocket.Server({ port: 8080 });

  wss.on('connection', (socket, req) => {
    const token = jwt.getToken(req.url);
    if (!token)
      return socket.close();

    const identity = jwt.verify(token);
    if (!identity)
      return socket.close();

    sockets[identity.id] = socket;

    socket.on('message', async (bytes) => {
      const msg = bytes.toString();
      if (msg.startsWith('move')) {
        const move   = msg.substring(5, 9);
        const match  = matches[identity.id];
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

        // -------------------------- VS Computer ----------------------------- //
        if (opponent === 'computer') {
          const res1 = await verifyAndRegisterMove({ matchID: match.matchID, state: match.state, move});
          if (!res1.success)
            return socket.send('bad move');

          if (res1.result !== null) {
            const result = `result ${res1.result.replace('_', ' ').toLowerCase()}`;
            socket.send(result);

            delete matches[identity.id];
            endMatch({ id: match.matchID, result: res1.result })
            return socket.close();
          }

          const res2 = await suggestAndRegisterMove({ matchID: match.matchID, state: res1.newFen });
          match.state = res2.newFen;
          socket.send(`move ${res2.move}`);

          if (res2.result !== null) {
            const result = `result ${res2.result.replace('_', ' ').toLowerCase()}`;
            socket.send(result);

            delete matches[identity.id];
            endMatch({ id: match.matchID, result: res2.result })
            return socket.close();
          }

        // --------------------------- VS Player ------------------------------ //
        } else {
          const res = await verifyAndRegisterMove({ matchID: match.matchID, state: match.state, move});
          if (!res.success)
            return socket.send('bad move');
          
          match.state = res.newFen;
          sockets[opponent].send(`move ${move}`);

          match.toMove = !match.toMove;

          if (res.result !== null) {
            const result = `result ${res.result.replace('_', ' ').toLowerCase()}`;
            socket.send(result);
            sockets[opponent].send(result);

            endMatch({ id: match.matchID, result: res.result })

            if (res.result === 'WINNER_WHITE')
              updateUsers({ winnerId: match.player1ID, loserId: match.player2ID });
            if (res.result === 'WINNER_BLACK')
              updateUsers({ winnerId: match.player2ID, loserId: match.player1ID });

            delete matches[identity.id];
            delete matches[opponent];

            socket.close();
            sockets[opponent].close();
            return;
          }
        }
      }
    });

    socket.on('close', async _ => {
      delete sockets[identity.id];

      const match = matches[identity.id];

      if (!match)
        return leaveQueue({ playerID: identity.id });

      if (match.player2ID === 'computer') {
        delete matches[identity.id];
        return endMatch({ id: match.matchID, result: 'WINNER_BLACK' });
      }

      let opponent: string, winner: string;
      if (match.player1ID === identity.id) {
        opponent = match.player2ID;
        winner = 'WINNER_BLACK';
        updateUsers({ winnerId: match.player2ID, loserId: match.player1ID });
      } else {
        opponent = match.player1ID;
        winner = 'WINNER_WHITE';
        updateUsers({ winnerId: match.player1ID, loserId: match.player2ID });
      }

      endMatch({ id: match.matchID, result: winner });

      delete matches[identity.id];
      delete matches[opponent];

      const result = `result ${winner.replace('_', ' ').toLowerCase()}`;
      sockets[opponent].send(result)
      sockets[opponent].close();
    });
  });
}

export default WebSocketServer;
