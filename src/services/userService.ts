import { createClient } from "@urql/core";
import getClient from "../redis";

const client = createClient({
  url: 'http://user-service:3000/graphql'
})

const queries = {
  user: `query($id: ID!) {
      user(id: $id) {
        id
        mail
        username
        playedGames
        wonGames
        rating
        lastLogin
      }
    }`,
  findUser: `query($username: String!) {
      findUser(username: $username) {
        id
        mail
        username
        playedGames
        wonGames
        rating
        lastLogin
      }
    }`
}

const mutations = {
  updateUsers: ``
}

async function getUser(id: string) {
  if (id === 'computer')
    return { username: 'computer' }

  const redis = await getClient();

  const cached = await redis.get(id);
  if (cached)
    return JSON.parse(cached);

  const res = await client.query(queries.user, { id }).toPromise();
  
  redis.set(id, JSON.stringify(res.data.user));
  return res.data.user;
}

async function findUser(username: string) {
  const redis = await getClient();

  const cachedID = await redis.get(username);
  if (cachedID) {
    return await getUser(cachedID);
  } else {
    const res = await client.query(queries.findUser, { username }).toPromise();

    if (res.data && res.data.findUser) {
      redis.set(username, res.data.findUser.id);
      redis.set(res.data.findUser.id, JSON.stringify(res.data.findUser));
    }

    return res.data.findUser;
  }
}

async function updateUsers(args: { winnerId: string, loserId: string, draw: boolean }) {
  const winner = await getUser(args.winnerId);
  const loser  = await getUser(args.loserId);

  console.log('WINNER: ' + winner.rating);
  console.log('LOSER: ' + loser.rating);

  const newWinnerRating = winner.rating + 20 * (1 + (loser.rating - winner.rating) / 50);
  const newLoserRating  = loser.rating  - 20 * (1 + (loser.rating - winner.rating) / 50);

  console.log('WINNER: ' + newWinnerRating);
  console.log('LOSER: ' + newLoserRating);

  return;

  const res = await client.mutation(
    mutations.updateUsers,
    {}
  ).toPromise();
}

export { getUser, findUser, updateUsers }
