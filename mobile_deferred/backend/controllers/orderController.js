import Order from "../../../backend/src/models/order.js";
import Product from "../../../backend/src/models/product.js";
import Service from "../../../backend/src/models/service.js";
import User from "../../../backend/src/models/user.js";
import catchAsyncErrors from "../../../backend/src/middlewares/catchAsyncErrors.js";
import ErrorHandler from "../../../backend/src/utils/ErrorHandler.js";

// Get all orders (with filters - PUBLIC)
const getAllOrders = catchAsyncErrors(async (req, res) => {
  const { type, status, page = 1, limit = 10 } = req.query;
  
  let filter = {};
  
  // Filter by user role (buyer or seller) - no auth required
  if (type === 'buyer' && req.params.buyerId) {
    filter.buyer = req.params.buyerId;
  } else if (type === 'seller' && req.params.sellerId) {
    filter.seller = req.params.sellerId;
  }
  
  // Filter by status
  if (status) {
    filter.status = status;
  }

  const orders = await Order.find(filter)
    .populate('buyer', 'name profilePicture unitNumber')
    .populate('seller', 'name profilePicture unitNumber')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Order.countDocuments(filter);

  res.json({
    orders,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    total
  });
});

// Get order by ID (PUBLIC)
const getOrderById = catchAsyncErrors(async (req, res) => {
  res.json(res.order);
});

// Create a new order (PROTECTED)
const createOrder = catchAsyncErrors(async (req, res) => {
    const {
      items,
      // REMOVED: sellerId, sellerName from destructuring
      shippingAddress,
      contactNumber,
      specialInstructions,
      paymentMethod = "CASH"
    } = req.body;
  
    const buyerId = req.user.id;
    const buyerName = req.user.name;
  
    // Validate items and calculate totals
    let subtotal = 0;
    let serviceFee = 0;
    let sellerId = null;
    let sellerName = null;
  
    // Process each item to validate and calculate prices
    const processedItems = await Promise.all(
      items.map(async (item) => {
        const { itemType, itemId, quantity } = item;
        
        if (itemType === "PRODUCT") {
          const product = await Product.findById(itemId).populate('sellerId', 'name');
          if (!product) {
            throw new ErrorHandler(`Product with ID ${itemId} not found`, 404);
          }
          if (product.status !== "AVAILABLE") {
            throw new ErrorHandler(`Product ${product.title} is not available`, 400);
          }
  
          // Set seller from the first product
          if (!sellerId) {
            sellerId = product.sellerId._id;
            sellerName = product.sellerId.name;
          }
  
          // Verify all items are from the same seller
          if (product.sellerId._id.toString() !== sellerId.toString()) {
            throw new ErrorHandler(`Product ${product.title} does not belong to the same seller`, 400);
          }
  
          subtotal += product.price * quantity;
  
          return {
            itemType: "PRODUCT",
            product: itemId,
            itemTitle: product.title,
            price: product.price,
            quantity,
            images: product.images,
          };
        } else if (itemType === "SERVICE") {
          const service = await Service.findById(itemId).populate('provider', 'name');
          if (!service) {
            throw new ErrorHandler(`Service with ID ${itemId} not found`, 404);
          }
          if (service.status !== "AVAILABLE") {
            throw new ErrorHandler(`Service ${service.title} is not available`, 400);
          }
  
          // Set seller from the first service
          if (!sellerId) {
            sellerId = service.provider._id;
            sellerName = service.provider.name;
          }
  
          // Verify all items are from the same seller
          if (service.provider._id.toString() !== sellerId.toString()) {
            throw new ErrorHandler(`Service ${service.title} does not belong to the same seller`, 400);
          }
  
          serviceFee += service.price * quantity;
  
          return {
            itemType: "SERVICE",
            service: itemId,
            itemTitle: service.title,
            price: service.price,
            quantity,
            images: service.images,
            serviceType: service.serviceType,
            scheduledDate: item.scheduledDate,
          };
        } else {
          throw new ErrorHandler("Invalid item type", 400);
        }
      })
    );
  
    if (!sellerId) {
      throw new ErrorHandler("No valid items found in order", 400);
    }
  
    const totalAmount = subtotal + serviceFee;
  
    // Create the order
    const order = new Order({
      buyer: buyerId,
      buyerName,
      seller: sellerId,
      sellerName,
      items: processedItems,
      subtotal,
      serviceFee,
      totalAmount,
      paymentMethod,
      shippingAddress: shippingAddress || null,
      contactNumber,
      specialInstructions,
    });
  
    const newOrder = await order.save();
    
    // Update product/service statuses to RESERVED
    await Promise.all(
      processedItems.map(async (item) => {
        if (item.itemType === "PRODUCT") {
          await Product.findByIdAndUpdate(item.product, { status: "RESERVED" });
        } else if (item.itemType === "SERVICE") {
          await Service.findByIdAndUpdate(item.service, { status: "RESERVED" });
        }
      })
    );
  
    // Populate the order for response
    await newOrder.populate('buyer', 'name profilePicture unitNumber');
    await newOrder.populate('seller', 'name profilePicture unitNumber');
  
    res.status(201).json(newOrder);
  });

// Update order status (PROTECTED)
const updateOrderStatus = catchAsyncErrors(async (req, res) => {
  const { status, cancellationReason } = req.body;

  if (status != null) res.order.status = status;
  if (cancellationReason != null) res.order.cancellationReason = cancellationReason;

  const updatedOrder = await res.order.save();

  // Handle status-specific logic
  if (status === "DELIVERED" || status === "COMPLETED") {
    await handleCompletedOrder(updatedOrder);
  } else if (status === "CANCELLED") {
    await handleCancelledOrder(updatedOrder);
  }

  await updatedOrder.populate('buyer', 'name profilePicture unitNumber');
  await updatedOrder.populate('seller', 'name profilePicture unitNumber');

  res.json(updatedOrder);
});

// Update payment status (PROTECTED)
const updatePaymentStatus = catchAsyncErrors(async (req, res) => {
  const { paymentStatus } = req.body;

  if (paymentStatus != null) res.order.paymentStatus = paymentStatus;

  const updatedOrder = await res.order.save();
  
  // If payment is completed, update order status to CONFIRMED
  if (paymentStatus === "PAID" && res.order.status === "PENDING") {
    res.order.status = "CONFIRMED";
    await res.order.save();
  }

  await updatedOrder.populate('buyer', 'name profilePicture unitNumber');
  await updatedOrder.populate('seller', 'name profilePicture unitNumber');

  res.json(updatedOrder);
});

// Delete an order (PROTECTED)
const deleteOrder = catchAsyncErrors(async (req, res) => {
  await res.order.deleteOne();
  res.json({ message: "Order deleted" });
});

// Get orders by buyer (PUBLIC)
const getBuyerOrders = catchAsyncErrors(async (req, res) => {
  const buyerId = req.params.buyerId;
  const orders = await Order.find({ buyer: buyerId })
    .populate('seller', 'name profilePicture unitNumber')
    .sort({ createdAt: -1 });
  res.status(200).json(orders);
});

// Get orders by seller (PUBLIC)
const getSellerOrders = catchAsyncErrors(async (req, res) => {
  const sellerId = req.params.sellerId;
  const orders = await Order.find({ seller: sellerId })
    .populate('buyer', 'name profilePicture unitNumber')
    .sort({ createdAt: -1 });
  res.status(200).json(orders);
});

// Get seller order statistics (PROTECTED)
const getSellerOrderStats = catchAsyncErrors(async (req, res) => {
  const sellerId = req.user.id;

  const stats = await Order.aggregate([
    { $match: { seller: sellerId } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: "$totalAmount" },
        pendingOrders: {
          $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] }
        },
        completedOrders: {
          $sum: {
            $cond: [
              { $in: ["$status", ["DELIVERED", "COMPLETED"]] },
              1,
              0
            ]
          }
        },
      }
    }
  ]);

  const defaultStats = {
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
  };

  res.json(stats[0] || defaultStats);
});

// Middleware to fetch order by ID (PUBLIC)
const getOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('buyer', 'name profilePicture unitNumber')
    .populate('seller', 'name profilePicture unitNumber');

  if (order == null) {
    return next(new ErrorHandler("Order not found", 404));
  }

  res.order = order;
  next();
});

// Helper function to handle completed orders
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

  // Update seller stats
  if (totalItemsSold > 0) {
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

// Helper function to handle cancelled orders
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
};

export {
  getOrder,
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  updatePaymentStatus,
  deleteOrder,
  getBuyerOrders,
  getSellerOrders,
  getSellerOrderStats,
};
