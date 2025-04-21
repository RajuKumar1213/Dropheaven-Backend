import axios from 'axios';

const API_KEY =
  'SRHLnsM05vPoijXNaeZxGYDz3KWfCUE9kAIFO16gqVuBpmT47bZ8zeLGD6UqIsMPxO27RcfrdBKyWNAX';
const fast2smsURL = 'https://www.fast2sms.com/dev/bulkV2';

const sendOtp = async (number) => {
  if (!number) {
    throw new Error('Phone number is required to send OTP.');
  }

  const otp = Math.floor(100000 + Math.random() * 900000);

  try {
    const response = await axios.post(
      fast2smsURL,
      {
        variables_values: otp.toString(),
        route: 'otp',
        numbers: number.toString(),
        sender_id: 'FSTSMS', // optional but safe to include
      },
      {
        headers: {
          authorization: API_KEY,
          'Content-Type': 'application/json', // IMPORTANT!
        },
      }
    );

    if (response.data.return) {
      console.log('OTP sent successfully:', response.data);
      return otp;
    } else {
      console.error('Fast2SMS error:', response.data);
      throw new Error('OTP failed to send.');
    }
  } catch (error) {
    console.error('Error sending OTP:', error.response?.data || error.message);
    throw new Error('Failed to send OTP. Please try again later.');
  }
};

export { sendOtp };
