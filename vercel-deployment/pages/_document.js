import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <link rel="manifest" href="/manifest.json" />
          <link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png" />
          <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png" />
          <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
          <meta name="theme-color" content="#08051a" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
