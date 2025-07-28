const emailTemplate = (fullName, otpCode) => `
<body>
    <div style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; color: #333;">
        <div style="max-width: 600px; margin: 20px auto; padding: 20px; background-color: #fff; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
            <h2 style="color: #007bff;">OTP Verification</h2>
            <p>Hello <strong>${fullName}</strong>,</p>
            <p>Here is your One-Time Password (OTP) for authentication:</p>
            <p style="font-size: 24px; font-weight: bold; color: #007bff;">${otpCode}</p>
            <p>Please use this code to complete your login or transaction.</p>
            <p>Thank you,<br />Second Shot</p>
            <p>If you did not request this, you can safely ignore this email.</p>
        </div>
    </div>
</body>
`;

export default emailTemplate;
