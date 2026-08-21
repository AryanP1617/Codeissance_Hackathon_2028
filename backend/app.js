import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"

const app = express()
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))



app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

// Routes declaration
import user_router from "./src/routes/user.routes.js"
import customer_router from "./src/routes/customer.routes.js"
import review_queue_router from "./src/routes/reviewQueue.routes.js"
import config_router from "./src/routes/config.routes.js"
import opportunity_router from "./src/routes/opportunity.routes.js"
import ingest_router from "./src/routes/ingest.routes.js"
import audit_router from "./src/routes/audit.routes.js"


app.use("/api/v1/users", user_router)
app.use("/api/v1/customers", customer_router)
app.use("/api/v1/review", review_queue_router)
app.use("/api/v1/config", config_router)
app.use("/api/v1/opportunities", opportunity_router)
app.use("/api/v1/ingest", ingest_router)
app.use("/api/v1/audit", audit_router)

export default app 
