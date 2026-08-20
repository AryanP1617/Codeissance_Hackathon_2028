import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, "Password is required"]
    },
    role: {
      type: String,
      enum: ["ADMIN", "JUDGE", "RM", "COMPLIANCE_OFFICER"],
      default: "RM",
      required: true
    },
    assignedGoldenCustomerIds: [
      {
        type: String // For RM role isolation: goldenCustomerIds assigned to this RM
      }
    ],
    refreshToken: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook to hash password and refreshToken before saving to database
userSchema.pre("save", async function (next) {
  try {
    if (this.isModified("password")) {
      this.password = await bcrypt.hash(this.password, 10);
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Method to verify password match
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Method to verify refresh token match
userSchema.methods.isRefreshTokenCorrect = async function (refreshToken) {
  if (!this.refreshToken) return false;
  return await bcrypt.compare(refreshToken, this.refreshToken);
};

// Method to generate Access Token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      role: this.role
    },
    process.env.ACCESS_TOKEN_SECRET || "ACCESS_TOKEN_SECRET_DEFAULT",
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d"
    }
  );
};

// Method to generate Refresh Token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id
    },
    process.env.REFRESH_TOKEN_SECRET || "REFRESH_TOKEN_SECRET_DEFAULT",
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "10d"
    }
  );
};

userSchema.plugin(mongooseAggregatePaginate);

export const User = mongoose.model("User", userSchema);
export default User;
