import app from "./app";
const PORT = process.env.port ?? 3000;
app.listen(3000, () => console.log(`Listening on port ${PORT}`));
