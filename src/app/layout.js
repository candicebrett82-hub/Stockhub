import "./globals.css";
export const metadata = { title: "StockHub", description: "Warehouse Stock Register" };
export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
