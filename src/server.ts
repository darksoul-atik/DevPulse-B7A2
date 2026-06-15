import app from "./app.js";
import config from "./config/index.js";
import { initDB } from "./db/index.js";

const main = async () => {
  try {
    //!Calling the Query of neonDB database
    await initDB();
    app.listen(config.port, () => {
      console.log(`DevPulse app listening on port ${config.port}`);
    });
  } catch (error) {
    console.log("Failed to start server", error);
    process.exit(1);
  }
};

void main();
