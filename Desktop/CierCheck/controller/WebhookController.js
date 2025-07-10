// const crypto = require('crypto');
// const stripe = require('../config/StripeConfig.js');

// const stripeWebhook = async (req, res) => {
//     const sig = req.headers['stripe-signature'];
//     let event;
//     try {
//         event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_TEST_WEBHOOK_KEY);
//     } catch (err) {
//         console.log(`Webhook Error: ${err.message}`);
//         return res.status(400).send(`Webhook Error: ${err.message}`);
//     }

//     switch (event.type) {
//         case 'balance.available':
//             console.log(`${event.type} Event Recviced`);
//             break;
//         case 'account.updated':
//             console.log(`${event.type} Event Recviced`);
//             break;
//         case 'capability.updated':
//             console.log(`${event.type} Event Recviced`);
//             break;
//         case 'account.external_account.created':
//             console.log(`${event.type} Event Recviced`);
//             break;
//         case 'account.external_account.created':
//             console.log(`${event.type} Event Recviced`);
//             break;
//         case 'account.external_account.deleted':
//             console.log(`${event.type} Event Recviced`);
//             break;
//         case 'account.external_account.updated':
//             console.log(`${event.type} Event Recviced`);
//             break;
//         case 'payment_method.attached':
//             console.log(`${event.type} Event Recviced`);
//             break;
//         case 'payment_method.updated':
//             console.log(`${event.type} Event Recviced`);
//             break;
//         case 'payment_method.automatically_updated':
//             break;
//         case 'invoice.created':
//             console.log(`${event.type} Event Recviced`);
//             break;
//         case 'invoice.paid':
//             console.log(`${event.type} Event Recviced`);
//             break;
//         case 'invoice.payment_failed':
//             console.log(`${event.type} Event Recviced`);
//             break;
//         case 'invoice.payment_succeeded':
//             console.log(`${event.type} Event Recviced`);
//             break;
//         case 'invoice.upcoming':
//             console.log(`${event.type} Event Recviced`);
//             break;
//         case 'customer.subscription.deleted':
//             console.log(`${event.type} Event Recviced`);
//             break;
//         case 'payout.canceled':
//             console.log(`${event.type} Event Recviced`);
//             break;
//         case 'payout.created':
//             console.log(`${event.type} Event Recviced`);
//             break;
//         case 'payout.failed':
//             console.log(`${event.type} Event Recviced`);
//             break;
//         case 'payout.paid':
//             console.log(`${event.type} Event Recviced`);
//             break;
//         case 'payout.reconciliation_completed':
//             console.log(`${event.type} Event Recviced`);
//             break;
//         case 'payout.updated':
//             console.log(`${event.type} Event Recviced`);
//             break;
//         case 'payment_intent.succeeded':
//             console.log(`${event.type} Event Recviced`);
//             break;

//         default:
//             console.log(`Unhandled event type ${event.type}`);
//     }

//     return res.status(200).send(`Stripe Webhook SuccessFull`);
// };

// const stripeWebhookMain = async (req, res) => {
//     const sig = req.headers['stripe-signature'];
//     let event;
//     try {
//         event = stripe.webhooks.constructEvent(
//             req.body,
//             sig,
//             process.env.STRIPE_TEST_WEBHOOK_KEY_MAIN,
//         );
//     } catch (err) {
//         console.log(`Webhook Error: ${err.message}`);
//         return res.status(400).send(`Webhook Error: ${err.message}`);
//     }

//     switch (event.type) {
//         case 'payment_intent.succeeded':
//             console.log(`${event.type} Event Recviced`);
//             break;
//         case 'payment_intent.payment_failed':
//             console.log(`${event.type} Event Recviced`);
//             break;
//         default:
//             console.log(`Unhandled event type ${event.type}`);
//     }

//     return res.status(200).send(`Stripe Webhook SuccessFull`);
// };

// const pandadocWebhook = async (req, res) => {
//     try {
//         const signature = req.query.signature;
//         const expectedSignature = crypto
//             .createHmac('sha256', process.env.PANDA_DOC_TEST_WEBHOOK_SECRET)
//             .update(req.body)
//             .digest('hex');

//         if (signature !== expectedSignature) {
//             console.error('Invalid signature:', signature);
//             return res.status(401).json({ success: false, message: 'Unauthorized' });
//         }

//         const [parsedBody] = JSON.parse(req.body.toString('utf8'));
//         console.log('PandaDoc Webhook Body:', parsedBody);

//         const { event, data } = parsedBody;

//         switch (event) {
//             case 'document_state_changed':
//                 console.log(`IN document_state_changed EVENT`);
//                 break;

//             case 'document_sent':
//                 console.log(`IN document_sent EVENT`);
//                 break;

//             case 'document_completed':
//                 console.log(`IN document_completed EVENT`);
//                 break;

//             case 'recipient_completed':
//                 console.log(`IN recipient_completed EVENT`);
//                 break;

//             case 'document_completed_pdf_ready':
//                 console.log(`IN document_completed_pdf_ready EVENT`);
//                 break;

//             default:
//                 console.log(`Unhandled event: ${event}`);
//         }

//         return res.status(200).json({
//             success: true,
//             message: `Webhook processed for event: ${event}`,
//         });
//     } catch (error) {
//         console.error('Error handling webhook:', error.message);
//         return res.status(500).json({ success: false, message: 'Internal server error' });
//     }
// };

// const veriffWebhook = async (req, res) => {
//     try {
//         const jsonData = JSON.parse(req.body.toString());
//         console.log('Webhook JSON Data:', jsonData);

//         res.status(200).json({ success: true });
//     } catch (error) {
//         console.error('Veriff Webhook Error:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// };

// module.exports = {
//     stripeWebhook,
//     pandadocWebhook,
//     stripeWebhookMain,
//     veriffWebhook,
// };
