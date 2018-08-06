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
              <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta.3/css/bootstrap.min.css" integrity="sha384-Zug+QiDoJOrZ5t4lssLdxGhVrurbmBWopoEl+M6BdEfwnCJZtKxi1KgxUyJq13dy" crossOrigin="anonymous" />

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