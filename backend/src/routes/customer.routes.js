import { Router } from "express";
import { getCustomers, getCustomer360ById } from "../controllers/customer.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const customer_router = Router();

// All customer endpoints require JWT authentication for RBAC scoping
customer_router.use(verifyJwt);

// GET /api/v1/customers - Search, filter, and paginate Golden Customer profiles
customer_router.route("/get-customers").get(getCustomers);

// GET /api/v1/customers/:id - Retrieve complete 360 customer profile by Golden Customer ID
customer_router.route("/get-customers/:id").get(getCustomer360ById);


export { customer_router };
export default customer_router;
