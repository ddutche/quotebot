export const metadata = {
  title: "Scoparity",
  description: "Itemized estimates for home service businesses, confirmed by the contractor.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
