import Link from "next/link";
import TagSEO from "@/components/TagSEO";
import config from "@/config";


const PrivacyPolicy = () => {
  return (
    <div className="max-w-xl mx-auto">
      <TagSEO title={`Privacy Policy | ${config.appName}`} />

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
          </svg>{" "}
          Back
        </Link>
        <h1 className="text-3xl font-bold pb-6">Privacy Policy for AutoInvoice</h1>

        <pre
          className="leading-relaxed whitespace-pre-wrap"
          style={{ fontFamily: "sans-serif" }}
        >
          {`Privacy Policy
Last Updated: October 15, 2025

Welcome to AutoInvoice (https://autoinvoice.pro
). Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information.

1. Information We Collect

We collect the following personal information when you use our website:

Name

Email address

Payment information

Invoices and client details

Phone number

We also collect non-personal data such as cookies to help improve the functionality and performance of our website.

2. How We Use Your Information

We use your data to:

Process orders and manage invoices

Operate and improve our services

Communicate with you regarding your account and updates

3. Data Sharing

We do not share your personal or non-personal data with any third parties.

4. Cookies

AutoInvoice uses cookies to enhance your browsing experience and support essential website functions. You can disable cookies in your browser settings if you prefer.

5. Children’s Privacy

AutoInvoice does not knowingly collect or store any information from children under the age of 13.

6. Updates to This Privacy Policy

We may update this Privacy Policy from time to time. When changes occur, we will notify you by email.

7. Contact Us

If you have any questions about this Privacy Policy or how your data is handled, please contact us at:
Email: automateitcontact@gmail.com

© 2025 AutoInvoice. All rights reserved.`}
        </pre>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
