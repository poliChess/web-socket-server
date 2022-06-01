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
        avatar
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
        avatar
        playedGames
        wonGames
        rating
        lastLogin
      }
    }`
}

const mutations = {
  updateUsers: 
    `mutation(
      $winnerId: ID!, $winnerPlayed: Int!, $winnerWon: Int!, $winnerRating: Int!,
      $loserId: ID!, $loserPlayed: Int!, $loserRating: Int!,
    ) {
      winner: updateUser(id: $winnerId, playedGames: $winnerPlayed,
                         wonGames: $winnerWon, rating: $winnerRating) {
        success
        message
        user {
          id
          mail
          username
          avatar
          playedGames
          wonGames
          rating
          lastLogin
        }
      }
      loser: updateUser(id: $loserId, playedGames: $loserPlayed, rating: $loserRating) {
        success
        message
        user {
          id
          mail
          username
          avatar
          playedGames
          wonGames
          rating
          lastLogin  
        }
      }
    }`
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

async function updateUsers(args: { winnerId: string, loserId: string }) {
  const winner = await getUser(args.winnerId);
  const loser  = await getUser(args.loserId);

  const change = 20 * (1 + (loser.rating - winner.rating) / 200);

  const res = await client.mutation(
    mutations.updateUsers,
    {
      winnerId: args.winnerId, 
      winnerPlayed: winner.playedGames + 1, 
      winnerWon: winner.wonGames + 1,
      winnerRating: Math.round(winner.rating + change),

      loserId: args.loserId,
      loserPlayed: loser.playedGames + 1,
      loserRating: Math.round(loser.rating - change)
    }
  ).toPromise();

  const redis = await getClient();

  if (res.data.winner && res.data.winner.success)
    redis.set(args.winnerId, JSON.stringify(res.data.winner.user));

  if (res.data.loser && res.data.loser.success)
    redis.set(args.loserId, JSON.stringify(res.data.loser.user));
}

export { getUser, findUser, updateUsers }
