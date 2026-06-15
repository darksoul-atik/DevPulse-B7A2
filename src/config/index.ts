import dotenv from "dotenv";
import path from "path";
import type { SignOptions } from "jsonwebtoken";

dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

if (saltRounds < 8 || saltRounds > 12) {
  throw new Error("BCRYPT_SALT_ROUNDS must be between 8 and 12");
}

const config = {
  connection_string: process.env.CONNECTIONSTRING as string,
  port: Number(process.env.PORT || 5000),
  jwt_secret: process.env.JWT_SECRET as string,
  jwt_expires_in: (process.env.JWT_EXPIRES_IN || "1d") as NonNullable<SignOptions["expiresIn"]>,
  bcrypt_salt_rounds: saltRounds,
  client_url: process.env.CLIENT_URL || "*",
};

export default config;
