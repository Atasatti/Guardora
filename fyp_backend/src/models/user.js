import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    unitNumber: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    socialStats: {
      totalFollowers: { type: Number, default: 0 },
      totalFollowing: { type: Number, default: 0 },
      followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    },
    sellerStats: {
      totalProducts: { type: Number, default: 0 },
      itemsSold: { type: Number, default: 0 },
    },
    role: {
      type: String,
      enum: ["RESIDENT", "ADMIN", "MODERATOR",],
      default: "RESIDENT",
      required: true,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    emergencyContact: {
      name: {
        type: String,
        default: null,
      },
      phoneNumber: {
        type: String,
        default: null,
      },
      relationship: {
        type: String,
        default: null,
      },
    },
  },
  { timestamps: true }
);

// Password Encryption
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
      return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
  });
  
  userSchema.methods.getJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: process.env.JWT_EXPIRES,
    });
  };
  
  userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  };
  

// Index for faster unit lookups. Email already has an index via `unique: true`.
userSchema.index({ unitNumber: 1 });

const User = mongoose.model("User", userSchema);

export default User;
