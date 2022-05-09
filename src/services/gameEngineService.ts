import axios from 'axios';

const serviceAddr = 'http://game-engine-service:3000/engine';

async function validateMove(args: { fen: string, move: string }) {
  const res = await axios.post(serviceAddr + '/move/validate', args);
  return res.data;
};

async function suggestMove(args: { fen: string }) {
  const res = await axios.post(serviceAddr + '/move/suggest', args);
  return res.data;
};

export { validateMove, suggestMove };
