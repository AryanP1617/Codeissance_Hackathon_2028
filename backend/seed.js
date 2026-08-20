import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import connectDB from "./src/db/db.js";
import { SourceCustomer } from "./src/models/sourceCustomer.models.js";
import { User } from "./src/models/user.model.js";
import {
  cleanPhone,
  cleanName,
  cleanPan,
  processIdentityResolution
} from "./src/services/resolution.service.js";
import { evaluateAllGoldenCustomers } from "./src/services/nbo.service.js";

/**
 * Extracts clean email address from raw email strings or markdown mailto format
 */
const extractPlainEmail = (emailStr) => {
  if (!emailStr) return "";
  const match = String(emailStr).match(/\[(.*?)\]|\((?:mailto:)?(.*?)\)/);
  if (match) {
    const raw = match[1] || match[2];
    if (raw) return raw.replace("mailto:", "").trim().toLowerCase();
  }
  return String(emailStr).trim().toLowerCase();
};

/**
 * Seed database with sampleData.json
 */
const seedData = async () => {
  try {
    console.log("==========================================");
    console.log("Starting Financial Customer 360 Seeding Process...");
    console.log("==========================================");

    await connectDB();
    console.log("Connected to MongoDB successfully.");

    // Read sampleData.json
    const sampleDataPath = path.resolve(process.cwd(), "sampleData.json");
    if (!fs.existsSync(sampleDataPath)) {
      throw new Error(`sampleData.json not found at ${sampleDataPath}`);
    }

    const rawJson = fs.readFileSync(sampleDataPath, "utf-8");
    const sampleRecords = JSON.parse(rawJson);
    console.log(`Loaded ${sampleRecords.length} raw customer records from sampleData.json.`);

    console.log("Seeding SourceCustomer records into database...");
    let sourceCount = 0;

    for (const item of sampleRecords) {
      const rawAttrs = item.rawAttributes || {};
      const plainEmail = extractPlainEmail(rawAttrs.email);
      const cleanedPhone = cleanPhone(rawAttrs.mobile || rawAttrs.phone);
      const cleanedPan = cleanPan(rawAttrs.pan);
      const cleanedName = cleanName(rawAttrs.fullName);

      const holdings = item.holdingsData || {};

      await SourceCustomer.findOneAndUpdate(
        {
          sourceSystem: item.sourceSystem,
          sourceCustomerId: item.sourceCustomerId
        },
        {
          sourceSystem: item.sourceSystem,
          sourceCustomerId: item.sourceCustomerId,
          rawAttributes: {
            fullName: rawAttrs.fullName,
            cleanFullName: cleanedName,
            email: plainEmail,
            cleanEmail: plainEmail,
            phone: rawAttrs.mobile || rawAttrs.phone,
            cleanPhone: cleanedPhone,
            pan: cleanedPan || rawAttrs.pan,
            city: rawAttrs.city,
            dateOfBirth: rawAttrs.dateOfBirth,
            dob: rawAttrs.dateOfBirth ? new Date(rawAttrs.dateOfBirth) : null,
            rawPayload: item
          },
          holdingsData: holdings,
          linkageStatus: {
            status: "UNLINKED",
            goldenCustomerId: null
          },
          ingestedAt: new Date()
        },
        { upsert: true, new: true }
      );
      sourceCount++;
    }

    console.log(`Successfully ingested ${sourceCount} SourceCustomer records across 5 financial domains.`);

    // Seed Default Users for Testing & Authentication
    console.log("Seeding default authentication users (Admin, RM, Judge)...");

    const defaultUsers = [
      {
        username: "admin",
        email: "admin@financial360.com",
        fullName: "System Administrator",
        password: "Admin@123",
        role: "ADMIN"
      },
      {
        username: "judge",
        email: "judge@financial360.com",
        fullName: "Hackathon Judge",
        password: "Judge@123",
        role: "JUDGE"
      },
      {
        username: "rm1",
        email: "rm1@financial360.com",
        fullName: "Rajesh Kumar (RM)",
        password: "Rm123456",
        role: "RM",
        assignedGoldenCustomerIds: ["GC_1001", "GC_1002", "GC_1003", "GC_1004", "GC_1005"]
      }
    ];

    for (const u of defaultUsers) {
      const existing = await User.findOne({ username: u.username });
      if (!existing) {
        await User.create(u);
        console.log(`Created default user: ${u.username} (${u.role})`);
      }
    }

    // Trigger Identity Resolution Engine to create Golden 360 Profiles
    console.log("Executing Identity Resolution & Union-Find Clustering Pipeline...");
    const resSummary = await processIdentityResolution();
    console.log("Identity Resolution Results:", {
      processedRecordsCount: resSummary.processedRecordsCount,
      goldenCustomerCount: resSummary.goldenCustomerCount,
      reviewQueueCount: resSummary.reviewQueueCount
    });

    // Trigger NBO Opportunity Engine
    console.log("Executing Next-Best-Opportunity Engine...");
    const nboSummary = await evaluateAllGoldenCustomers();
    console.log("NBO Engine Results:", {
      evaluatedCustomerCount: nboSummary.evaluatedCustomerCount,
      opportunitiesGeneratedCount: nboSummary.opportunitiesGeneratedCount
    });

    console.log("==========================================");
    console.log("Seeding & Customer 360 Generation Complete!");
    console.log("==========================================");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed with error:", error);
    process.exit(1);
  }
};

seedData();
