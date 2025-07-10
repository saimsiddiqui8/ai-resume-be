// const express = require('express');
// const router = express.Router();

// const ProtectRouteMiddleware = require('../middlewares/ProtectRouteMiddleware');
// const RestrictRouteToMiddleware = require('../middlewares/RestrictRouteToMiddleware');

// const {
//     createNotification,
//     sendNotification,
//     getUserNotifications,
//     readNotification,
//     readAllNotification,
//     deleteNotification,
//     deleteAllNotification,
// } = require('../controller/NotificationController');

// router.post(
//     '',
//     ProtectRouteMiddleware(true),
//     RestrictRouteToMiddleware('admin'),
//     createNotification,
// );
// router.post('/send', ProtectRouteMiddleware(true), sendNotification);
// router.get('', ProtectRouteMiddleware(true), getUserNotifications);
// router.post('/read', ProtectRouteMiddleware(true), readNotification);
// router.post('/all', ProtectRouteMiddleware(true), readAllNotification);
// router.delete('/all', ProtectRouteMiddleware(true), deleteAllNotification);
// router.delete('/:notificationId', ProtectRouteMiddleware(true), deleteNotification);

// module.exports = router;
