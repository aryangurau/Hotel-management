const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderNo: {
      type: String,
      unique: true,
      required: true,
      default: () => Math.random().toString(36).substring(2, 15).toUpperCase()
    },
    number: { // Keep for backward compatibility
      type: String,
      unique: true,
      sparse: true // Allow null/undefined values
    },
    receiver: {
      type: String,
      required: true,
      trim: true,
      default: 'Guest'
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ["unpaid", "confirmed", "cancelled", "completed"],
      default: "unpaid"
    },
    arrivalDate: {
      type: Date,
      required: true
    },
    departureDate: {
      type: Date,
      required: true
    },
    updated_by: {
      type: String,
      required: true,
      index: true
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    paymentMethod: {
      type: String,
      enum: ["esewa", "khalti", "bank_transfer", "cash"],
      required: true
    },
    paymentDetails: {
      status: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending"
      },
      paidAt: Date,
      transactionId: String,
      refundedAt: Date,
      refundTransactionId: String
    }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    },
    autoIndex: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Create indexes
orderSchema.index({ orderNo: 1 });
orderSchema.index({ number: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ created_at: -1 });

// Add virtual for formatted dates
orderSchema.virtual('formattedArrivalDate').get(function() {
  return this.arrivalDate ? this.arrivalDate.toLocaleDateString() : '';
});

orderSchema.virtual('formattedDepartureDate').get(function() {
  return this.departureDate ? this.departureDate.toLocaleDateString() : '';
});

// Pre-save middleware to ensure dates are valid and set payment date
orderSchema.pre('save', function(next) {
  if (this.arrivalDate >= this.departureDate) {
    next(new Error('Departure date must be after arrival date'));
  }
  
  // Set payment date if status is changing to confirmed
  if (this.isModified('status') && this.status === 'confirmed' && !this.paymentDetails.paidAt) {
    this.paymentDetails.paidAt = new Date();
  }
  
  // Copy orderNo to number if number is not set
  if (!this.number && this.orderNo) {
    this.number = this.orderNo;
  }
  next();
});

const Order = mongoose.model("Order", orderSchema);

// Ensure indexes are created
Order.createIndexes().then(() => {
  console.log('Order indexes created successfully');
}).catch(err => {
  console.error('Error creating order indexes:', err);
});

module.exports = Order;
