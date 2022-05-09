import express from 'express';
import bodyParser from 'body-parser';

const newMatchInfo = (matchID: string, player1ID: string, player2ID: string) => ({
  matchID,
  player1ID,
  player2ID,
  toMove: false,
  state: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
});

function ControllerEndpoint(sockets, matches) {
  const app = express();
  app.use(bodyParser.json());

  app.get('/running', (_, res) => {
    res.send('yes');
  });

  app.post('/startGame', (req, res) => {
    const matchID = req.body.matchID;
    const player1ID = req.body.player1ID;
    const player2ID = req.body.player2ID;

    if (!matchID || !player1ID || !player2ID)
      return res.status(400).send('bad request');

    // TODO: check if both players opened a socket

    const match = newMatchInfo(matchID, player1ID, player2ID);

    matches[player1ID] = match;
    if (match.toMove)
      sockets[player1ID].send('start second');
    else
      sockets[player1ID].send('start first');

    if (player2ID != 'computer') {
      matches[player2ID] = match;
      if (match.toMove)
        sockets[player1ID].send('start first');
      else
        sockets[player1ID].send('start second');
    }

    return res.send('ok');
  });

  app.listen(3000);
}

export default ControllerEndpoint;
