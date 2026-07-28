import nodemailer from "nodemailer";
import { Order } from "./db";

export async function sendOrderReceivedEmail(order: Order) {
  try {
    if (!order.user || !order.user.email) return;
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log("EMAIL_USER or EMAIL_PASS not set");
      return;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    const dateStr = new Date(order.timestamp || Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'short' });

    const mailOptions = {
      from: `"NOVA X STORE" <${process.env.EMAIL_USER}>`,
      to: order.user.email,
      subject: `Order Received #${order.orderId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
            <h1 style="color: #000; text-align: center;">Order Received</h1>
            <p>Hi there,</p>
            <p>Your payment has been successfully verified!</p>
            <p><strong>Your order is now processing. We will provide the order details in another email in under 3 hours.</strong></p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p><strong>Order ID:</strong> #${order.orderId}</p>
            <p><strong>Product:</strong> ${order.product}</p>
            <p><strong>Amount:</strong> ₹${order.price}</p>
            <p><strong>Date:</strong> ${dateStr}</p>
            <br>
            <p style="text-align: center;"><a href="https://discord.gg/novaxhost" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Join our Discord</a></p>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log("Order Received email sent to", order.user.email);
  } catch (err) {
    console.error("Error sending order received email:", err);
  }
}

export async function sendOrderConfirmation(order: Order) {
  try {
    if (!order.user || !order.user.email) return;
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log("EMAIL_USER or EMAIL_PASS not set");
      return;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    const dateStr = new Date(order.timestamp || Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'short' });

    let paymentMethod = "UPI Transfer";
    if (order.price === 0) paymentMethod = "100% Discount Coupon";
    else if (!order.utr && order.status === "APPROVED") paymentMethod = "Admin Direct Approval";

    let configHtml = '';
    if (order.clientConfig && Object.keys(order.clientConfig).length > 0) {
      configHtml = `
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 30px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px;">
          <tr>
            <th colspan="2" style="padding: 15px; text-align: left; color: #166534; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #bbf7d0;">Configuration Details</th>
          </tr>
      `;
      for (const [key, value] of Object.entries(order.clientConfig)) {
        if (value) {
          configHtml += `
            <tr>
              <td style="padding: 10px 15px; color: #166534; font-size: 14px; text-transform: capitalize;">${key.replace('_', ' ')}</td>
              <td style="padding: 10px 15px; text-align: right; color: #14532d; font-weight: 500; font-size: 14px;">${value}</td>
            </tr>
          `;
        }
      }
      configHtml += `</table>`;
    }

    let deliveryHtml = '';
    if (order.deliveryDetails) {
      deliveryHtml = `
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 30px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px;">
          <tr>
            <th style="padding: 15px; text-align: left; color: #166534; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #bbf7d0;">Delivery Details (Admin)</th>
          </tr>
          <tr>
            <td style="padding: 15px; color: #14532d; font-size: 14px; white-space: pre-wrap;">${order.deliveryDetails}</td>
          </tr>
        </table>
      `;
    }

    const mailOptions = {
      from: `"NOVA X STORE" <${process.env.EMAIL_USER}>`,
      to: order.user.email,
      subject: `Receipt & Credentials for Order #${order.orderId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; background-color: #f4f4f5; padding: 20px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <tr>
              <td style="background-color: #000000; padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px;">NOVA X STORE</h1>
                <p style="color: #a1a1aa; margin: 5px 0 0 0; font-size: 14px;">Payment Receipt & Delivery</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px 30px;">
                <h2 style="margin: 0 0 20px 0; color: #18181b; font-size: 20px;">Hi there,</h2>
                <p style="margin: 0 0 30px 0; color: #52525b; font-size: 16px; line-height: 1.5;">Thank you for your purchase. Your order has been verified and provisioned.</p>
                
                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 30px;">
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 2px solid #e4e4e7; color: #71717a; font-weight: bold; font-size: 12px; text-transform: uppercase;">Order ID</td>
                    <td style="padding: 10px 0; border-bottom: 2px solid #e4e4e7; text-align: right; color: #71717a; font-weight: bold; font-size: 12px; text-transform: uppercase;">Date & Time</td>
                  </tr>
                  <tr>
                    <td style="padding: 15px 0; border-bottom: 1px solid #f4f4f5; color: #27272a; font-weight: 500;">#${order.orderId}</td>
                    <td style="padding: 15px 0; border-bottom: 1px solid #f4f4f5; text-align: right; color: #52525b;">${dateStr}</td>
                  </tr>
                  <tr>
                    <td style="padding: 15px 0; border-bottom: 1px solid #f4f4f5; color: #27272a; font-weight: bold; font-size: 12px; text-transform: uppercase;">Payment Method</td>
                    <td style="padding: 15px 0; border-bottom: 1px solid #f4f4f5; text-align: right; color: #27272a; font-weight: 500;">${paymentMethod}</td>
                  </tr>
                </table>

                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 30px; background-color: #fafafa; border-radius: 6px;">
                  <tr>
                    <th style="padding: 15px; text-align: left; color: #71717a; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #e4e4e7;">Item</th>
                    <th style="padding: 15px; text-align: right; color: #71717a; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #e4e4e7;">Amount</th>
                  </tr>
                  <tr>
                    <td style="padding: 15px; color: #18181b; font-weight: 500;">${order.product}</td>
                    <td style="padding: 15px; text-align: right; color: #18181b; font-weight: 500;">₹${order.price}</td>
                  </tr>
                  <tr>
                    <td style="padding: 15px; font-weight: bold; color: #000000; border-top: 2px solid #e4e4e7;">Total Paid</td>
                    <td style="padding: 15px; text-align: right; font-weight: bold; color: #000000; border-top: 2px solid #e4e4e7; font-size: 18px;">₹${order.price}</td>
                  </tr>
                </table>

                ${configHtml}
                ${deliveryHtml}

                <div style="text-align: center; margin-top: 40px;">
                  <a href="https://discord.gg/novaxhost" style="display: inline-block; background-color: #000000; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">Claim on Discord</a>
                </div>
              </td>
            </tr>
            <tr>
              <td style="background-color: #f4f4f5; padding: 20px; text-align: center; border-top: 1px solid #e4e4e7;">
                <p style="margin: 0; color: #a1a1aa; font-size: 12px;">© ${new Date().getFullYear()} NOVA X STORE. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log("Confirmation/Receipt email sent to", order.user.email);
  } catch (err) {
    console.error("Error sending order confirmation email:", err);
  }
}
