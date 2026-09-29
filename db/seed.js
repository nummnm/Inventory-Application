const pool = require("./pool");
const { initializeDatabase } = require("./queries");

const categories = [
  {
    name: "Electronics",
    description: "Devices, accessories, and computer equipment.",
  },
  {
    name: "Office Supplies",
    description: "Everyday stationery and desk essentials.",
  },
  {
    name: "Furniture",
    description: "Furniture and equipment for the workspace.",
  },
];

const items = [
  {
    name: "Wireless Keyboard",
    description: "Compact wireless keyboard with rechargeable battery.",
    sku: "DEMO-ELEC-001",
    price: 49.99,
    quantity: 18,
    category: "Electronics",
  },
  {
    name: "USB-C Hub",
    description: "Seven-port USB-C hub for laptops and tablets.",
    sku: "DEMO-ELEC-002",
    price: 34.5,
    quantity: 7,
    category: "Electronics",
  },
  {
    name: "A4 Notebook",
    description: "Ruled notebook with 160 pages.",
    sku: "DEMO-OFF-001",
    price: 5.25,
    quantity: 42,
    category: "Office Supplies",
  },
  {
    name: "Blue Ballpoint Pens",
    description: "Pack of ten medium-point blue pens.",
    sku: "DEMO-OFF-002",
    price: 3.75,
    quantity: 3,
    category: "Office Supplies",
  },
  {
    name: "Desk Chair",
    description: "Adjustable task chair with a breathable back.",
    sku: "DEMO-FURN-001",
    price: 189.0,
    quantity: 4,
    category: "Furniture",
  },
];

async function seedDatabase() {
  let client;

  try {
    await initializeDatabase();
    client = await pool.connect();
    await client.query("BEGIN");

    const categoryIds = new Map();

    for (const category of categories) {
      const inserted = await client.query(
        `INSERT INTO categories (name, description)
         VALUES ($1, $2)
         ON CONFLICT (name) DO NOTHING
         RETURNING id`,
        [category.name, category.description]
      );

      let categoryId = inserted.rows[0]?.id;

      if (!categoryId) {
        const existing = await client.query(
          "SELECT id FROM categories WHERE name = $1",
          [category.name]
        );
        categoryId = existing.rows[0].id;
      }

      categoryIds.set(category.name, categoryId);
    }

    let insertedItems = 0;

    for (const item of items) {
      const result = await client.query(
        `INSERT INTO items (name, description, sku, price, quantity, category_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (sku) DO NOTHING`,
        [
          item.name,
          item.description,
          item.sku,
          item.price,
          item.quantity,
          categoryIds.get(item.category),
        ]
      );
      insertedItems += result.rowCount;
    }

    await client.query("COMMIT");
    console.log(`Seed complete: ${categories.length} demo categories available; ${insertedItems} demo items added.`);
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    throw error;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

seedDatabase().catch((error) => {
  console.error("Could not seed the local database:", error.message);
  process.exitCode = 1;
});