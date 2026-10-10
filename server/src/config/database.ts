import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI is not defined");
}

export const client = new MongoClient(uri);

let database: Db;

export async function connectDatabase(): Promise<Db> {
  if (database) {
    return database;
  }

  await client.connect();

  const info = await client.db("admin").command({ hello: 1 });

  console.log("MongoDB topology:", {
    setName: info.setName,
    msg: info.msg,
    isWritablePrimary: info.isWritablePrimary,
    hosts: info.hosts,
  });

  database = client.db(process.env.MONGODB_DB_NAME || "game-faceoff");

  console.log("MongoDB connected");

  return database;
}
