import { Resend } from "resend";
import { generateClientPitchEmail } from "./services/aI.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { NBOOpportunity } from "../models/nboOpportunity.models.js";
import mongoose from "mongoose";
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js";

const resend = new Resend(process.env.RESEND_API_KEY);

export const pitchAndSendOpportunityEmail = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);

    const opportunity = await NBOOpportunity.findOne({
        $or: [{ opportunityId: id }, ...(isObjectId ? [{ _id: id }] : [])]
    }).populate("goldenCustomer");

    if (!opportunity) throw new ApiError(404, "Opportunity not found");

    const goldenCustomer = opportunity.goldenCustomer;
    const recipientEmail = goldenCustomer?.personalProfile?.primaryEmail || process.env.RESEND_FALLBACK_EMAIL;

    // Generate Scheme-Centric Pitch via Gemini
    const pitch = await generateClientPitchEmail(goldenCustomer, opportunity);

    // Send via Resend
    const emailDelivery = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "Advisory Desk <onboarding@resend.dev>",
        to: recipientEmail,
        subject: pitch.subject,
        html: `
      <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; line-height: 1.6;">
        <h3 style="color: #0f172a; margin-bottom: 8px;">Exclusive Product Proposition</h3>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 16px;" />
        ${pitch.htmlBody}
        <br />
        <p style="margin-bottom: 2px;">Sincerely,</p>
        <p style="font-weight: bold; margin-top: 0; color: #0f172a;">${req.user?.fullName || 'Your Wealth Management Team'}</p>
      </div>
    `
    });

    opportunity.status = "CONTACTED";
    await opportunity.save();

    return res.status(200).json(
        new ApiResponse(200, {
            opportunityId: opportunity.opportunityId,
            scheme: opportunity.targetProduct,
            pitch,
            recipient: recipientEmail,
            deliveryId: emailDelivery?.data?.id
        }, "Scheme pitch generated and delivered successfully")
    );
});
