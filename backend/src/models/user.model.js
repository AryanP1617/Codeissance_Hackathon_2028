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
        type: String
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
userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }

});

// Method to verify candidate password match
userSchema.methods.isPasswordCorrect = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    throw new Error(`Password verification failed: ${error.message}`);
  }
};

// Method to verify candidate refresh token match
userSchema.methods.isRefreshTokenCorrect = async function (refreshToken) {
  try {
    if (!this.refreshToken) return false;
    return await bcrypt.compare(refreshToken, this.refreshToken);
  } catch (error) {
    throw new Error(`Refresh token verification failed: ${error.message}`);
  }
};

// Method to generate JWT Access Token
userSchema.methods.generateAccessToken = function () {
  try {
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
  } catch (error) {
    throw new Error(`Access token generation failed: ${error.message}`);
  }
};

// Method to generate JWT Refresh Token
userSchema.methods.generateRefreshToken = function () {
  try {
    return jwt.sign(
      {
        _id: this._id
      },
      process.env.REFRESH_TOKEN_SECRET || "REFRESH_TOKEN_SECRET_DEFAULT",
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "10d"
      }
    );
  } catch (error) {
    throw new Error(`Refresh token generation failed: ${error.message}`);
  }
};

userSchema.plugin(mongooseAggregatePaginate);

export const User = mongoose.model("User", userSchema);
export default User;
