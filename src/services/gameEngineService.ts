import axios from 'axios';

import discovery from '../grpc/discovery';

let addr: string | null = null;
const serviceAddr = async () => {
  while (!addr) {
    const res = await discovery.get('game-engine-service');

    if (res.status.success) {
      addr = res.service.serviceAddr;
    } else {
      console.warn(res.status.message);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return addr;
};

async function validateMove(args: { fen: string, move: string }) {
  const res = await axios.post(`http://${await serviceAddr()}/engine/move/validate`, args);
  return res.data;
};

async function suggestMove(args: { fen: string }) {
  const res = await axios.post(`http://${await serviceAddr()}/engine/move/suggest`, args);
  return res.data;
};

export { validateMove, suggestMove };
