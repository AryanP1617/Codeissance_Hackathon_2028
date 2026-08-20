import { Router } from "express";
import { getCustomers, getCustomer360ById, unmaskCustomerPII } from "../controllers/customer.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const customer_router = Router();

// All customer endpoints require JWT authentication for RBAC scoping
customer_router.use(verifyJwt);

// GET /api/v1/customers - Search, filter, and paginate Golden Customer profiles
customer_router.route("/get-customers").get(getCustomers);

// POST /api/v1/customers/unmask-pii - Audited PII unmasking endpoint
customer_router.route("/unmask-pii").post(unmaskCustomerPII);

// GET/POST /api/v1/customers/get-customers/:id/unmask - Audited PII unmasking by ID
customer_router.route("/get-customers/:id/unmask").post(unmaskCustomerPII).get(unmaskCustomerPII);

// GET /api/v1/customers/:id - Retrieve complete 360 customer profile by Golden Customer ID
customer_router.route("/get-customers/:id").get(getCustomer360ById);

export { customer_router };
export default customer_router;
