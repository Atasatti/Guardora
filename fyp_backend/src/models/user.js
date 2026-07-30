import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const MODERATOR_PERMISSIONS = [
  "MANAGE_USERS",
  "MANAGE_SURVEILLANCE",
  "MANAGE_VISITORS",
  "MANAGE_ALERTS",
  "MANAGE_CONTENT",
  "MANAGE_MAINTENANCE",
  "MANAGE_BILLING",
  "MANAGE_FACILITIES",
  "MANAGE_MAP",
  "MANAGE_ADS",
];

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
      enum: ["RESIDENT", "ADMIN", "MODERATOR"],
      default: "RESIDENT",
      required: true,
    },
    permissions: {
      type: [
        {
          type: String,
          enum: MODERATOR_PERMISSIONS,
        },
      ],
      default: [],
    },
    accountStatus: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED", "DEACTIVATED"],
      default: "ACTIVE",
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    activationCodeHash: {
      type: String,
      default: null,
      select: false,
    },
    activationExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockUntil: {
      type: Date,
      default: null,
      select: false,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    facilityRestrictionUntil: {
      type: Date,
      default: null,
    },
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    householdProfiles: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
          maxlength: 100,
        },
        relationship: {
          type: String,
          enum: [
            "SELF",
            "SPOUSE",
            "CHILD",
            "PARENT",
            "SIBLING",
            "OTHER",
          ],
          default: "OTHER",
        },
        dateOfBirth: {
          type: Date,
          default: null,
        },
        avatar: {
          type: String,
          default: null,
        },
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],
    activeHouseholdProfile: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    notificationPreferences: {
      messages: { type: Boolean, default: true },
      announcements: { type: Boolean, default: true },
      emergencies: { type: Boolean, default: true },
      maintenance: { type: Boolean, default: true },
      billing: { type: Boolean, default: true },
    },
    privacySettings: {
      profileVisibility: {
        type: String,
        enum: ["RESIDENTS", "FRIENDS", "PRIVATE"],
        default: "RESIDENTS",
      },
      messagePermission: {
        type: String,
        enum: ["EVERYONE", "FRIENDS", "NONE"],
        default: "EVERYONE",
      },
      discoverable: { type: Boolean, default: true },
      showEmail: { type: Boolean, default: false },
      showPhone: { type: Boolean, default: false },
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
userSchema.index({ role: 1, accountStatus: 1 });
userSchema.index(
  { activationExpiresAt: 1 },
  {
    expireAfterSeconds: 24 * 60 * 60,
    partialFilterExpression: { isVerified: false },
  }
);

const User = mongoose.model("User", userSchema);

export default User;
