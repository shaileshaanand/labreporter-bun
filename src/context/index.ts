import Elysia from "elysia";
import db from "./db";

const context = new Elysia().decorate("db", db);

export default context;
