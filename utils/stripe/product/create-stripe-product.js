import stripe from "../../../configs/stripe.js";


const createStripeProduct = async (product_name, product_id) => {
  const product = await stripe.products.create({
    name: product_name,
    id: product_id
  });

  return product;
};

export {createStripeProduct}
