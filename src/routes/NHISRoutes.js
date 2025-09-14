import express from "express"
import { createOfficial, officialLogin, approve, officialLogout } from "../controllers/NHISController.js"

const router = express.Router()

router.post("/create", createOfficial)
router.post("/login", officialLogin)
router.post("/approve", approve)
router.post("/logout", officialLogout)

export default router;

