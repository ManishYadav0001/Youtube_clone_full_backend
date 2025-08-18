import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controllers.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router();


// Apply verifyJWT middleware to all routes in this file
router.use(verifyJWT); 


router.get("/c/:channelId", getSubscribedChannels);

router.post("/c/:channelId", toggleSubscription);

router.route("/u/:subscriberId").get(getUserChannelSubscribers);

export default router