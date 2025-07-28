import stripe from "../../../configs/stripe.js";

export const createPriceId = async (product_id, price) => {
  const amountInCents = Math.round(price * 100); // Convert price to cents

  const newPrice = await stripe.prices.create({
    product: product_id,
    unit_amount: amountInCents, // Amount in cents
    currency: "usd",
    recurring: { interval: 'month', interval_count: 3 }, 
  });

  return newPrice;
};
