// Removes password/encryption from an uploaded PDF (e.g. an eAadhaar PDF, which
// ships encrypted with a user password) so the stored copy opens without a
// password. Uses MuPDF's WASM build — no native binary to compile, so it runs
// unchanged under Electron's bundled Node.
//
// The password is used only in-memory here and is never persisted.

/** Thrown when a PDF is encrypted and the supplied password is missing/wrong. */
export class PdfPasswordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfPasswordError";
  }
}

function looksLikePdf(fileName: string, contentType: string): boolean {
  return (
    contentType.toLowerCase() === "application/pdf" ||
    fileName.toLowerCase().endsWith(".pdf")
  );
}

/**
 * If `buffer` is an encrypted PDF, decrypt it with `password` and return an
 * unencrypted PDF. If it is not a PDF, or is a PDF that isn't encrypted, the
 * original buffer is returned unchanged.
 *
 * @throws PdfPasswordError if the PDF is encrypted and the password is
 *   missing or incorrect.
 */
export async function removePdfPasswordIfPresent(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  password: string | undefined,
): Promise<Buffer> {
  if (!looksLikePdf(fileName, contentType)) return buffer;

  // Dynamic import so the WASM module only loads when a PDF is actually
  // processed (keeps other requests light).
  const mupdf = await import("mupdf");

  let doc: import("mupdf").Document | null = null;
  try {
    doc = mupdf.Document.openDocument(new Uint8Array(buffer), "application/pdf");

    if (!doc.needsPassword()) {
      return buffer; // not encrypted — store as-is
    }

    if (!password) {
      throw new PdfPasswordError(
        "This PDF is password protected. Please provide its password.",
      );
    }

    const authenticated = doc.authenticatePassword(password);
    // Return codes: 0 = failed. Non-zero = success (user and/or owner password).
    if (!authenticated) {
      throw new PdfPasswordError("The password for this PDF is incorrect.");
    }

    const pdf = doc.asPDF();
    if (!pdf) return buffer;

    // `encrypt=none` is required — MuPDF keeps the existing encryption on save
    // by default, which would leave the stored copy password protected.
    const out = pdf.saveToBuffer("encrypt=none,garbage=3");
    return Buffer.from(out.asUint8Array());
  } catch (err) {
    if (err instanceof PdfPasswordError) throw err;
    // Any other MuPDF failure (corrupt file, unsupported): surface a clear error.
    throw new PdfPasswordError(
      "Could not process this PDF. Please check the file and password.",
    );
  } finally {
    doc?.destroy();
  }
}
