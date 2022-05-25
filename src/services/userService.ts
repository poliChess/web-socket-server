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

export { getUser, findUser }
