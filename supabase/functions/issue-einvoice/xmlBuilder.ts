// supabase/functions/issue-einvoice/xmlBuilder.ts

export interface InvoiceCustomer {
  buyer?: string;
  cusCode?: string;
  cusName?: string;
  cusAddress?: string;
  cusPhone?: string;
  cusEmail?: string;
  cusTaxCode?: string;
  cusIdentification?: string;
}

export interface InvoiceLine {
  code: string;
  feature?: number;
  name: string;
  unit?: string;
  quantity: number;
  price: number;
  discount?: number;
  discountAmount?: number;

  /**
   * EasyInvoice:
   * 0  = 0%
   * 5  = 5%
   * 8  = 8%
   * 10 = 10%
   * -1 = không chịu thuế
   */
  vatRate: number;

  /**
   * Chỉ dùng khi VATRate = -3
   */
  vatRateOther?: number;

  total: number;
  vatAmount: number;
  amount: number;
  extra?: string;
}

export interface BuildInvoiceXmlParams {
  ikey: string;

  locationCode?: string;
  locationName?: string;
  locationAddress?: string;

  storeCode?: string;
  storeName?: string;

  customer: InvoiceCustomer;

  paymentMethod: string;

  arisingDate: string;

  currencyUnit?: string;
  exchangeRate?: number;

  lines: InvoiceLine[];

  /**
   * Tổng tiền hàng trước thuế
   */
  total: number;

  /**
   * Tổng VAT
   */
  vatAmount: number;

  /**
   * Tổng tiền thanh toán
   */
  amount: number;

  discountAmount?: number;

  amountInWords?: string;

  extra?: string;
}

function escapeXml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function numberValue(value: number | undefined | null): string {
  return String(Number(value ?? 0));
}

function lineXml(line: InvoiceLine): string {
  return `
    <Product>
      <Code>${escapeXml(line.code)}</Code>
      <Feature>${numberValue(line.feature ?? 1)}</Feature>
      <ProdName>${escapeXml(line.name)}</ProdName>
      <ProdUnit>${escapeXml(line.unit ?? "")}</ProdUnit>
      <ProdQuantity>${numberValue(line.quantity)}</ProdQuantity>
      <ProdPrice>${numberValue(line.price)}</ProdPrice>
      <Discount>${numberValue(line.discount ?? 0)}</Discount>
      <DiscountAmount>${numberValue(line.discountAmount ?? 0)}</DiscountAmount>
      <Total>${numberValue(line.total)}</Total>
      <VATRate>${numberValue(line.vatRate)}</VATRate>
      ${
        line.vatRate === -3
          ? `<VATRateOther>${numberValue(line.vatRateOther ?? 0)}</VATRateOther>`
          : ""
      }
      <VATAmount>${numberValue(line.vatAmount)}</VATAmount>
      <Amount>${numberValue(line.amount)}</Amount>
      ${
        line.extra
          ? `<Extra>${escapeXml(line.extra)}</Extra>`
          : ""
      }
    </Product>
  `;
}

export function buildInvoiceXml(
  params: BuildInvoiceXmlParams
): string {
  const {
    ikey,
    locationCode,
    locationName,
    locationAddress,
    storeCode,
    storeName,
    customer,
    paymentMethod,
    arisingDate,
    currencyUnit = "VND",
    exchangeRate = 1,
    lines,
    total,
    vatAmount,
    amount,
    discountAmount = 0,
    amountInWords = "",
    extra = "",
  } = params;

  return `
<Invoices>
  <Inv>
    <Invoice>

      <Ikey>${escapeXml(ikey)}</Ikey>

      ${
        locationCode
          ? `<LocationCode>${escapeXml(locationCode)}</LocationCode>`
          : ""
      }

      ${
        locationName
          ? `<LocationName>${escapeXml(locationName)}</LocationName>`
          : ""
      }

      ${
        locationAddress
          ? `<LocationAddress>${escapeXml(locationAddress)}</LocationAddress>`
          : ""
      }

      ${
        storeCode
          ? `<StoreCode>${escapeXml(storeCode)}</StoreCode>`
          : ""
      }

      ${
        storeName
          ? `<StoreName>${escapeXml(storeName)}</StoreName>`
          : ""
      }

      <Buyer>${escapeXml(customer.buyer ?? "")}</Buyer>

      <CusCode>${escapeXml(customer.cusCode ?? "")}</CusCode>

      <CusName>${escapeXml(customer.cusName ?? "")}</CusName>

      <CusAddress>${escapeXml(customer.cusAddress ?? "")}</CusAddress>

      <CusPhone>${escapeXml(customer.cusPhone ?? "")}</CusPhone>

      <CusEmails>${escapeXml(customer.cusEmail ?? "")}</CusEmails>

      <CusTaxCode>${escapeXml(customer.cusTaxCode ?? "")}</CusTaxCode>

      <CusIdenification>
        ${escapeXml(customer.cusIdentification ?? "")}
      </CusIdenification>

      <PaymentMethod>
        ${escapeXml(paymentMethod)}
      </PaymentMethod>

      <ArisingDate>${escapeXml(arisingDate)}</ArisingDate>

      <ExchangeRate>${numberValue(exchangeRate)}</ExchangeRate>

      <CurrencyUnit>${escapeXml(currencyUnit)}</CurrencyUnit>

      <Extra>${escapeXml(extra)}</Extra>

      <Products>
        ${lines.map(lineXml).join("\n")}
      </Products>

      <Total>${numberValue(total)}</Total>

      <VATAmount>${numberValue(vatAmount)}</VATAmount>

      <Amount>${numberValue(amount)}</Amount>

      <DiscountAmount>${numberValue(discountAmount)}</DiscountAmount>

      <GrossValue>${numberValue(total)}</GrossValue>

      <VatAmount0>0</VatAmount0>
      <VatAmount5>0</VatAmount5>
      <VatAmount8>0</VatAmount8>
      <VatAmount10>0</VatAmount10>

      <AmountInWords>
        ${escapeXml(amountInWords)}
      </AmountInWords>

    </Invoice>
  </Inv>
</Invoices>
`.trim();
}