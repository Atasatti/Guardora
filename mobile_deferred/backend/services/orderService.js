import Order from "../../../backend/src/models/order.js";
import Product from "../../../backend/src/models/product.js";
import Service from "../../../backend/src/models/service.js";
import User from "../../../backend/src/models/user.js";

/**
 * Service layer for order operations
 * Maintains all business logic without changing API contracts
 */

// Update order status with all business logic
export const updateOrderStatus = async (orderId, newStatus, options = {}) => {
  const { cancellationReason, paymentStatus } = options;
  
  const order = await Order.findById(orderId)
    .populate('buyer', 'name profilePicture unitNumber')
    .populate('seller', 'name profilePicture unitNumber');

  if (!order) {
    throw new Error("Order not found");
  }

  // Update order fields
  if (newStatus !== undefined) order.status = newStatus;
  if (cancellationReason !== undefined) order.cancellationReason = cancellationReason;
  if (paymentStatus !== undefined) order.paymentStatus = paymentStatus;

  const updatedOrder = await order.save();

  // Handle status-specific business logic
  if (newStatus === "DELIVERED" || newStatus === "COMPLETED") {
    await handleCompletedOrder(updatedOrder);
  } else if (newStatus === "CANCELLED") {
    await handleCancelledOrder(updatedOrder);
  }

  // If payment is completed and order was pending, confirm order
  if (paymentStatus === "PAID" && order.status === "PENDING") {
    order.status = "CONFIRMED";
    await order.save();
  }

  return updatedOrder;
};

// Confirm payment and update order status
export const confirmOrderPayment = async (orderId) => {
  const order = await Order.findById(orderId);
  
  if (!order) {
    throw new Error("Order not found");
  }

  // Update payment status
  order.paymentStatus = "PAID";
  
  // If order was PENDING and payment is completed, move to CONFIRMED
  if (order.status === "PENDING") {
    order.status = "CONFIRMED";
  }

  order.updatedAt = new Date();
  await order.save();

  // Update seller stats for paid orders
  await updateSellerStats(order);

  // Populate the order for response
  await order.populate('buyer', 'name profilePicture unitNumber');
  await order.populate('seller', 'name profilePicture unitNumber');

  return order;
};

// Update seller statistics - FIXED to match your schema
const updateSellerStats = async (order) => {
  let totalItemsSold = 0;

  // Count sold products from this order
  for (const item of order.items) {
    if (item.itemType === "PRODUCT") {
      totalItemsSold += item.quantity;
    }
  }

  // Update seller stats only if there are sold items
  if (totalItemsSold > 0) {
    await User.findByIdAndUpdate(
      order.seller,
      {
        $inc: {
          "sellerStats.itemsSold": totalItemsSold
          // Note: Removed totalRevenue since it doesn't exist in your schema
          // You might want to add this field to your user schema if needed
        }
      }
    );
  }
};

// Handle completed order logic - FIXED product reference
const handleCompletedOrder = async (order) => {
  let totalItemsSold = 0;

  // Update product/service statuses and count sold items
  await Promise.all(
    order.items.map(async (item) => {
      if (item.itemType === "PRODUCT") {
        await Product.findByIdAndUpdate(item.product, { status: "SOLD" });
        totalItemsSold += item.quantity;
      } else if (item.itemType === "SERVICE") {
        await Service.findByIdAndUpdate(item.service, { status: "COMPLETED" });
      }
    })
  );

  // Update seller stats for completed orders that are paid
  // Only update if payment was successful (stats already updated in confirmOrderPayment)
  // This prevents double-counting
  if (totalItemsSold > 0 && order.paymentStatus !== "PAID") {
    await User.findByIdAndUpdate(
      order.seller,
      {
        $inc: {
          "sellerStats.itemsSold": totalItemsSold
        }
      }
    );
  }
};

// Handle cancelled order logic
const handleCancelledOrder = async (order) => {
  // Return products/services to available status
  await Promise.all(
    order.items.map(async (item) => {
      if (item.itemType === "PRODUCT") {
        await Product.findByIdAndUpdate(item.product, { status: "AVAILABLE" });
      } else if (item.itemType === "SERVICE") {
        await Service.findByIdAndUpdate(item.service, { status: "AVAILABLE" });
      }
    })
  );

  // If order was paid and then cancelled, consider refund logic here
  if (order.paymentStatus === "PAID") {
    // You might want to handle refunds here
    // For now, just update payment status to REFUNDED
    await Order.findByIdAndUpdate(order._id, { 
      paymentStatus: "REFUNDED" 
    });
  }
};

// Bulk confirm payments
export const confirmBulkPayments = async (orderIds) => {
  const orders = await Order.find({ _id: { $in: orderIds } });
  const updatedOrders = [];

  for (const order of orders) {
    const updatedOrder = await confirmOrderPayment(order._id);
    updatedOrders.push(updatedOrder);
  }

  return updatedOrders;
};
