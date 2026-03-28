import mongoose, { Schema, model, models } from 'mongoose';

const OrderItemSchema = new Schema({
  menuItemId: {
    type: Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
});

const OrderSchema = new Schema({
  cafeteriaId: {
    type: Schema.Types.ObjectId,
    ref: 'Cafeteria',
    required: true,
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  items: [OrderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
  },
  timeSlot: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'preparing', 'ready', 'cancelled'],
    default: 'pending',
  },
  paymentScreenshotUrl: {
    type: String,
  },
  paymentName: {
    type: String,
  },
  hiddenFromCustomer: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

export default models.Order || model('Order', OrderSchema);
