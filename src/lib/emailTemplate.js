export const welcomeUserTemplate = (
  name,
  verificationCode,
  password
) => `  <!DOCTYPE html>
  <html>
  <head>
      <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color:rgb(255, 140, 0); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .button {
              display: inline-block;
              padding: 10px 20px;
              background-color:rgb(255, 140, 0);
              color: white;
              text-decoration: none;
              border-radius: 4px;
              margin: 15px 0;
          }
          .footer { 
              margin-top: 20px;
              font-size: 12px;
              color: #777;
              text-align: center;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <h1>Welcome to Worknest</h1>
          </div>
          <div class="content">
              <p>Hello ${name},</p>
              <p>Thank you for registering with us. To get started, please verify your account with the code below.</p>
              ${
                password
                  ? `<p style="font-weight: bold; font-size: 20px; color:rgb(0, 0, 0);">Your password is ${password}. Please update your password in the settings as soon as possible.</p>`
                  : ""
              }
              <p style="font-weight: bold; font-size: 20px; color:rgb(0, 0, 0);">${verificationCode}</p>
              <p>This code will expire in 1 hour.</p> 
              <p>Do not share this code with anyone.</p>    
          </div>
          <div class="footer">
              <p>© ${new Date().getFullYear()} Worknest - Job search center. All rights reserved.</p>
          </div>
      </div>
  </body>
  </html>`;

  
export const resendVerificationTemplate = (name, verificationCode) => `
  <!DOCTYPE html>
  <html>
  <head>
      <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color:rgb(255, 140, 0); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .button {
              display: inline-block;
              padding: 10px 20px;
              background-color:rgb(255, 140, 0);
              color: white;
              text-decoration: none;
              border-radius: 4px;
              margin: 15px 0;
          }
          .footer { 
              margin-top: 20px;
              font-size: 12px;
              color: #777;
              text-align: center;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <h1>Verification Code</h1>
          </div>
          <div class="content">
              <p>Hello ${name},</p>
              <p>You requested a new verification code. Use the code below to verify your account:</p>
              <p style="font-weight: bold; font-size: 20px; color:rgb(0, 0, 0);">${verificationCode}</p>
              <p>This code will expire in 1 hour.</p> 
              <p>Do not share this code with anyone.</p>    
          </div>
          <div class="footer">
              <p>© ${new Date().getFullYear()} Worknest - Job search center. All rights reserved.</p>
          </div>
      </div>
  </body>
  </html>
  `;

  
export const passwordResetTemplate = (name, resetToken) => `
  <!DOCTYPE html>
  <html>
  <head>
      <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color:rgb(255, 140, 0); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .button {
              display: inline-block;
              padding: 10px 20px;
              background-color:rgb(255, 140, 0);
              color: white;
              text-decoration: none;
              border-radius: 4px;
              margin: 15px 0;
          }
          .footer { 
              margin-top: 20px;
              font-size: 12px;
              color: #777;
              text-align: center;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <h1>Reset Password</h1>
          </div>
          <div class="content">
              <p>Hello ${name},</p>
              <p>Use the reset code below to reset your password:</p>
              <p style="font-weight: bold; font-size: 20px; color:rgb(0, 0, 0);">${resetToken}</p>
              <p>Submit this code with your email and new password in the reset form.</p>
              <p>Do not share this code with anyone.</p>
              <p>This code will expire in 15 minutes.</p>  
              <p>If you did not request a password reset, please ignore this email.</p>   
          </div>
          <div class="footer">
              <p>© ${new Date().getFullYear()} Worknest - Job search center. All rights reserved.</p>
          </div>
      </div>
  </body>
  </html>
  `;

