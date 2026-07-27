import PaymentCard from "../models/paymentCard.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/ErrorHandler.js";

const getAllCards = catchAsyncErrors(async (req, res) => {
  const cards = await PaymentCard.find();
  res.status(200).json(cards);
});

const getCardById = catchAsyncErrors(async (req, res) => {
  res.json(res.card);
});

const createCard = catchAsyncErrors(async (req, res) => {
  const { name, creditCardNumber, expiryMonth, expiryYear, cvv, brand, color } =
    req.body;

  const card = new PaymentCard({
    name,
    creditCardNumber,
    expiryMonth,
    expiryYear,
    cvv,
    brand,
    color,
  });

  await card.save();
  res.status(201).json(card);
});

const updateCard = catchAsyncErrors(async (req, res) => {
  if (req.body.name != null) {
    res.card.name = req.body.name;
  }
  if (req.body.creditCardNumber != null) {
    res.card.creditCardNumber = req.body.creditCardNumber;
  }
  if (req.body.expiryMonth != null) {
    res.card.expiryMonth = req.body.expiryMonth;
  }
  if (req.body.expiryYear != null) {
    res.card.expiryYear = req.body.expiryYear;
  }
  if (req.body.cvv != null) {
    res.card.cvv = req.body.cvv;
  }
  if (req.body.brand != null) {
    res.card.brand = req.body.brand;
  }
  if (req.body.color != null) {
    res.card.color = req.body.color;
  }

  const updatedCard = await res.card.save();
  res.json(updatedCard);
});

const deleteCard = catchAsyncErrors(async (req, res) => {
  await res.card.deleteOne();
  res.json({ message: "Card deleted" });
});

// Middleware
const getCard = catchAsyncErrors(async (req, res, next) => {
  const card = await PaymentCard.findById(req.params.id);
  if (card == null) {
    return next(new ErrorHandler("Card not found", 404));
  }
  res.card = card;
  next();
});

export {
  getCard,
  getAllCards,
  getCardById,
  createCard,
  updateCard,
  deleteCard,
};
