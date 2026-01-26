import Link from "next/link";
import TagSEO from "@/components/TagSEO";
import config from "@/config";



const TOS = () => {
  return (
    <div className="max-w-xl mx-auto">
      <TagSEO title={`Terms and Conditions | ${config.appName}`} />

      <div className="p-5">
        <Link href="/" className="btn btn-ghost">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z"
              clipRule="evenodd"
            />
          </svg>
          Back
        </Link>
        <h1 className="text-3xl font-bold pb-6">Privacy Policy for AutoInvoice</h1>

        <pre
          className="leading-relaxed whitespace-pre-wrap"
          style={{ fontFamily: "sans-serif" }}
        >
          {`Terms of Service
Last Updated: October 15, 2025

Welcome to AutoInvoice (https://autoinvoice.pro
). By accessing or using our website, you agree to be bound by these Terms of Service. Please read them carefully.

1. Use of the Service

AutoInvoice provides tools to help freelancers and small businesses manage their invoices. You agree to use the service only for lawful purposes and in accordance with these Terms.

2. Account Registration

To use certain features, you may need to create an account. You agree to provide accurate, current, and complete information and to keep your account details secure. You are responsible for all activities under your account.

3. Payments

If you purchase any paid services, you agree to provide valid payment information and authorize us to charge the applicable fees. All payments are non-refundable except as required by law.

4. User Content

You retain ownership of the data and content you upload, including invoices and client details. By using our service, you grant AutoInvoice a limited right to process this data solely to provide and improve the service.

5. Prohibited Uses

You agree not to use AutoInvoice to:

Violate any laws or regulations

Distribute malicious software or spam

Infringe on the rights of others

6. Limitation of Liability

AutoInvoice is provided “as is” and “as available.” We are not liable for any indirect, incidental, or consequential damages resulting from your use of the service.

7. Termination

We may suspend or terminate your account if you violate these Terms or use the service in a way that may harm AutoInvoice or others.

8. Updates to These Terms

We may update these Terms of Service from time to time. When changes occur, we will notify users by email.

9. Governing Law

These Terms are governed by and construed in accordance with the laws of France. Any disputes shall be subject to the exclusive jurisdiction of the courts of France.

10. Contact Us

If you have any questions about these Terms, please contact us at:
Email: automateitcontact@gmail.com

© 2025 AutoInvoice. All rights reserved.`}
        </pre>
      </div>
    </div>
  );
};

export default TOS;
