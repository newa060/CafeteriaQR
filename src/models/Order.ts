import { Schema, model, models } from 'mongoose';

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
  cookedQuantity: {
    type: Number,
    default: 0,
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

// TTL index to automatically remove the order after 24 hours (86400 seconds)
OrderSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

// In development, Next.js hot-reloading can cause models to be re-compiled multiple times
// with old schemas. We delete the existing model if it exists to force a refresh.
if (models && models.Order) {
  delete (models as any).Order;
}

export default model('Order', OrderSchema);
