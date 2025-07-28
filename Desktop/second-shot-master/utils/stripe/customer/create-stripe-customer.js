import stripe from "../../../configs/stripe.js";

const createStripeCustomer = async (email) => {

  //Create customer in stripe
  const customer = await stripe.customers.create({
    email: email,
  });

  return customer.id;
};

export {createStripeCustomer};
