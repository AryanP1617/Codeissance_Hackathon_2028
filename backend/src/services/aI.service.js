import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { GoldenCustomer } from "../models/goldenCustomer.models.js";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

function calculateAge(dob) {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const ageDifference = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDifference);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}

export const generateCrossSellLead = async (goldenCustomerId) => {
    try {
        const customer = await GoldenCustomer.findOne({
            goldenCustomerId,
            status: "ACTIVE"
        }).lean();

        if (!customer) {
            throw new Error(`Active golden customer '${goldenCustomerId}' not found`);
        }

        const financialProfile = {
            customer: {
                age: customer.personalProfile?.dob
                    ? calculateAge(customer.personalProfile.dob)
                    : null,
                city: customer.personalProfile?.city || null
            },
            existingProducts: {
                equity: customer.equity?.accounts || [],
                mutualFunds: customer.mutualFunds?.investments || [],
                loans: customer.loans?.accounts || [],
                insurance: customer.insurance?.policies || [],
                wealth: customer.wealth?.portfolios || []
            },
            relationshipValue: {
                total: customer.totalRelationshipValue?.totalValue || 0,
                breakdown: customer.totalRelationshipValue?.breakdown || {}
            }
        };

        const prompt = `
You are an expert Wealth & Cross-Sell Intelligence Engine for a diversified multi-line financial institution offering:
- Equity (Direct Stocks & Demat)
- Mutual Funds (Lump Sum & Systematic Investment Plans - SIP)
- Loans (Home Loans, Personal Loans, Auto Loans, Loan Against Securities)
- Insurance (Term Life Cover, Health Insurance, Asset/General Insurance)
- Wealth Management (Portfolio Management Services - PMS, AIF, Wealth Advisory)

### Objective:
Analyze the customer's unified portfolio, identify the most glaring financial vulnerability or asset allocation gap, and recommend the SINGLE highest-impact product or service to pitch next.

### Customer 360 Financial Profile:
${JSON.stringify(financialProfile, null, 2)}

### Cross-Sell Heuristic Matrix:
1. Protection Gaps:
   - High Equity/TRV (> ₹2.5L) with zero or inadequate Term Insurance (< ₹50L) -> Recommend "Comprehensive Term Life Protection Cover".
   - Outstanding long-term debt (Home/Auto Loans) with no life cover -> Recommend "Loan Protection / Term Life Insurance".
2. Wealth Acceleration:
   - High liquid TRV (> ₹10L) with zero Wealth Management -> Recommend "Dedicated Portfolio Management Services (PMS)".
   - Substantial idle cash reserves (> ₹1L) -> Recommend "Systematic Investment Plan (SIP) or Short-Term Debt Allocation".
3. Debt Optimization:
   - High interest/personal loans alongside large liquid equity -> Recommend "Loan Against Securities (LAS) / Debt Refinancing".
4. Investment Diversification:
   - Active equity trading with zero Mutual Funds -> Recommend "Systematic Rupee-Cost Averaging via Index/Flexi-cap Mutual Funds".

### Strict Evaluation Constraints:
1. Lead Selection: Recommend exactly ONE product/service from the institution's offerings.
2. Anti-Cannibalization: Do NOT recommend a product category the customer already adequately holds unless it is a clear upgrade (e.g., migrating high AUM to PMS).
3. Grounding & Anti-Hallucination: Rely STRICTLY on the provided numbers, city, and asset breakdown. Do not assume or invent unlisted metrics (e.g., family size, monthly salary, non-disclosed assets).
4. Reason Precision: The reason must be 1-2 punchy sentences explicitly citing the underlying numeric trigger (e.g., "Customer holds ₹12.5L in equity but has ₹0 in term insurance...").

### Output Format:
Return valid JSON matching the schema:
{
  "lead": "<PRODUCT_OR_SERVICE_NAME>",
  "reason": "<Specific gap analysis referencing data points and the strategic rationale>"
}
`;

        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        lead: { type: "STRING" },
                        reason: { type: "STRING" }
                    },
                    required: ["lead", "reason"]
                }
            }
        });

        const responseText = typeof response.text === "function" ? response.text() : response.text;
        const result = JSON.parse(responseText);

        return {
            goldenCustomerId,
            lead: result.lead,
            reason: result.reason
        };
    } catch (error) {
        console.error("Cross-sell intelligence generation failed:", error.message);
        throw error;
    }
};