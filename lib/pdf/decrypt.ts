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
        "This Aadhaar PDF is password protected. Tick “password protected” and enter its password.",
      );
    }

    const authenticated = doc.authenticatePassword(password);
    // Return codes: 0 = failed. Non-zero = success (user and/or owner password).
    if (!authenticated) {
      throw new PdfPasswordError(
        "The Aadhaar PDF password is incorrect. Please re-enter it and try again.",
      );
    }

    const pdf = doc.asPDF();
    if (!pdf) {
      throw new PdfPasswordError(
        "Could not unlock this PDF. Please check the file and password.",
      );
    }

    // `encrypt=none` is required — MuPDF keeps the existing encryption on save
    // by default, which would leave the stored copy password protected.
    const out = Buffer.from(pdf.saveToBuffer("encrypt=none,garbage=3").asUint8Array());

    // Safety net: never store a file that is still encrypted. Re-open the
    // decrypted output and confirm it no longer needs a password.
    let check: import("mupdf").Document | null = null;
    try {
      check = mupdf.Document.openDocument(new Uint8Array(out), "application/pdf");
      if (check.needsPassword()) {
        throw new PdfPasswordError(
          "The Aadhaar could not be fully decrypted, so it was not saved.",
        );
      }
    } finally {
      check?.destroy();
    }

    return out;
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
