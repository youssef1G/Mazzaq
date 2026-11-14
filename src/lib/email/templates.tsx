import type { CSSProperties, ReactNode } from "react";

const palette = {
  ink: "#241a14",
  cocoa: "#4a2f25",
  cream: "#f6efe4",
  paper: "#fbf7f0",
  brass: "#a87732",
  muted: "#7d6b5d",
};

function EmailLayout({
  preview,
  children,
  locale = "en",
}: {
  preview: string;
  children: ReactNode;
  locale?: "en" | "ar";
}) {
  const arabic = locale === "ar";
  return (
    <html lang={locale} dir={arabic ? "rtl" : "ltr"}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{preview}</title>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: palette.cream,
          color: palette.ink,
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        }}
      >
        <div style={{ display: "none", maxHeight: 0, overflow: "hidden" }}>
          {preview}
        </div>
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ backgroundColor: palette.cream, padding: "32px 16px" }}
        >
          <tr>
            <td align="center">
              <table
                role="presentation"
                width="100%"
                cellPadding={0}
                cellSpacing={0}
                style={{
                  maxWidth: 560,
                  backgroundColor: palette.paper,
                  border: `1px solid #e7dccb`,
                }}
              >
                <tr>
                  <td style={{ padding: "28px 36px 20px" }}>
                    <div
                      style={{
                        fontFamily: "Georgia, 'Times New Roman', serif",
                        fontSize: 26,
                        letterSpacing: 5,
                        color: palette.ink,
                      }}
                    >
                      {arabic ? "مزاق" : "MAZZAQ"}
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        fontFamily: "Georgia, 'Times New Roman', serif",
                        fontSize: arabic ? 20 : 15,
                        letterSpacing: arabic ? 0 : 2,
                        color: palette.brass,
                      }}
                    >
                      {arabic ? "Mazzaق" : "مزاق"}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      borderTop: "1px solid #e7dccb",
                      padding: "32px 36px 36px",
                      fontSize: 15,
                      lineHeight: 1.7,
                      color: palette.cocoa,
                    }}
                  >
                    {children}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      borderTop: "1px solid #e7dccb",
                      padding: "20px 36px 28px",
                      fontSize: 12,
                      lineHeight: 1.6,
                      color: palette.muted,
                    }}
                  >
                    Mazzaق ·{" "}
                    {arabic
                      ? "١٤ شارع ٩، المعادي، القاهرة"
                      : "14 Street 9, Maadi, Cairo"}
                    <br />
                    {arabic
                      ? "يُخبز حسب الطلب · توصيل القاهرة من الثلاثاء إلى الأحد"
                      : "Baked to order · Cairo delivery Tuesday to Sunday"}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
}

function Paragraph({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <p
      style={{
        margin: "0 0 16px",
        fontSize: 15,
        lineHeight: 1.7,
        ...style,
      }}
    >
      {children}
    </p>
  );
}

function Button({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      style={{
        display: "inline-block",
        margin: "8px 0 20px",
        padding: "13px 22px",
        backgroundColor: palette.ink,
        color: palette.paper,
        textDecoration: "none",
        fontSize: 13,
        letterSpacing: 1.4,
        textTransform: "uppercase",
      }}
    >
      {children}
    </a>
  );
}

export function VerificationEmail({
  name,
  url,
}: {
  name: string;
  url: string;
}) {
  return (
    <EmailLayout preview="Confirm your Mazzaق account">
      <h1
        style={{
          margin: "0 0 18px",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 30,
          fontWeight: 400,
          lineHeight: 1.2,
        }}
      >
        Confirm your table.
      </h1>
      <Paragraph>Hello {name},</Paragraph>
      <Paragraph>
        Thank you for joining Mazzaق. Confirm your email address and we will
        keep you close to the next batch out of the oven.
      </Paragraph>
      <Button href={url}>Confirm email</Button>
      <Paragraph>
        If you did not create an account, you can ignore this message.
      </Paragraph>
      <Paragraph style={{ color: palette.muted, fontSize: 12 }}>
        Link: {url}
      </Paragraph>
    </EmailLayout>
  );
}

export function ResetPasswordEmail({
  name,
  url,
}: {
  name: string;
  url: string;
}) {
  return (
    <EmailLayout preview="Reset your Mazzaق password">
      <h1
        style={{
          margin: "0 0 18px",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 30,
          fontWeight: 400,
          lineHeight: 1.2,
        }}
      >
        A new key.
      </h1>
      <Paragraph>Hello {name},</Paragraph>
      <Paragraph>
        We received a request to reset your Mazzaق password. Choose a new one
        below. The link expires shortly and can only be used once.
      </Paragraph>
      <Button href={url}>Reset password</Button>
      <Paragraph>
        If you did not ask for this, your account is still safe. You can ignore
        this email.
      </Paragraph>
      <Paragraph style={{ color: palette.muted, fontSize: 12 }}>
        Link: {url}
      </Paragraph>
    </EmailLayout>
  );
}

export function PasswordChangedEmail({ name }: { name: string }) {
  return (
    <EmailLayout preview="Your Mazzaق password was changed">
      <h1
        style={{
          margin: "0 0 18px",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 30,
          fontWeight: 400,
          lineHeight: 1.2,
        }}
      >
        Your password was changed.
      </h1>
      <Paragraph>Hello {name},</Paragraph>
      <Paragraph>
        This is a confirmation that the password on your Mazzaق account was
        changed. If you made this change, there is nothing else to do.
      </Paragraph>
      <Paragraph>
        If this was not you, reply to this email immediately and we will help
        you secure the account.
      </Paragraph>
    </EmailLayout>
  );
}

export function WelcomeEmail({ name }: { name: string }) {
  return (
    <EmailLayout preview="Welcome to Mazzaق">
      <h1
        style={{
          margin: "0 0 18px",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 30,
          fontWeight: 400,
          lineHeight: 1.2,
        }}
      >
        Welcome to the table.
      </h1>
      <Paragraph>Hello {name},</Paragraph>
      <Paragraph>
        Your Mazzaق account is ready. Orders, addresses and the cakes you keep
        coming back to now live in one quiet place.
      </Paragraph>
      <Paragraph>
        We bake to order, in small batches, with cultured butter and a little
        patience.
      </Paragraph>
    </EmailLayout>
  );
}

type OrderEmailItem = {
  name: string;
  variant: string;
  quantity: number;
  lineTotal: string;
};

export function OrderConfirmationEmail({
  name,
  orderNumber,
  total,
  paymentMethod,
  items,
  fulfillment,
  when,
  address,
  instapayHandle,
  orderUrl,
  locale = "en",
}: {
  name: string;
  orderNumber: string;
  total: string;
  paymentMethod: "cod" | "instapay";
  items: OrderEmailItem[];
  fulfillment: string;
  when: string;
  address?: string;
  instapayHandle?: string;
  orderUrl: string;
  locale?: "en" | "ar";
}) {
  const arabic = locale === "ar";
  const copy = arabic
    ? {
        preview: `استلمنا طلبك ${orderNumber}`,
        heading: "طلبك في الفرن.",
        greeting: `مرحباً ${name}،`,
        body: "شكراً لك على طلبك. استلمناه وسنبدأ الخبز قريباً من أجلك.",
        order: `الطلب`,
        total: "الإجمالي:",
        payment: "الدفع:",
        cod: "الدفع عند الاستلام",
        instapay: "تحويل إنستاباي",
        instapayLead1: "يمكنك تحويل الإجمالي إلى",
        instapayLead2:
          "ورفع الإيصال من صفحة طلبك في أي وقت حتى تسليم طلبك. سنؤكد بمجرد وصوله.",
        cta: "عرض طلبك",
        questions: "لديك سؤال؟ رد على هذا البريد وسنساعدك.",
      }
    : {
        preview: `Order ${orderNumber} received`,
        heading: "It's in the oven.",
        greeting: `Hello ${name},`,
        body: "Thank you for your order. We have received it and will begin baking for your",
        order: "ORDER",
        total: "Total:",
        payment: "Payment:",
        cod: "cash on delivery",
        instapay: "InstaPay transfer",
        instapayLead1: "You can transfer the total to",
        instapayLead2:
          "and upload the receipt from your order page whenever you are ready, until your order is delivered. We will confirm as soon as it clears.",
        cta: "View your order",
        questions: "Questions? Reply to this email and we will help.",
      };

  return (
    <EmailLayout preview={copy.preview} locale={locale}>
      <h1
        style={{
          margin: "0 0 18px",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: arabic ? 24 : 30,
          fontWeight: 400,
          lineHeight: 1.25,
        }}
      >
        {copy.heading}
      </h1>
      <Paragraph>{copy.greeting}</Paragraph>
      <Paragraph>
        {arabic
          ? copy.body
          : `${copy.body} ${fulfillment.toLowerCase()} window.`}
      </Paragraph>
      <Paragraph style={{ fontSize: 13, letterSpacing: 1.2 }}>
        {copy.order} {orderNumber}
      </Paragraph>
      <table
        role="presentation"
        width="100%"
        cellPadding={0}
        cellSpacing={0}
        style={{ margin: "0 0 18px", fontSize: 14 }}
      >
        <tbody>
          {items.map((item, index) => (
            <tr key={`${item.name}-${index}`}>
              <td
                style={{ padding: "9px 0", borderBottom: "1px solid #e7dccb" }}
              >
                {item.quantity} × {item.name}
                <br />
                <span style={{ fontSize: 12, color: palette.muted }}>
                  {item.variant}
                </span>
              </td>
              <td
                align="right"
                style={{
                  padding: "9px 0",
                  borderBottom: "1px solid #e7dccb",
                  whiteSpace: "nowrap",
                }}
              >
                {item.lineTotal}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Paragraph>
        <strong>
          {copy.total} {total}
        </strong>
        <br />
        {copy.payment} {paymentMethod === "cod" ? copy.cod : copy.instapay}
      </Paragraph>
      <Paragraph>
        {fulfillment}: {when}
        {address ? (
          <>
            <br />
            {address}
          </>
        ) : null}
      </Paragraph>
      {paymentMethod === "instapay" && instapayHandle ? (
        <>
          <Paragraph>
            {copy.instapayLead1} <strong>{instapayHandle}</strong>{" "}
            {copy.instapayLead2}
          </Paragraph>
          <Button href={orderUrl}>{copy.cta}</Button>
        </>
      ) : null}
      <Paragraph style={{ color: palette.muted, fontSize: 12 }}>
        {copy.questions}
      </Paragraph>
    </EmailLayout>
  );
}

export function ContactEmail({
  name,
  email,
  message,
}: {
  name: string;
  email: string;
  message: string;
}) {
  return (
    <EmailLayout preview={`New message from ${name}`}>
      <h1
        style={{
          margin: "0 0 18px",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 28,
          fontWeight: 400,
        }}
      >
        A note from the website.
      </h1>
      <Paragraph>
        <strong>{name}</strong> · {email}
      </Paragraph>
      <Paragraph>{message}</Paragraph>
    </EmailLayout>
  );
}
