import app from "./app";
const PORT = process.env.PORT ?? 3000;
// biome-ignore lint/suspicious/noConsoleLog: needs logging
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
