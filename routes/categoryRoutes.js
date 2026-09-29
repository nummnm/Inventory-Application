const { Router } = require("express");
const controller = require("../controllers/categoryController");

const router = Router();

router.get("/", controller.list);
router.get("/new", controller.newForm);
router.post("/", controller.create);
router.get("/:id", controller.detail);
router.get("/:id/edit", controller.editForm);
router.post("/:id/update", controller.update);
router.post("/:id/delete", controller.remove);

module.exports = router;