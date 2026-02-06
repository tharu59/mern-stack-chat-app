const mongoose = require("mongoose");

const groupSchema = mongoose.Schema(
  {
    chatName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // latestMessage: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Chat",
    // },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Group = mongoose.model("Group", groupSchema);

module.exports = Group;
