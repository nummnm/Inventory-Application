const queries = require("../db/queries");
const adminPasswordError = require("../adminPassword");

function parseItem(body) {
  return {
    name: (body.name || "").trim(),
    description: (body.description || "").trim(),
    sku: (body.sku || "").trim(),
    price: body.price === "" || body.price == null ? Number.NaN : Number(body.price),
    quantity: body.quantity === "" || body.quantity == null ? Number.NaN : Number(body.quantity),
    categoryId: body.category_id === "" || body.category_id == null
      ? null
      : Number(body.category_id),
  };
}

function validateItem(item) {
  if (!item.name) return "Item name is required.";
  if (!Number.isFinite(item.price) || item.price < 0) {
    return "Enter a valid price of 0 or more.";
  }
  if (!Number.isInteger(item.quantity) || item.quantity < 0) {
    return "Quantity must be a whole number of 0 or more.";
  }
  if (item.categoryId !== null && (!Number.isInteger(item.categoryId) || item.categoryId < 1)) {
    return "Choose a category.";
  }

  return null;
}

function formValues(item) {
  return {
    ...item,
    category_id: item.categoryId ?? item.category_id,
  };
}

function saveError(error) {
  if (error.code === "23505") return "That SKU is already in use.";
  if (error.code === "23503") return "Choose an existing category.";
  return null;
}

async function list(req, res) {
  res.render("items/index", {
    title: "Inventory",
    items: await queries.getItems(),
    message: req.query.message,
    error: req.query.error,
  });
}

async function detail(req, res) {
  const item = await queries.getItem(req.params.id);

  if (!item) {
    return res.status(404).render("not-found", { title: "Item not found" });
  }

  res.render("items/detail", { title: item.name, item });
}

async function newForm(req, res) {
  res.render("items/form", {
    title: "New item",
    item: { quantity: 0 },
    categories: await queries.getCategories(),
    error: null,
  });
}

async function create(req, res) {
  const item = parseItem(req.body);
  const categories = await queries.getCategories();
  const error = validateItem(item);

  if (error) {
    return res.status(400).render("items/form", {
      title: "New item",
      item: formValues(item),
      categories,
      error,
    });
  }

  try {
    await queries.createItem(item);
    res.redirect("/items?message=Item%20created");
  } catch (saveFailure) {
    const message = saveError(saveFailure);
    if (!message) throw saveFailure;

    res.status(400).render("items/form", {
      title: "New item",
      item: formValues(item),
      categories,
      error: message,
    });
  }
}

async function editForm(req, res) {
  const [item, categories] = await Promise.all([
    queries.getItem(req.params.id),
    queries.getCategories(),
  ]);

  if (!item) {
    return res.status(404).render("not-found", { title: "Item not found" });
  }

  res.render("items/form", {
    title: `Edit ${item.name}`,
    item,
    categories,
    error: null,
  });
}

async function update(req, res) {
  const item = parseItem(req.body);
  const categories = await queries.getCategories();
  const formItem = { ...formValues(item), id: req.params.id };
  const passwordError = adminPasswordError(req.body.admin_password);

  if (passwordError) {
    return res.status(403).render("items/form", {
      title: "Edit item",
      item: formItem,
      categories,
      error: passwordError,
    });
  }

  const error = validateItem(item);

  if (error) {
    return res.status(400).render("items/form", {
      title: "Edit item",
      item: formItem,
      categories,
      error,
    });
  }

  try {
    const updated = await queries.updateItem(req.params.id, item);

    if (!updated) {
      return res.status(404).render("not-found", { title: "Item not found" });
    }

    res.redirect("/items?message=Item%20updated");
  } catch (saveFailure) {
    const message = saveError(saveFailure);
    if (!message) throw saveFailure;

    res.status(400).render("items/form", {
      title: "Edit item",
      item: formItem,
      categories,
      error: message,
    });
  }
}

async function remove(req, res) {
  const passwordError = adminPasswordError(req.body.admin_password);

  if (passwordError) {
    return res.redirect(`/items?error=${encodeURIComponent(passwordError)}`);
  }

  await queries.deleteItem(req.params.id);
  res.redirect("/items?message=Item%20deleted");
}

module.exports = { list, detail, newForm, create, editForm, update, remove };