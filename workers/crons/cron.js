import cron from 'node-cron';
import { sendGoalReminder } from './sendGoalReminder.js';
import { sendMissedDeadlineNotification } from './sendMissedDeadline.js';

 cron.schedule('* * * * *', async () => {
   console.log('Running a task every minute');
   await sendGoalReminder();
   await sendMissedDeadlineNotification()
   });

   