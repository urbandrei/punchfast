const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

// Controllers
const authController = require("../controllers/authController");
const punchesController = require("../controllers/punchesController");
const storeController = require("../controllers/storeController");
const routeController = require("../controllers/routeController");
const visitController = require("../controllers/visitController");
const routeStartController = require("../controllers/routeStartController");
const savedStoresController = require("../controllers/savedStoresController");
const nearbyEligibleStoresController = require("../controllers/nearbyEligibleStoresController");

/* ===============================
   AUTH ROUTES (NO AUTH REQUIRED)
================================*/

router.post("/signup", authController.signup);
router.post("/login", authController.login);

router.post("/business/signup", authController.businessSignup);
router.post("/business/login", authController.businessLogin);

router.post("/send-otp", authController.sendOTP);
router.post("/verify-otp", authController.verifyOTP);

router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-reset-otp", authController.verifyResetOtp);
router.post("/reset-password", authController.resetPassword);

router.post("/logout", authController.logout);

/* ===============================
   PROTECTED ROUTES (AUTH REQUIRED)
================================*/

// Secure testing route
router.get("/secure-data", auth, (req, res) => {
    res.json({ message: "Secure data accessed", user: req.user });
});

// Punches
router.post("/punch", auth, punchesController.punch);

// Stores
router.get("/stores/nearby", auth, storeController.getNearbyStores);
router.post("/stores", auth, storeController.newStore);

// Routes
router.post("/routes", auth, routeController.newRoute);
router.get("/routes/nearby", auth, routeController.getNearbyRoutes);

// Visits
router.post("/visits", auth, visitController.createVisit);
router.get("/visits/store-stats", auth, visitController.getStoreVisitStats);
router.get("/visits/route-progress", auth, visitController.getRouteVisitProgress);

// Route Starts
router.post("/route-starts", auth, routeStartController.startRoute);
router.put("/route-starts/leave", auth, routeStartController.leaveRoute);
router.get("/users/:userId/route-starts", auth, routeStartController.getUserRouteStarts);

// Saved Stores
router.post("/saved-stores/toggle", auth, savedStoresController.toggleSavedStore);
router.get("/saved-stores/:userId", auth, savedStoresController.getUserSavedStores);
router.get("/saved-stores/:userId/:storeId", auth, savedStoresController.checkStoreSaved);

// Nearby eligible stores
router.get("/nearby-eligible-stores", auth, nearbyEligibleStoresController.getNearbyEligibleStores);

module.exports = router;
