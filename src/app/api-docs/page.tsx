import Script from 'next/script';

export const metadata = { title: 'API reference · Neuro-AI' };

/** Interactive API reference rendered by Scalar from the generated OpenAPI document. */
export default function ApiDocsPage() {
  return (
    <>
      <div id="api-reference" data-url="/api/v1/openapi.json" />
      <Script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference" strategy="afterInteractive" />
    </>
  );
}
