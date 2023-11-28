export const getMongoUri = () => {
  const dbName = 'home_works';

  return process.env.MONGO_URL || `mongodb://127.0.0.1:27017/${dbName}`;
};
