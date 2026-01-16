// src/app/api/download-catalog/route.ts
import { NextResponse } from 'next/server';

// This is your Firebase Storage URL for the PDF
const PDF_URL = 'https://firebasestorage.googleapis.com/v0/b/imedawebsite-98ced.firebasestorage.app/o/company-assets%2FCatalogue2025-26.pdf?alt=media&token=7742f046-32b4-4925-97ee-64d61a2e5f5e';

export async function GET() {
  try {
    // Fetch the PDF from Firebase Storage on the server-side
    const response = await fetch(PDF_URL);

    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }

    // Get the response body as a stream
    const body = response.body as ReadableStream<Uint8Array>;

    // Create new headers to force download
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', 'attachment; filename="IMEDA-Catalogue-2025-26.pdf"');

    // Return a new response with the PDF stream and correct headers
    return new NextResponse(body, {
      status: 200,
      headers: headers,
    });

  } catch (error) {
    console.error('Error proxying PDF download:', error);
    return new NextResponse('Error downloading file.', { status: 500 });
  }
}
