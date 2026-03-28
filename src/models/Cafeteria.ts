import mongoose, { Schema, model, models } from 'mongoose';

const CafeteriaSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name.'],
  },
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  paymentQRUrl: {
    type: String,
  },
  timeSlots: {
    type: [String],
    default: ["10:15", "11:30", "12:45", "14:00"],
  },
  canteenCode: {
    type: String,
    unique: true,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

export default models.Cafeteria || model('Cafeteria', CafeteriaSchema);
