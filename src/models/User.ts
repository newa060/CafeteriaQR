import { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name.'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email.'],
    unique: true,
    lowercase: true,
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'customer'],
    default: 'customer',
  },
  cafeteriaId: {
    type: Schema.Types.ObjectId,
    ref: 'Cafeteria',
    required: function(this: { role: string }) {
      return this.role === 'admin';
    },
  },
  faculty: {
    type: String,
  },
}, { timestamps: true });

export default models.User || model('User', UserSchema);
