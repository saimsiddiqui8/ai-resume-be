import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendGoalSupportEmails = async (supportPeople, user, goalName, deadline, status) => {
  if (!supportPeople || supportPeople.length === 0) return;

  try {
    const emailPromises = supportPeople.map((person) => {

        const subject = status === "completed" 
        ? `${user.name} Achieved Their Goal! 🎉`
        : `${user.name} Has Set a New Goal!`;

        const text = status === "completed"
        ? `${user.name} has successfully completed: "${goalName}"!. Send them a congratulatory message.! 🎉\n\nSecond Shot Team`
        : `${user.name} has created a new goal: "${goalName}"  and added you as a supporter.Stay connected and cheer them on!\n\n\n\nSecond Shot Team`;


      const msg = {
        to: person.email_address,
        from: {
          email: process.env.SENDGRID_SENDER,
          name: "Second Shot",
        },
        subject,
        text,
      };

      return sgMail.send(msg);
    });

    await Promise.all(emailPromises);
    console.log("Emails sent successfully to all support people.");
  } catch (error) {
    console.error("Failed to send emails to support people:", error);
  }
};

export {sendGoalSupportEmails}