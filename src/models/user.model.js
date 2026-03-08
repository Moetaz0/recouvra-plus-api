import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			minlength: 2,
			maxlength: 100,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
			match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
		},
		password: {
			type: String,
			required: true,
			minlength: 6,
			select: false,
		},
		role: {
			type: String,
			enum: ["agent", "admin" ,"manager" ],
			default: "agent",
		},
	},
	{
		timestamps: true,
	}
);

userSchema.pre("save", async function () {
	if (!this.isModified("password")) return;

	const saltRounds = 10;
	this.password = await bcrypt.hash(this.password, saltRounds);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
	return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
