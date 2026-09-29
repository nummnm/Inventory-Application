require("dotenv").config();

const express = require("express");
const path = require("node:path");
const pool = require("./db/pool");
const { initializeDatabase } = require("./db/queries");
const categoryRoutes = require("./routes/categoryRoutes");
const itemRoutes = require("./routes/itemRoutes");

const app = express();
const port = Number(process.env.PORT || 3000);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => res.redirect("/items"));
app.use("/categories", categoryRoutes);
app.use("/items", itemRoutes);
app.use((req, res) => res.status(404).render("not-found", { title: "Not found" }));
app.use((error, req, res, next) => {
	console.error(error);
	res.status(500).render("error", { title: "Something went wrong" });
});

async function start() {
	await initializeDatabase();
	app.listen(port, () => console.log(`Inventory app listening at http://localhost:${port}`));
}

start().catch(async (error) => {
	console.error("Could not start the inventory app. Check PostgreSQL connection settings.", error);
	await pool.end();
	process.exitCode = 1;
});
