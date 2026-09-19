export const metadata = {
  title: "Quotebot",
  description: "Instant estimates for home service businesses.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
