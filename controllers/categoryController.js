const queries = require("../db/queries");
const adminPasswordError = require("../adminPassword");

function categoryError(code) {
	if (code === "23505") {
		return "A category with that name already exists.";
	}

	if (code === "23503") {
		return "This category still contains items. Move or delete them before deleting the category.";
	}

	return "The category could not be saved. Please try again.";
}

function parseItemIds(body) {
	const values = Array.isArray(body.item_ids)
		? body.item_ids
		: body.item_ids == null ? [] : [body.item_ids];

	return [...new Set(values.map(Number).filter((id) => Number.isInteger(id) && id > 0))];
}

async function list(req, res) {
	res.render("categories/index", {
		title: "Categories",
		categories: await queries.getCategories(),
		message: req.query.message,
		error: req.query.error,
	});
}

async function detail(req, res) {
	const [category, items] = await Promise.all([
		queries.getCategory(req.params.id),
		queries.getItemsByCategory(req.params.id),
	]);

	if (!category) {
		return res.status(404).render("not-found", { title: "Category not found" });
	}

	res.render("categories/detail", {
		title: "Categories",
		category,
		items,
	});
}


async function newForm(req, res) {
	res.render("categories/form", {
		title: "New category",
		category: {},
		items: await queries.getItems(),
		selectedItemIds: [],
		error: null,
	});
}

async function create(req, res) {
	const category = {
		name: (req.body.name || "").trim(),
		description: (req.body.description || "").trim(),
	};
	const items = await queries.getItems();
	const selectedItemIds = parseItemIds(req.body);

	if (!category.name) {
		return res.status(400).render("categories/form", {
			title: "New category",
			category,
			items,
			selectedItemIds,
			error: "Category name is required.",
		});
	}

	try {
		const created = await queries.createCategory(category);
		await queries.setCategoryItems(created.id, selectedItemIds);
		res.redirect("/categories?message=Category%20created");
	} catch (error) {
		if (error.code !== "23505") throw error;

		res.status(400).render("categories/form", {
			title: "New category",
			category,
			items,
			selectedItemIds,
			error: categoryError(error.code),
		});
	}
}

async function editForm(req, res) {
	const [category, items] = await Promise.all([
		queries.getCategory(req.params.id),
		queries.getItems(),
	]);

	if (!category) {
		return res.status(404).render("not-found", { title: "Category not found" });
	}

	res.render("categories/form", {
		title: "Edit category",
		category,
		items,
		selectedItemIds: items
			.filter((item) => Number(item.category_id) === Number(category.id))
			.map((item) => Number(item.id)),
		error: null,
	});
}

async function update(req, res) {
	const categoryData = {
		name: (req.body.name || "").trim(),
		description: (req.body.description || "").trim(),
	};
	const category = { ...categoryData, id: req.params.id };
	const items = await queries.getItems();
	const selectedItemIds = parseItemIds(req.body);
	const passwordError = adminPasswordError(req.body.admin_password);

	if (passwordError) {
		return res.status(403).render("categories/form", {
			title: "Edit category",
			category,
			items,
			selectedItemIds,
			error: passwordError,
		});
	}

	if (!category.name) {
		return res.status(400).render("categories/form", {
			title: "Edit category",
			category,
			items,
			selectedItemIds,
			error: "Category name is required.",
		});
	}

	try {
		const updated = await queries.updateCategory(req.params.id, categoryData);

		if (!updated) {
			return res.status(404).render("not-found", { title: "Category not found" });
		}

		await queries.setCategoryItems(updated.id, selectedItemIds);
		res.redirect("/categories?message=Category%20updated");
	} catch (error) {
		if (error.code !== "23505") throw error;

		res.status(400).render("categories/form", {
			title: "Edit category",
			category,
			items,
			selectedItemIds,
			error: categoryError(error.code),
		});
	}
}

async function remove(req, res) {
	const passwordError = adminPasswordError(req.body.admin_password);

	if (passwordError) {
		return res.redirect(`/categories?error=${encodeURIComponent(passwordError)}`);
	}

	try {
		await queries.deleteCategory(req.params.id);
		res.redirect("/categories?message=Category%20deleted");
	} catch (error) {
		if (error.code !== "23503") throw error;

		res.redirect(`/categories?error=${encodeURIComponent(categoryError(error.code))}`);
	}
}

module.exports = { list, detail, newForm, create, editForm, update, remove };
