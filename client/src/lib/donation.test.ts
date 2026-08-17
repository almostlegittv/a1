import { describe, expect, it } from "vitest";
import { DONATION_SEPARATION_COPY, PAYPAL_QR_URL, PAYPAL_RECIPIENT } from "./donation";

describe("PayPal donation route", () => {
  it("uses the supplied managed QR asset and keeps donations separate from game support", () => {
    expect(PAYPAL_QR_URL).toBe("/manus-storage/almostlegit-paypal-qr_6fe37e5a.jpg");
    expect(PAYPAL_RECIPIENT).toBe("Brandon Whitecotton");
    expect(DONATION_SEPARATION_COPY).toContain("separate from the game queue");
  });
});
