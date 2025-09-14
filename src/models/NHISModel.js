import mongoose from "mongoose";
import bcrypt from "bcrypt"
import validator from "validator"

const NHISSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        trim: true
    },
    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        validate: {
          validator: validator.isEmail,
          message: "Invalid email address"
        }
    },
    password:{
        type: String,
        required: true
    },
    approvals:[
        {
            id: {type: mongoose.Schema.Types.ObjectId, ref: "Doctor"},
            name: {type: String},
            email: {type: String},
            spec: {type: String},
            officer: {
                id: {type: String},
                name: {type: String},
                email: {type: String}
            } 
        }
    ]
}, {timestamps: true});

NHISSchema.pre("save", async function (next) {
    if(!this.isModified("password")){
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
})

NHISSchema.statics.login = async function(email, password) {
    const patient = await this.findOne({ email });
    if (!patient) {
      throw new Error("Invalid email");
    }
    const match = await bcrypt.compare(password, patient.password);
    if (!match) {
      throw new Error("Invalid password");
    }
    return patient;
  };

  
const NHIS = mongoose.model("NHIS", NHISSchema);
export default NHIS;