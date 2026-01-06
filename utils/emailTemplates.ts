// Comprehensive Email Templates Service for Alpha Dentkart
// Includes promotional, transactional, and notification email templates

import { Order, Product } from '../types';

/**
 * Email template types
 */
export type EmailTemplateType =
    | 'welcome'
    | 'order_confirmation'
    | 'order_status'
    | 'verification'
    | 'password_reset'
    | 'promotional'
    | 'abandoned_cart'
    | 'product_recommendation'
    | 'newsletter'
    | 'special_offer';

/**
 * Common email header with Alpha Dentkart branding
 */
const getEmailHeader = (title: string = 'Alpha Dentkart') => `
  <tr>
    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold; letter-spacing: -0.5px;">${title}</h1>
      <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px; opacity: 0.9; letter-spacing: 2px; text-transform: uppercase;">Premium Dental Supplies</p>
    </td>
  </tr>
`;

/**
 * Common email footer
 */
const getEmailFooter = () => `
  <tr>
    <td style="background-color: #f8f8f8; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
      <div style="margin-bottom: 20px;">
        <a href="#" style="display: inline-block; margin: 0 10px; color: #667eea; text-decoration: none;">
          <img src="https://via.placeholder.com/24" alt="Facebook" style="width: 24px; height: 24px;">
        </a>
        <a href="#" style="display: inline-block; margin: 0 10px; color: #667eea; text-decoration: none;">
          <img src="https://via.placeholder.com/24" alt="Twitter" style="width: 24px; height: 24px;">
        </a>
        <a href="#" style="display: inline-block; margin: 0 10px; color: #667eea; text-decoration: none;">
          <img src="https://via.placeholder.com/24" alt="Instagram" style="width: 24px; height: 24px;">
        </a>
      </div>
      <p style="color: #999999; font-size: 12px; margin: 10px 0;">
        © ${new Date().getFullYear()} Alpha Dentkart. All rights reserved.
      </p>
      <p style="color: #999999; font-size: 11px; margin: 10px 0;">
        <a href="#" style="color: #667eea; text-decoration: none;">Unsubscribe</a> | 
        <a href="#" style="color: #667eea; text-decoration: none;">Privacy Policy</a> | 
        <a href="#" style="color: #667eea; text-decoration: none;">Contact Us</a>
      </p>
    </td>
  </tr>
`;

/**
 * Base email wrapper
 */
const wrapEmail = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alpha Dentkart</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          ${content}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * 1. Welcome Email Template
 */
export const getWelcomeEmail = (customerName: string, userType?: string) => {
    const content = `
    ${getEmailHeader('Welcome to Alpha Dentkart! 🎉')}
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 28px;">Hi ${customerName}! 👋</h2>
        <p style="color: #666666; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
          Welcome to <strong>Alpha Dentkart</strong> - your trusted partner for premium dental supplies!
        </p>
        
        ${userType === 'dental-doctor' ? `
        <div style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <p style="margin: 0; color: #333; font-size: 15px;">
            🏥 <strong>Special Benefits for Dental Professionals:</strong><br>
            • Exclusive professional discounts<br>
            • Priority customer support<br>
            • Access to latest dental equipment<br>
            • Bulk order benefits
          </p>
        </div>
        ` : ''}
        
        <div style="background-color: #f8f9fa; padding: 25px; border-radius: 12px; margin: 25px 0;">
          <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 18px;">🎁 Welcome Offer!</h3>
          <p style="margin: 0 0 15px 0; color: #666; font-size: 15px;">
            Get <strong style="color: #667eea; font-size: 24px;">15% OFF</strong> on your first order!
          </p>
          <div style="background-color: #667eea; color: white; padding: 12px 20px; border-radius: 8px; display: inline-block; font-weight: bold; letter-spacing: 1px;">
            WELCOME15
          </div>
          <p style="margin: 15px 0 0 0; color: #999; font-size: 12px;">
            Valid for 7 days • Minimum order ₹500
          </p>
        </div>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
          <tr>
            <td align="center">
              <a href="#" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                Start Shopping →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    ${getEmailFooter()}
  `;
    return wrapEmail(content);
};

/**
 * 2. Order Confirmation Email Template
 */
export const getOrderConfirmationEmail = (
    customerName: string,
    orderId: string,
    orderTotal: number,
    orderItems: Array<{ name: string; quantity: number; price: number }>,
    shippingAddress?: string
) => {
    const itemsHTML = orderItems.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eeeeee;">
        <div style="font-weight: 500; color: #333; margin-bottom: 4px;">${item.name}</div>
        <div style="font-size: 13px; color: #999;">Qty: ${item.quantity}</div>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eeeeee; text-align: right; font-weight: bold; color: #333;">
        ₹${(item.price * item.quantity).toLocaleString('en-IN')}
      </td>
    </tr>
  `).join('');

    const content = `
    ${getEmailHeader('Order Confirmed! ✅')}
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #333333; margin: 0 0 10px 0; font-size: 26px;">Thank you, ${customerName}!</h2>
        <p style="color: #666666; font-size: 16px; margin: 0 0 30px 0;">
          Your order has been confirmed and will be processed shortly.
        </p>
        
        <div style="background: linear-gradient(135deg, #10b98115 0%, #10b98125 100%); border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <div style="font-size: 14px; color: #666; margin-bottom: 8px;">Order Number</div>
          <div style="font-size: 24px; font-weight: bold; color: #10b981;">#${orderId}</div>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 25px; border-radius: 12px; margin: 25px 0;">
          <h3 style="margin: 0 0 20px 0; color: #333; font-size: 18px;">Order Summary</h3>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${itemsHTML}
            <tr>
              <td style="padding: 16px 12px 0 12px; text-align: right; font-size: 14px; color: #666;">Subtotal:</td>
              <td style="padding: 16px 12px 0 12px; text-align: right; font-weight: bold; color: #333;">₹${orderTotal.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px 16px 12px; text-align: right; font-size: 18px; font-weight: bold; color: #333; border-top: 2px solid #667eea;">Total:</td>
              <td style="padding: 8px 12px 16px 12px; text-align: right; font-size: 20px; font-weight: bold; color: #667eea; border-top: 2px solid #667eea;">₹${orderTotal.toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </div>
        
        ${shippingAddress ? `
        <div style="margin: 25px 0;">
          <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">📦 Shipping Address</h4>
          <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">${shippingAddress}</p>
        </div>
        ` : ''}
        
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
          <tr>
            <td align="center">
              <a href="#" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: bold; display: inline-block;">
                Track Your Order
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    ${getEmailFooter()}
  `;
    return wrapEmail(content);
};

/**
 * 3. Promotional Email Template - Special Offer
 */
export const getPromotionalEmail = (
    customerName: string,
    offerTitle: string,
    offerDescription: string,
    discountPercent: number,
    couponCode: string,
    validUntil: string
) => {
    const content = `
    ${getEmailHeader('🎉 Special Offer Just for You!')}
    <tr>
      <td style="padding: 0;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 10px;">🎁</div>
          <h2 style="color: #ffffff; margin: 0 0 15px 0; font-size: 32px; font-weight: bold;">${offerTitle}</h2>
          <p style="color: #ffffff; margin: 0; font-size: 18px; opacity: 0.95;">${offerDescription}</p>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <p style="color: #333; font-size: 18px; margin: 0 0 30px 0;">
          Hi ${customerName},
        </p>
        
        <div style="text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #fff5f5 0%, #fef5ff 100%); border-radius: 16px; margin: 30px 0;">
          <div style="font-size: 72px; font-weight: bold; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 10px;">
            ${discountPercent}% OFF
          </div>
          <p style="color: #666; font-size: 16px; margin: 0 0 25px 0;">
            Use coupon code at checkout
          </p>
          <div style="background-color: #ffffff; border: 2px dashed #667eea; padding: 20px 30px; border-radius: 12px; display: inline-block;">
            <div style="font-size: 28px; font-weight: bold; color: #667eea; letter-spacing: 3px;">${couponCode}</div>
          </div>
          <p style="color: #999; font-size: 13px; margin: 20px 0 0 0;">
            ⏰ Valid until ${validUntil}
          </p>
        </div>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 35px 0;">
          <tr>
            <td align="center">
              <a href="#" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 10px; font-size: 17px; font-weight: bold; display: inline-block; box-shadow: 0 6px 12px rgba(102, 126, 234, 0.3); text-transform: uppercase; letter-spacing: 1px;">
                Shop Now →
              </a>
            </td>
          </tr>
        </table>
        
        <p style="color: #999; font-size: 12px; text-align: center; margin: 30px 0 0 0;">
          *Terms and conditions apply. Cannot be combined with other offers.
        </p>
      </td>
    </tr>
    ${getEmailFooter()}
  `;
    return wrapEmail(content);
};

/**
 * 4. Abandoned Cart Email Template
 */
export const getAbandonedCartEmail = (
    customerName: string,
    cartItems: Array<{ name: string; price: number; image?: string }>,
    cartTotal: number
) => {
    const itemsHTML = cartItems.slice(0, 3).map(item => `
    <tr>
      <td style="padding: 15px;">
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="width: 80px; padding-right: 15px;">
              <div style="width: 80px; height: 80px; background-color: #f0f0f0; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                ${item.image ? `<img src="${item.image}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">` : '📦'}
              </div>
            </td>
            <td>
              <div style="font-weight: 600; color: #333; margin-bottom: 5px;">${item.name}</div>
              <div style="color: #667eea; font-weight: bold; font-size: 16px;">₹${item.price.toLocaleString('en-IN')}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

    const content = `
    ${getEmailHeader('You Left Something Behind! 🛒')}
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #333333; margin: 0 0 15px 0; font-size: 26px;">Hi ${customerName},</h2>
        <p style="color: #666666; font-size: 16px; line-height: 1.7; margin: 0 0 25px 0;">
          We noticed you left some items in your cart. Don't worry, we've saved them for you!
        </p>
        
        <div style="background-color: #f8f9fa; border-radius: 12px; padding: 20px; margin: 25px 0;">
          <h3 style="margin: 0 0 20px 0; color: #333; font-size: 18px;">Your Cart Items:</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; overflow: hidden;">
            ${itemsHTML}
          </table>
          <div style="text-align: right; padding: 20px 15px 10px; border-top: 2px solid #667eea; margin-top: 15px;">
            <span style="color: #666; font-size: 14px; margin-right: 10px;">Total:</span>
            <span style="color: #667eea; font-size: 24px; font-weight: bold;">₹${cartTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>
        
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 8px;">
          <p style="margin: 0; color: #92400e; font-size: 15px;">
            ⚡ <strong>Complete your purchase now and get 10% OFF!</strong><br>
            Use code: <strong style="font-size: 18px;">COMPLETE10</strong>
          </p>
        </div>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
          <tr>
            <td align="center">
              <a href="#" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block; box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);">
                Complete Your Purchase
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    ${getEmailFooter()}
  `;
    return wrapEmail(content);
};

/**
 * 5. Product Recommendation Email Template
 */
export const getProductRecommendationEmail = (
    customerName: string,
    products: Array<{ name: string; price: number; image?: string; discount?: number }>
) => {
    const productsHTML = products.map(product => `
    <td style="width: 33.33%; padding: 15px; vertical-align: top;">
      <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.3s;">
        <div style="width: 100%; height: 180px; background-color: #f0f0f0; display: flex; align-items: center; justify-center; font-size: 48px;">
          ${product.image ? `<img src="${product.image}" style="width: 100%; height: 100%; object-fit: cover;">` : '🦷'}
        </div>
        <div style="padding: 20px;">
          <h4 style="margin: 0 0 10px 0; color: #333; font-size: 15px; font-weight: 600; height: 40px; overflow: hidden;">${product.name}</h4>
          <div style="margin-bottom: 15px;">
            ${product.discount ? `
              <span style="color: #999; text-decoration: line-through; font-size: 13px; margin-right: 8px;">₹${product.price.toLocaleString('en-IN')}</span>
              <span style="color: #667eea; font-weight: bold; font-size: 18px;">₹${(product.price * (1 - product.discount / 100)).toLocaleString('en-IN')}</span>
              <span style="background-color: #ef4444; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-left: 5px;">${product.discount}% OFF</span>
            ` : `
              <span style="color: #667eea; font-weight: bold; font-size: 18px;">₹${product.price.toLocaleString('en-IN')}</span>
            `}
          </div>
          <a href="#" style="background-color: #667eea; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 13px; font-weight: bold; display: inline-block; width: 100%; text-align: center; box-sizing: border-box;">
            View Product
          </a>
        </div>
      </div>
    </td>
  `).join('');

    const content = `
    ${getEmailHeader('Recommended for You 🌟')}
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #333333; margin: 0 0 15px 0; font-size: 26px;">Hi ${customerName}!</h2>
        <p style="color: #666666; font-size: 16px; line-height: 1.7; margin: 0 0 30px 0;">
          Based on your interests, we've handpicked these products just for you:
        </p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 20px; border-radius: 12px;">
          <tr>
            ${productsHTML}
          </tr>
        </table>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 35px 0;">
          <tr>
            <td align="center">
              <a href="#" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-size: 15px; font-weight: bold; display: inline-block;">
                View All Products
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    ${getEmailFooter()}
  `;
    return wrapEmail(content);
};

/**
 * 6. Newsletter Email Template
 */
export const getNewsletterEmail = (
    title: string,
    articles: Array<{ title: string; excerpt: string; image?: string; link: string }>
) => {
    const articlesHTML = articles.map(article => `
    <tr>
      <td style="padding: 25px 0; border-bottom: 1px solid #eeeeee;">
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="width: 150px; padding-right: 20px; vertical-align: top;">
              <div style="width: 150px; height: 100px; background-color: #f0f0f0; border-radius: 8px; overflow: hidden;">
                ${article.image ? `<img src="${article.image}" style="width: 100%; height: 100%; object-fit: cover;">` : '📰'}
              </div>
            </td>
            <td style="vertical-align: top;">
              <h3 style="margin: 0 0 10px 0; color: #333; font-size: 18px; font-weight: 600;">
                <a href="${article.link}" style="color: #333; text-decoration: none;">${article.title}</a>
              </h3>
              <p style="margin: 0 0 12px 0; color: #666; font-size: 14px; line-height: 1.6;">${article.excerpt}</p>
              <a href="${article.link}" style="color: #667eea; text-decoration: none; font-weight: 600; font-size: 14px;">
                Read More →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

    const content = `
    ${getEmailHeader('📰 ' + title)}
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #333333; margin: 0 0 10px 0; font-size: 28px;">${title}</h2>
        <p style="color: #666666; font-size: 15px; margin: 0 0 30px 0;">
          ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
        
        <table width="100%" cellpadding="0" cellspacing="0">
          ${articlesHTML}
        </table>
      </td>
    </tr>
    ${getEmailFooter()}
  `;
    return wrapEmail(content);
};

/**
 * Export all templates
 */
export const EmailTemplates = {
    welcome: getWelcomeEmail,
    orderConfirmation: getOrderConfirmationEmail,
    promotional: getPromotionalEmail,
    abandonedCart: getAbandonedCartEmail,
    productRecommendation: getProductRecommendationEmail,
    newsletter: getNewsletterEmail
};
