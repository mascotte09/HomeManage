import { normalizeVietQrPayload } from './paymentWebhookUtils';

describe('normalizeVietQrPayload', () => {
  it('extracts invoice reference and amount from a VietQR-style payload', () => {
    const payload = {
      eventType: 'TRANSFER_SUCCESS',
      data: {
        amount: 1500000,
        description: 'INV-42',
        status: 'SUCCESS',
      },
    };

    expect(normalizeVietQrPayload(payload)).toEqual({
      amount: 1500000,
      status: 'success',
      reference: 'INV-42',
      invoice_id: null,
    });
  });

  it('uses nested transaction fields when present', () => {
    const payload = {
      transaction: {
        amount: 800000,
        status: 'PAID',
        reference: 'invoice-99',
      },
    };

    expect(normalizeVietQrPayload(payload)).toEqual({
      amount: 800000,
      status: 'paid',
      reference: 'invoice-99',
      invoice_id: null,
    });
  });

  it('reads common VietQR alternative fields', () => {
    const payload = {
      payment: {
        transferAmount: 1200000,
        state: 'COMPLETED',
        remark: 'INV-77',
      },
    };

    expect(normalizeVietQrPayload(payload)).toEqual({
      amount: 1200000,
      status: 'completed',
      reference: 'INV-77',
      invoice_id: null,
    });
  });
});
