import mongoose, { Schema, model, models } from 'mongoose';

const MenuItemSchema = new Schema({
  cafeteriaId: {
    type: Schema.Types.ObjectId,
    ref: 'Cafeteria',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Please provide a menu item name.'],
  },
  description: {
    type: String,
  },
  price: {
    type: Number,
    required: [true, 'Please provide a price.'],
  },
  category: {
    type: String,
    required: [true, 'Please provide a category.'],
  },
  imageUrl: {
    type: String,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

export default models.MenuItem || model('MenuItem', MenuItemSchema);
