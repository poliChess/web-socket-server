import axios from 'axios';

import discovery from '../grpc/discovery';

let addr: string | null = null;
const serviceAddr = async () => {
  while (!addr) {
    const res = await discovery.get('matchmaking-service');

    if (res.status.success) {
      addr = res.service.serviceAddr;
    } else {
      console.warn(res.status.message);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return addr;
};

async function updateMatch(args: { id: string, state: string, move: string }) {
  const res = await axios.post(`http://${await serviceAddr()}/match/update`, args);
  return res.data;
}

async function endMatch(args: { id: string, result: string }) {
  if (args.result.startsWith('WINNER'))
    args.result = args.result.substring(7);

  const res = await axios.post(`http://${await serviceAddr()}/match/end`, args);
  return res.data;
}

async function leaveQueue(args: { playerID: string }) {
  const res = await axios.post(`http://${await serviceAddr()}/queue/leave`, args);
  return res.data;
}

export { updateMatch, endMatch, leaveQueue };
