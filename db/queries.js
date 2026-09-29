const pool = require("./pool");

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT
    );
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      description TEXT,
      sku VARCHAR(60) UNIQUE,
      price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
      quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL
    );
    ALTER TABLE items ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE items ADD COLUMN IF NOT EXISTS sku VARCHAR(60) UNIQUE;
    ALTER TABLE items ALTER COLUMN category_id DROP NOT NULL;
    ALTER TABLE items DROP CONSTRAINT IF EXISTS items_category_id_fkey;
    ALTER TABLE items
      ADD CONSTRAINT items_category_id_fkey
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
  `);
}

async function getCategories() {
  const { rows } = await pool.query(`
    SELECT c.id, c.name, c.description, COUNT(i.id)::int AS item_count
    FROM categories c
    LEFT JOIN items i ON i.category_id = c.id
    GROUP BY c.id
    ORDER BY c.name;
  `);
  return rows;
}

async function getCategory(id) {
  const { rows } = await pool.query("SELECT * FROM categories WHERE id = $1", [id]);
  return rows[0];
}

async function getItemsByCategory(categoryId) {
  const { rows } = await pool.query(`
    SELECT i.*, c.name AS category_name
    FROM items i
    LEFT JOIN categories c ON c.id = i.category_id
    WHERE i.category_id = $1
    ORDER BY i.name;
  `, [categoryId]);
  return rows;
}

async function createCategory({ name, description }) {
  const { rows } = await pool.query(
    `INSERT INTO categories (name, description)
     VALUES ($1, $2)
     RETURNING *`,
    [name, description || null]
  );
  return rows[0];
}

async function updateCategory(id, { name, description }) {
  const { rows } = await pool.query(
    `UPDATE categories
     SET name = $1, description = $2
     WHERE id = $3
     RETURNING *`,
    [name, description || null, id]
  );
  return rows[0];
}

async function setCategoryItems(categoryId, itemIds) {
  await pool.query(
    `UPDATE items
     SET category_id = CASE WHEN id = ANY($2::integer[]) THEN $1 ELSE NULL END
     WHERE category_id = $1 OR id = ANY($2::integer[])`,
    [categoryId, itemIds]
  );
}

async function deleteCategory(id) {
  return pool.query("DELETE FROM categories WHERE id = $1", [id]);
}

async function getItems() {
  const { rows } = await pool.query(`
    SELECT i.*, c.name AS category_name
    FROM items i
    LEFT JOIN categories c ON c.id = i.category_id
    ORDER BY i.name;
  `);
  return rows;
}

async function getItem(id) {
  const { rows } = await pool.query(`
    SELECT i.*, c.name AS category_name
    FROM items i
    LEFT JOIN categories c ON c.id = i.category_id
    WHERE i.id = $1;
  `, [id]);
  return rows[0];
}

async function createItem({ name, description, sku, price, quantity, categoryId }) {
  const { rows } = await pool.query(`
    INSERT INTO items (name, description, sku, price, quantity, category_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `, [name, description || null, sku || null, price, quantity, categoryId]);
  return rows[0];
}

async function updateItem(id, { name, description, sku, price, quantity, categoryId }) {
  const { rows } = await pool.query(`
    UPDATE items
    SET name = $1, description = $2, sku = $3, price = $4,
        quantity = $5, category_id = $6
    WHERE id = $7
    RETURNING *;
  `, [name, description || null, sku || null, price, quantity, categoryId, id]);
  return rows[0];
}

async function deleteItem(id) {
  return pool.query("DELETE FROM items WHERE id = $1", [id]);
}

module.exports = {
  initializeDatabase,
  getCategories,
  getCategory,
  getItemsByCategory,
  createCategory,
  updateCategory,
  setCategoryItems,
  deleteCategory,
  getItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
};