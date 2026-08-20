import { describe, expect, it } from "vitest";
import { DONATION_SEPARATION_COPY, PAYPAL_QR_URL, PAYPAL_RECIPIENT } from "./donation";

describe("PayPal donation route", () => {
  it("uses the supplied bundled QR asset and keeps donations separate from game support", () => {
    expect(PAYPAL_QR_URL).toBe("/assets/almostlegit-paypal-qr.jpg");
    expect(PAYPAL_RECIPIENT).toBe("Brandon Whitecotton");
    expect(DONATION_SEPARATION_COPY).toContain("separate from the game queue");
  });
});
