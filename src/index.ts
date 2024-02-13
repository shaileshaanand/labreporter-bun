import app from "./app";
const PORT = process.env.port ?? 3000;
// biome-ignore lint/suspicious/noConsoleLog: needs logging
app.listen(3000, () => console.log(`Listening on port ${PORT}`));
