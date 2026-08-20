import { ApiError } from "../utils/apiError.js"
import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"


const verifyJwt = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies.accessToken || req.headers.authorization?.replace("Bearer ", "");
        if (!token) {
            throw new ApiError(401, "You are not logged in");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id)
        if (!user)
            throw new ApiError(404, "User could not be found")

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(error?.statusCode || 401, error?.message || "Invalid or expired authentication token");
    }
});

export { verifyJwt };
