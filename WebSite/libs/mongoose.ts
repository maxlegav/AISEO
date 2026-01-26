import mongoose from "mongoose";

const connectMongo = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("Veuillez définir la variable d'environnement MONGODB_URI");
  }

  return mongoose
    .connect(process.env.MONGODB_URI)
    .catch((e) => console.error("Mongoose Client Error: " + e.message));
};

export default connectMongo;
