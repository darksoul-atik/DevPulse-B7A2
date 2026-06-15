import bcrypt from "bcrypt";
import { StatusCodes } from "http-status-codes";
import config from "../../config/index.js";
import { pool } from "../../db/index.js";
import { USER_ROLE } from "../../types/index.js";
import type {
  ICreateUserPayload,
  IReporter,
  IUser,
  TSafeUser,
} from "./user.interface.js";

//!Checking email format
const checkEmailFormat = (email: string) => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailPattern.test(email);
};

//!Creating user into database
const createUserIntoDB = async (payLoad: ICreateUserPayload) => {
  const { name, email, password } = payLoad;
  const role = payLoad.role || USER_ROLE.contributor;

  //!Checking required fields
  if (!name || !email || !password) {
    const error: any = new Error(
      "Name, email and password are required",
    );

    error.statusCode = StatusCodes.BAD_REQUEST;
    throw error;
  }

  //!Checking email format
  if (!checkEmailFormat(email)) {
    const error: any = new Error(
      "A valid email address is required",
    );

    error.statusCode = StatusCodes.BAD_REQUEST;
    throw error;
  }

  //!Checking user role
  if (
    role !== USER_ROLE.contributor &&
    role !== USER_ROLE.maintainer
  ) {
    const error: any = new Error(
      "Role must be contributor or maintainer",
    );

    error.statusCode = StatusCodes.BAD_REQUEST;
    throw error;
  }

  //!Checking user already exists or not
  const userExist = await pool.query(
    `SELECT id FROM users WHERE email = $1`,
    [email.toLowerCase()],
  );

  if (userExist.rows.length > 0) {
    const error: any = new Error("User already exists");

    error.statusCode = StatusCodes.BAD_REQUEST;
    throw error;
  }

  //!Hashing user password
  const hashPassword = await bcrypt.hash(
    password,
    config.bcrypt_salt_rounds,
  );

  //!Inserting user into database
  const result = await pool.query<TSafeUser>(
    `
      INSERT INTO users(name, email, password, role)
      VALUES($1, $2, $3, $4)
      RETURNING id, name, email, role, created_at, updated_at
    `,
    [name, email.toLowerCase(), hashPassword, role],
  );

  const newUser = result.rows[0];

  //!Checking user created or not
  if (!newUser) {
    const error: any = new Error("User could not be created");

    error.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    throw error;
  }

  return newUser;
};

//!Getting user by email from database
const getUserByEmailFromDB = async (email: string) => {
  const result = await pool.query<IUser>(
    `SELECT * FROM users WHERE email = $1`,
    [email.toLowerCase()],
  );

  return result.rows[0];
};

//!Getting user by id from database
const getUserByIdFromDB = async (id: number) => {
  const result = await pool.query<IReporter>(
    `SELECT id, name, role FROM users WHERE id = $1`,
    [id],
  );

  return result.rows[0];
};

//!Getting multiple users from database
const getUsersByIdsFromDB = async (ids: number[]) => {
  if (ids.length === 0) {
    return [];
  }

  const result = await pool.query<IReporter>(
    `
      SELECT id, name, role
      FROM users
      WHERE id = ANY($1::int[])
    `,
    [ids],
  );

  return result.rows;
};

export const userService = {
  createUserIntoDB,
  getUserByEmailFromDB,
  getUserByIdFromDB,
  getUsersByIdsFromDB,
};