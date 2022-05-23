import axios from 'axios';

const serviceAddr = 'http://matchmaking-service:3000';

async function updateMatch(args: { id: string, state: string, move: string }) {
  const res = await axios.post(serviceAddr + '/match/update', args);
  return res.data;
}

async function endMatch(args: { id: string, result: string }) {
  if (args.result.startsWith('WINNER'))
    args.result = args.result.substring(7);

  const res = await axios.post(serviceAddr + '/match/end', args);
  return res.data;
}

export { updateMatch, endMatch };
