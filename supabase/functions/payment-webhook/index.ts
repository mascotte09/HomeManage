// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

declare const Deno: any;

function normalizeVietQrPayload(payload: Record<string, unknown>) {
  const nested = (payload.data as Record<string, unknown> | undefined) ||
    (payload.transaction as Record<string, unknown> | undefined) ||
    (payload.payment as Record<string, unknown> | undefined) ||
    {};

  const amount =
    (nested.amount as number | undefined) ??
    (nested.transferAmount as number | undefined) ??
    (nested.totalAmount as number | undefined) ??
    (payload.amount as number | undefined) ??
    (payload.totalAmount as number | undefined) ??
    null;

  const status =
    (nested.status as string | undefined) ??
    (nested.state as string | undefined) ??
    (payload.status as string | undefined) ??
    (payload.state as string | undefined) ??
    null;

  const reference =
    (nested.reference as string | undefined) ||
    (nested.description as string | undefined) ||
    (nested.remark as string | undefined) ||
    (nested.memo as string | undefined) ||
    (payload.reference as string | undefined) ||
    (payload.payment_reference as string | undefined) ||
    (payload.paymentRef as string | undefined) ||
    (payload.description as string | undefined) ||
    null;

  return {
    amount: Number(amount || 0),
    status: String(status || '').trim().toLowerCase(),
    reference: reference ? String(reference) : null,
    invoice_id: (payload.invoice_id as string | undefined) || (payload.invoiceId as string | undefined) || null,
  };
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const webhookSecret = Deno.env.get('WEBHOOK_SECRET') || '';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

function getSignatureHeader(headers: Headers): string {
  return (
    headers.get('x-webhook-signature') ||
    headers.get('x-signature') ||
    headers.get('x-hub-signature') ||
    ''
  );
}

function normalizeSignature(signature: string): string {
  return signature.trim().replace(/^sha256=/i, '').replace(/^hmac-sha256=/i, '');
}

async function verifyWebhookSignature(req: Request, bodyText: string): Promise<boolean> {
  if (!webhookSecret) return false;

  const providedSignature = normalizeSignature(getSignatureHeader(req.headers));
  if (!providedSignature) return false;

  const encoder = new TextEncoder();
  const secretKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBytes = await crypto.subtle.sign('HMAC', secretKey, encoder.encode(bodyText));
  const expectedSignature = Array.from(new Uint8Array(signatureBytes))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return providedSignature.toLowerCase() === expectedSignature.toLowerCase();
}

async function resolveInvoiceId(payload: Record<string, unknown>): Promise<{ id: string; source: string } | null> {
  const invoicePayload = payload.invoice as Record<string, unknown> | undefined;
  const explicitInvoiceId =
    (payload.invoice_id as string | undefined) ||
    (payload.invoiceId as string | undefined) ||
    (invoicePayload?.id as string | undefined);

  if (explicitInvoiceId) {
    return { id: String(explicitInvoiceId), source: 'invoice_id' };
  }

  const metadataPayload = payload.metadata as Record<string, unknown> | undefined;
  const reference =
    (payload.reference as string | undefined) ||
    (payload.payment_reference as string | undefined) ||
    (payload.paymentRef as string | undefined) ||
    (metadataPayload?.reference as string | undefined);

  if (!reference) {
    return null;
  }

  const { data, error } = await supabase
    .from('invoices')
    .select('id')
    .eq('payment_reference', String(reference))
    .limit(1);

  if (!error && data && data.length > 0) {
    return { id: String(data[0].id), source: 'payment_reference' };
  }

  if (/^\d+$/.test(String(reference))) {
    return { id: String(reference), source: 'invoice_id_from_reference' };
  }

  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Only POST is supported' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const bodyText = await req.text();
  if (!bodyText) {
    return new Response(JSON.stringify({ success: false, error: 'Empty request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!await verifyWebhookSignature(req, bodyText)) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized: invalid webhook signature' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload = JSON.parse(bodyText) as Record<string, unknown>;
    const normalizedPayload = normalizeVietQrPayload(payload);
    const { amount, status, reference } = normalizedPayload;

    const invoiceMatch = await resolveInvoiceId({
      ...payload,
      ...normalizedPayload,
    });
    if (!invoiceMatch) {
      return new Response(JSON.stringify({ success: false, error: 'invoice_id or payment_reference is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, total_amount, amount_already_pay, debit_amount, payment_reference')
      .eq('id', invoiceMatch.id)
      .single();

    if (invoiceError || !invoice) {
      return new Response(JSON.stringify({ success: false, error: 'Invoice not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const totalAmount = Number(invoice.total_amount || 0);
    const incomingAmount = Number(amount || 0);
    const currentAlreadyPaid = Number(invoice.amount_already_pay || 0);
    const nextAlreadyPaid = Math.min(totalAmount, currentAlreadyPaid + incomingAmount);
    const nextDebitAmount = totalAmount - nextAlreadyPaid;
    const normalizedStatus = String(status || '').trim().toLowerCase();
    const isSuccessful = ['success', 'paid', 'completed', 'succeeded', 'settled', 'confirmed'].includes(normalizedStatus);

    if (!isSuccessful) {
      return new Response(JSON.stringify({ success: false, error: 'Payment status not successful' }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        amount_already_pay: nextAlreadyPaid,
        debit_amount: nextDebitAmount,
        payment_reference: reference || invoice.payment_reference || null,
        payment_status: 'paid',
        payment_confirmed_at: new Date().toISOString(),
      })
      .eq('id', invoiceMatch.id);

    if (updateError) {
      return new Response(JSON.stringify({ success: false, error: updateError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, invoice_id: invoiceMatch.id, debit_amount: nextDebitAmount, source: invoiceMatch.source }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
