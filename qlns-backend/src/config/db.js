const mongoose = require('mongoose');
const env = require('./env');

function redact(uri) {
  return String(uri).replace(/:([^:@/]+)@/, ':***@');
}

async function connectDb() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri);
  const { host, name } = mongoose.connection;
  console.log(`Mongo connected: ${redact(env.mongoUri)}  db=${name} host=${host}`);
  return mongoose.connection;
}

module.exports = { connectDb };
