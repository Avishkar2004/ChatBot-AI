import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    // Password reset. Only the hash of the emailed token is stored, so a leaked
    // database dump cannot be used to take over accounts.
    resetTokenHash: {
      type: String,
      default: null,
      index: true,
    },
    resetTokenExpiresAt: {
      type: Date,
      default: null,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// NOTE: there used to be a compound `{ email: 1, username: 1 }` unique index
// here. It was strictly weaker than the per-field unique indexes above (it only
// rejected an exact pair collision) and made the duplicate-signup path look
// like it worked when it did not. The per-field `unique: true` declarations are
// the real constraint. Existing databases keep the old compound index until it
// is dropped manually; it is harmless, just redundant.

const User = mongoose.model("User", userSchema);

export default User;
