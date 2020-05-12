import Document, { Head, Main, NextScript } from 'next/document'

export default class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }

  render() {
    const styles =  `#__next {
              height: 100% 
            }`;
    return (
      <html style={{height: '100%'}}>
        <Head>
          <style>          { styles }

           
          </style>
<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css" integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous"></link>

          <style>{`body { margin: 0 } /* custom! */`}</style>
        </Head>
        <body style={{height: '100%'}}>
          <Main />
          <NextScript />
        </body>
      </html>
    )
  }
}